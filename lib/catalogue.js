/**
 * Source de donnees de la vitrine, au moment de la construction.
 *
 * La vitrine est exportee en statique : elle n'a plus acces a la base. Les
 * pages lisent donc data/snapshot.json, pris par scripts/snapshot.mjs juste
 * avant la construction (script prebuild).
 *
 * Les fonctions gardent les noms et les signatures de l'ancien lib/store, pour
 * que les pages n'aient eu qu'un import a changer.
 */
import fs from 'node:fs';
import path from 'node:path';

const FICHIER = path.join(process.cwd(), 'data', 'snapshot.json');

let cache = null;

function instantane() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(FICHIER, 'utf8'));
  } catch {
    throw new Error(
      'data/snapshot.json est introuvable ou illisible.\n'
      + 'Lancez `npm run snapshot` (ou simplement `npm run build`, qui le fait) '
      + 'avec NEXT_PUBLIC_API_URL renseigne.',
    );
  }
  return cache;
}

export const REGLAGES_DEFAUT = {
  promoActive: true,
  promoTitre: 'Ventes flash',
  promoTexte: '',
  promoFin: '',
  promoCode: '',
  telephone: '',
  whatsapp: '',
  email: '',
  adresse: '',
};

/** L'API ne renvoie deja que les oeuvres actives ; le filtre reste par prudence. */
export async function lireProduits() {
  const { produits } = instantane();
  return (produits || []).filter((p) => p.actif !== false);
}

export async function lireProduit(slug) {
  const produits = await lireProduits();
  return produits.find((p) => p.slug === slug) || null;
}

export async function lireReglages() {
  const { reglages } = instantane();
  return { ...REGLAGES_DEFAUT, ...(reglages || {}) };
}

/** Date de l'instantane, affichable en pied de page si besoin. */
export async function dateInstantane() {
  return instantane().genere || null;
}
