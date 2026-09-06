/**
 * Stockage des images d'œuvres sur Cloudinary.
 *
 * Le disque local ne convient qu'à un hébergement classique : sur Vercel ou
 * Render, les fichiers écrits dans public/ disparaissent au déploiement suivant.
 * Quand les variables Cloudinary sont renseignées, l'admin passe donc par ce
 * module ; sinon il retombe sur l'écriture locale, exactement comme MONGODB_URI
 * vide fait retomber la base sur .data/db.json.
 */
import { v2 as cloudinary } from 'cloudinary';

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLE = process.env.CLOUDINARY_API_KEY || '';
const SECRET = process.env.CLOUDINARY_API_SECRET || '';
const DOSSIER = process.env.CLOUDINARY_DOSSIER || 'nuance-art';

/** Les trois valeurs sont nécessaires : à moitié configuré, on préfère le disque. */
export const cloudinaryActif = Boolean(CLOUD && CLE && SECRET);

if (cloudinaryActif) {
  cloudinary.config({
    cloud_name: CLOUD,
    api_key: CLE,
    api_secret: SECRET,
    secure: true,
  });
}

/**
 * On envoie l'original une seule fois et on ne stocke que des URL de
 * transformation : la conversion webp et les deux largeurs sont faites par le
 * CDN à la demande. Changer une taille plus tard ne demandera aucun ré-envoi.
 */
const rendu = (publicId, largeur, qualite) =>
  cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: largeur, crop: 'limit', fetch_format: 'webp', quality: qualite }],
  });

/**
 * @param {Buffer} donnees  le fichier reçu
 * @param {string} nom      base du nom de fichier, déjà nettoyée
 * @returns {Promise<{image: string, thumb: string, ratio: number, publicId: string}>}
 */
export function envoyerImage(donnees, nom) {
  return new Promise((resoudre, rejeter) => {
    const flux = cloudinary.uploader.upload_stream(
      {
        folder: DOSSIER,
        public_id: nom,
        resource_type: 'image',
        overwrite: false,
        // Cloudinary ajoute son propre suffixe si le nom est déjà pris,
        // ce qui évite d'écraser l'image d'une autre œuvre.
        unique_filename: true,
      },
      (erreur, resultat) => {
        if (erreur || !resultat) {
          rejeter(new Error(erreur?.message || 'Cloudinary n’a pas accepté l’image.'));
          return;
        }
        resoudre({
          image: rendu(resultat.public_id, 1400, 82),
          thumb: rendu(resultat.public_id, 520, 74),
          ratio: Number((resultat.width / resultat.height).toFixed(4)),
          publicId: resultat.public_id,
        });
      },
    );
    flux.end(donnees);
  });
}
