/**
 * Point d'entrée unique de la couche données.
 *
 *   import { store } from '@/lib/store';
 *   const produits = await store().produits.tous();
 *
 * MONGODB_URI renseigné  -> MongoDB (Atlas ou local)
 * MONGODB_URI vide       -> .data/db.json (démo / dev sans installation)
 */
import { creerStoreJson } from './json.js';
import { creerStoreMongo } from './mongo.js';

let instance = null;

export function store() {
  if (instance) return instance;
  const uri = (process.env.MONGODB_URI || '').trim();
  instance = uri ? creerStoreMongo(uri) : creerStoreJson();
  return instance;
}

/** Réglages boutique + valeurs par défaut, pour ne jamais rendre une page vide. */
export const REGLAGES_DEFAUT = {
  promoActive: true,
  promoTitre: 'Ventes flash — jusqu’à -60 %',
  promoTexte: 'Sur une sélection de 30 œuvres. Cadre offert dès 900 DH d’achat.',
  promoFin: '',
  promoCode: 'NUANCE10',
  telephone: '06 45 44 88 24',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '212645448824',
  email: 'contact@nuanceart.ma',
  adresse: '20, rue Socrate — Casablanca',
};

export async function lireReglages() {
  try {
    const r = await store().reglages.lire();
    return { ...REGLAGES_DEFAUT, ...(r || {}) };
  } catch {
    return { ...REGLAGES_DEFAUT };
  }
}

/** Catalogue actif, trié, avec repli silencieux si la base est injoignable. */
export async function lireProduits() {
  try {
    const tous = await store().produits.tous();
    return (tous || []).filter((p) => p.actif !== false);
  } catch (e) {
    console.error('[store] catalogue indisponible :', e.message);
    return [];
  }
}

export async function lireProduit(slug) {
  try {
    const p = await store().produits.parSlug(slug);
    return p && p.actif !== false ? p : null;
  } catch {
    return null;
  }
}
