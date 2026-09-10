/**
 * Envoi d'une photo par un client, pour un tableau personnalise.
 *
 * C'est la seule route de televersement ouverte sans compte : elle est donc
 * plus tenue que celle de l'administration. Le fichier ne touche jamais le
 * disque, il transite vers Cloudinary dans un sous-dossier separe des oeuvres
 * du catalogue, et un freinage par adresse limite l'usage detourne.
 */
import { Router } from 'express';
import multer from 'multer';
import { slugifier } from '../partage/produit.js';
import { cloudinaryActif, envoyerImage } from '../partage/cloudinary.js';

export const routesPersonnalisation = Router();

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TAILLE_MAX = 15 * 1024 * 1024;

const televersement = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAILLE_MAX, files: 1 },
});

/* ------------------------------------------------------------- freinage */

const FENETRE = 10 * 60 * 1000;
const MAX_PAR_FENETRE = 8;
const compteurs = new Map();

// Une Map qui ne se vide jamais finit par tenir toute la memoire du service :
// on purge les adresses dont la fenetre est passee a chaque appel.
function tropDeDemandes(ip) {
  const maintenant = Date.now();
  for (const [cle, essais] of compteurs) {
    const restants = essais.filter((t) => maintenant - t < FENETRE);
    if (restants.length) compteurs.set(cle, restants);
    else compteurs.delete(cle);
  }
  const essais = compteurs.get(ip) || [];
  if (essais.length >= MAX_PAR_FENETRE) return true;
  compteurs.set(ip, [...essais, maintenant]);
  return false;
}

/* ----------------------------------------------------------------- route */

routesPersonnalisation.post(
  '/personnalisation/image',
  (req, res, suite) => {
    if (tropDeDemandes(req.ip || 'inconnu')) {
      res.status(429).json({ erreur: 'Trop d envois d affilee. Reessayez dans quelques minutes.' });
      return;
    }
    suite();
  },
  televersement.single('fichier'),
  async (req, res) => {
    try {
      if (!cloudinaryActif) {
        res.status(503).json({
          erreur: 'L envoi de photos n est pas configure sur le serveur.',
        });
        return;
      }
      if (!req.file) {
        res.status(400).json({ erreur: 'Aucun fichier recu.' });
        return;
      }
      if (!TYPES.includes(req.file.mimetype)) {
        res.status(400).json({ erreur: 'Format non accepte : envoyez un JPEG, un PNG ou un WebP.' });
        return;
      }

      // Le nom d origine vient du client : on ne garde qu un slug, jamais le
      // chemin ni l extension tels quels.
      const base = slugifier(req.file.originalname.replace(/\.[^.]+$/, '')) || 'photo';
      const envoi = await envoyerImage(req.file.buffer, `client-${base}`, {
        sousDossier: 'personnalisation',
      });

      res.json({ ok: true, ...envoi });
    } catch (e) {
      console.error('[personnalisation]', e);
      res.status(500).json({ erreur: 'Le traitement de l image a echoue.' });
    }
  },
);

// Multer signale un fichier trop lourd par une exception : sans ce filet elle
// ressortirait en 500, alors que le client peut agir en reduisant sa photo.
routesPersonnalisation.use((err, req, res, suite) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ erreur: 'Photo trop lourde : 15 Mo au maximum.' });
    return;
  }
  suite(err);
});
