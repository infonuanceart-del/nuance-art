/**
 * Acces aux donnees. Contrairement a l'application Next, il n'y a pas de repli
 * sur un store fichier : le disque de Render est efface a chaque deploiement,
 * une base de fichiers y perdrait le catalogue et toutes les commandes.
 * MongoDB est donc obligatoire ici, et l'absence d'URI est une erreur franche.
 */
import { creerStoreMongo } from './partage/store/mongo.js';

const uri = (process.env.MONGODB_URI || '').trim();

if (!uri) {
  throw new Error(
    'MONGODB_URI est obligatoire pour l API. En local, renseignez-le dans '
    + '.env.local ; sur Render, dans les variables d environnement du service.',
  );
}

export const store = creerStoreMongo(uri);

export const REGLAGES_DEFAUT = {
  promoActive: true,
  promoTitre: 'Ventes flash — jusqu’à -60 %',
  promoTexte: '',
  promoFin: '',
  promoCode: '',
  telephone: '',
  whatsapp: '',
  email: '',
  adresse: '',
};

export async function lireReglages() {
  const enregistres = await store.reglages.lire();
  return { ...REGLAGES_DEFAUT, ...(enregistres || {}) };
}
