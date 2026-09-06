import { Router } from 'express';
import multer from 'multer';
import { store, lireReglages, REGLAGES_DEFAUT } from '../db.js';
import { exigerAdmin } from '../auth.js';
import { slugifier } from '../partage/produit.js';
import { cloudinaryActif, envoyerImage } from '../partage/cloudinary.js';

export const routesDivers = Router();

/* ------------------------------------------------------------- reglages */

routesDivers.get('/reglages', exigerAdmin, async (req, res) => {
  try {
    res.json({ reglages: await lireReglages() });
  } catch (e) {
    console.error('[reglages GET]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

// Seules ces cles sont acceptees : un champ inconnu envoye par erreur ne peut
// pas polluer les reglages lus par toutes les pages du site.
const CLES = Object.keys(REGLAGES_DEFAUT);

routesDivers.put('/reglages', exigerAdmin, async (req, res) => {
  try {
    const corps = req.body || {};
    const patch = {};
    for (const cle of CLES) {
      if (!(cle in corps)) continue;
      const v = corps[cle];
      patch[cle] = typeof v === 'boolean' ? v : String(v ?? '').trim().slice(0, 400);
    }
    if (!Object.keys(patch).length) {
      res.status(400).json({ erreur: 'Rien a enregistrer.' });
      return;
    }
    const maj = await store.reglages.ecrire(patch);
    res.json({ ok: true, reglages: { ...REGLAGES_DEFAUT, ...maj } });
  } catch (e) {
    console.error('[reglages PUT]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

/* -------------------------------------------------------- televersement */

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/tiff'];

// En memoire, jamais sur le disque : celui de Render est ephemere, et le
// fichier ne fait que transiter vers Cloudinary.
const televersement = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

routesDivers.post('/televersement', exigerAdmin, televersement.single('fichier'), async (req, res) => {
  try {
    if (!cloudinaryActif) {
      res.status(503).json({
        erreur: 'Cloudinary n est pas configure sur le serveur : ajoutez '
          + 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.',
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({ erreur: 'Aucun fichier recu.' });
      return;
    }
    if (!TYPES.includes(req.file.mimetype)) {
      res.status(400).json({ erreur: 'Format non accepte (JPEG, PNG, WebP ou TIFF).' });
      return;
    }

    const base = slugifier(req.body?.nom || req.file.originalname.replace(/\.[^.]+$/, '')) || 'oeuvre';
    const envoi = await envoyerImage(req.file.buffer, base);
    res.json({ ok: true, stockage: 'cloudinary', ...envoi });
  } catch (e) {
    console.error('[televersement]', e);
    res.status(500).json({ erreur: 'Le traitement de l image a echoue.' });
  }
});

// multer signale ses propres erreurs (fichier trop lourd, champ inattendu)
// autrement qu'en levant : sans ce relais, le client recevrait du HTML.
routesDivers.use((err, req, res, suite) => {
  if (err && err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image trop lourde (25 Mo maximum).'
      : 'Fichier refuse.';
    res.status(400).json({ erreur: message });
    return;
  }
  suite(err);
});
