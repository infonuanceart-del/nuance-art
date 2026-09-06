import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../db.js';
import { signerJeton } from '../auth.js';

export const routesAdmin = Router();

// Freinage des essais repetes. En memoire du processus : suffisant pour une
// boutique a un seul administrateur, et remis a zero au redemarrage.
const essais = new Map();
const MAX = 5;
const FENETRE = 60_000;

function trop(cle) {
  const e = essais.get(cle);
  if (!e) return false;
  if (Date.now() - e.debut > FENETRE) {
    essais.delete(cle);
    return false;
  }
  return e.n >= MAX;
}

function noter(cle) {
  const e = essais.get(cle);
  if (!e || Date.now() - e.debut > FENETRE) essais.set(cle, { n: 1, debut: Date.now() });
  else e.n += 1;
}

routesAdmin.post('/connexion', async (req, res) => {
  try {
    const { email = '', motDePasse = '' } = req.body || {};
    const cle = req.ip || 'inconnu';

    if (trop(cle)) {
      res.status(429).json({ erreur: 'Trop de tentatives. Reessayez dans une minute.' });
      return;
    }

    const admin = await store.admins.parEmail(String(email).trim().toLowerCase());
    // Message identique dans les deux cas : on n'indique jamais si l'adresse existe.
    const ok = admin && bcrypt.compareSync(String(motDePasse), admin.hash || '');
    if (!ok) {
      noter(cle);
      res.status(401).json({ erreur: 'Identifiants incorrects.' });
      return;
    }

    essais.delete(cle);
    const nom = admin.nom || 'Administrateur';
    res.json({ ok: true, nom, jeton: signerJeton({ email: admin.email, nom }) });
  } catch (e) {
    console.error('[connexion]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

/**
 * Avec un jeton Bearer, la deconnexion se fait cote navigateur en jetant le
 * jeton. La route existe pour garder la meme surface d'API que la version Next
 * et pour offrir un point de sortie explicite au client.
 */
routesAdmin.post('/deconnexion', (req, res) => {
  res.json({ ok: true });
});
