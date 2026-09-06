/**
 * API Nuance Art — service Node deploye sur Render.
 *
 * Sert de back-office a une vitrine exportee en statique et hebergee ailleurs :
 * catalogue, commandes, reglages, images. Aucune page n'est rendue ici.
 */
import './env.js';

import express from 'express';
import cors from 'cors';

import { routesAdmin } from './routes/admin.js';
import { routesProduits } from './routes/produits.js';
import { routesCommandes } from './routes/commandes.js';
import { routesDivers } from './routes/divers.js';

const app = express();

// Render place le service derriere son proxy : sans cela req.ip vaut l'adresse
// du proxy pour tout le monde, et le freinage des connexions devient global.
app.set('trust proxy', 1);
app.disable('x-powered-by');

/**
 * La vitrine est servie depuis un autre domaine : sans liste d'origines
 * autorisees, le navigateur bloquerait chaque appel. Les origines sont donnees
 * par ORIGINES_AUTORISEES, separees par des virgules.
 */
const origines = (process.env.ORIGINES_AUTORISEES || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origine, retour) {
    // Pas d'origine : appel serveur a serveur (script de pre-build, curl) — autorise.
    if (!origine) return retour(null, true);
    if (origines.includes(origine.replace(/\/$/, ''))) return retour(null, true);
    return retour(new Error(`Origine non autorisee : ${origine}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb' }));

/** Sonde de sante interrogee par Render. Ne touche pas la base. */
app.get('/sante', (req, res) => {
  res.json({ ok: true, service: 'nuance-art-api', heure: new Date().toISOString() });
});

app.use('/api/admin', routesAdmin);
app.use('/api', routesProduits);
app.use('/api', routesCommandes);
app.use('/api', routesDivers);

app.use((req, res) => {
  res.status(404).json({ erreur: 'Route inconnue' });
});

// Dernier filet : une exception non rattrapee doit sortir en JSON, jamais en
// page HTML d'Express, sinon le client tente de la lire comme une reponse.
app.use((err, req, res, suite) => {
  console.error('[erreur]', err);
  const refusCors = /Origine non autorisee/.test(err?.message || '');
  res.status(refusCors ? 403 : 500).json({ erreur: refusCors ? err.message : 'Erreur serveur' });
});

const PORT = process.env.PORT || 4310;

app.listen(PORT, () => {
  console.log(`API Nuance Art a l ecoute sur le port ${PORT}`);
  console.log(origines.length
    ? `Origines autorisees : ${origines.join(', ')}`
    : 'Aucune origine declaree : seuls les appels sans origine passeront.');
});
