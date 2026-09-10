/**
 * Source de donnees de la vitrine. Deux modes, selon la cible de construction.
 *
 * BUILD_TARGET=static : la vitrine est exportee en fichiers, elle n'a plus
 * acces a rien au moment ou on la visite. Les pages lisent donc
 * data/snapshot.json, pris par scripts/snapshot.mjs juste avant la
 * construction. Le catalogue publie est alors fige : une oeuvre ajoutee dans
 * l'administration n'apparait qu'a la reconstruction suivante.
 *
 * Sinon (Vercel) : construction serveur, les pages interrogent l'API et Next
 * garde la reponse le temps indique par `revalidate`. Une oeuvre ajoutee dans
 * l'administration apparait donc seule, sans redeploiement, et une oeuvre
 * creee apres la construction est rendue a la premiere visite puisque
 * `dynamicParams` reste actif.
 *
 * Les fonctions gardent les memes noms et signatures dans les deux cas : les
 * pages ignorent lequel est actif.
 */
import fs from 'node:fs';
import path from 'node:path';

const STATIQUE = process.env.BUILD_TARGET === 'static';
const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const FICHIER = path.join(process.cwd(), 'data', 'snapshot.json');

/** Duree de fraicheur du catalogue, en secondes. Filet de securite : en
 *  fonctionnement normal c'est l'API qui purge, des qu'elle ecrit. */
export const FRAICHEUR = 120;

/** Etiquette du cache catalogue, purgee par app/api/revalidation. */
export const ETIQUETTE = 'catalogue';

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

/**
 * Va chercher le catalogue sur l'API.
 *
 * Le plan gratuit de Render s'endort : le premier appel apres une pause peut
 * demander une vingtaine de secondes. Ce n'est pas le visiteur qui attend —
 * Next sert la version precedente et rafraichit en arriere-plan — sauf a la
 * toute premiere construction, d'ou un delai large.
 */
async function depuisApi() {
  if (!API) {
    throw new Error(
      'NEXT_PUBLIC_API_URL est absent : la vitrine ne sait pas ou lire le catalogue.',
    );
  }

  const reponse = await fetch(`${API}/api/catalogue`, {
    // L'etiquette permet a l'API de purger ce cache des qu'elle ecrit, sans
    // enumerer les pages : toutes celles qui passent par cet appel tombent
    // ensemble. FRAICHEUR n'est plus que le filet, si la purge n'arrive pas.
    next: { revalidate: FRAICHEUR, tags: [ETIQUETTE] },
    signal: AbortSignal.timeout(120_000),
  });
  if (!reponse.ok) throw new Error(`L API a repondu ${reponse.status}`);
  return reponse.json();
}

/**
 * Le catalogue complet, dans le mode actif.
 *
 * En mode serveur on ne met rien en cache dans le module : c'est le cache de
 * `fetch` qui tient ce role, et lui sait expirer. Un cache maison ici
 * survivrait a la revalidation et regelerait le catalogue.
 */
async function donnees() {
  return STATIQUE ? instantane() : depuisApi();
}

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

/** L'API ne renvoie deja que les oeuvres actives ; le filtre reste par prudence. */
export async function lireProduits() {
  const { produits } = await donnees();
  return (produits || []).filter((p) => p.actif !== false);
}

export async function lireProduit(slug) {
  const produits = await lireProduits();
  return produits.find((p) => p.slug === slug) || null;
}

export async function lireReglages() {
  const { reglages } = await donnees();
  return { ...REGLAGES_DEFAUT, ...(reglages || {}) };
}

/** Date de l'instantane, affichable en pied de page si besoin. */
export async function dateInstantane() {
  const d = await donnees();
  return d.genere || null;
}
