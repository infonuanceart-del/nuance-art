/**
 * Validation et mise en forme d'une œuvre saisie dans l'admin.
 * Le formulaire est libre ; c'est ici que l'on garantit que la base ne reçoit
 * que des champs connus, aux bons types — les pages publiques n'ont donc
 * jamais à se défendre contre une fiche incomplète.
 */
import { THEME_PAR_SLUG, FORMAT_PAR_SLUG, COULEUR_PAR_SLUG, PIECE_PAR_SLUG } from './taxonomie.js';

export const STATUTS_COMMANDE = ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'];

export const NOM_STATUT = {
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

/** « Nuit étoilée à Chefchaouen » -> « nuit-etoilee-a-chefchaouen » */
export function slugifier(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
}

const texte = (v, max) => String(v ?? '').trim().slice(0, max);
const nombre = (v, min, max, defaut = 0) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return defaut;
  return Math.min(max, Math.max(min, n));
};

/** Tailles triées par prix croissant, sans doublon de référence. */
function tailles(brut) {
  const vues = new Set();
  const liste = (Array.isArray(brut) ? brut : [])
    .map((t) => {
      const l = Math.round(nombre(t.l, 5, 400));
      const h = Math.round(nombre(t.h, 5, 400));
      return { l, h, prix: Math.round(nombre(t.prix, 0, 100000)), ref: `${l}x${h}` };
    })
    .filter((t) => {
      if (!t.l || !t.h || !t.prix || vues.has(t.ref)) return false;
      vues.add(t.ref);
      return true;
    })
    .sort((a, b) => a.prix - b.prix);
  return liste.slice(0, 12);
}

const filtrer = (brut, index) =>
  [...new Set(Array.isArray(brut) ? brut : [])].filter((s) => index[s]);

/**
 * @param {object} entree  corps de la requête
 * @param {object|null} base  fiche existante (modification) ou null (création)
 * @returns {{erreur?: string, produit?: object}}
 */
export function normaliserProduit(entree = {}, base = null) {
  const titre = texte(entree.titre ?? base?.titre, 140);
  if (!titre) return { erreur: 'Le titre est obligatoire.' };

  const image = texte(entree.image ?? base?.image, 400);
  if (!image) return { erreur: 'Une image est obligatoire.' };

  const theme = entree.theme ?? base?.theme;
  if (!THEME_PAR_SLUG[theme]) return { erreur: 'Thème inconnu.' };

  const grille = tailles(entree.tailles ?? base?.tailles);
  if (!grille.length) return { erreur: 'Renseignez au moins une taille avec un prix.' };

  const format = FORMAT_PAR_SLUG[entree.format ?? base?.format] ? (entree.format ?? base?.format) : 'portrait';
  const couleur = COULEUR_PAR_SLUG[entree.couleur ?? base?.couleur] ? (entree.couleur ?? base?.couleur) : 'beige';

  // Le ratio sert au studio d'essayage : on le déduit de la plus grande taille
  // quand il n'est pas fourni, pour qu'une fiche saisie à la main reste utilisable.
  const grande = grille.at(-1);
  const ratio = nombre(entree.ratio ?? base?.ratio, 0.2, 5, 0) || Number((grande.l / grande.h).toFixed(4));

  return {
    produit: {
      titre,
      artiste: texte(entree.artiste ?? base?.artiste, 120) || 'Artiste anonyme',
      epoque: texte(entree.epoque ?? base?.epoque, 60),
      technique: texte(entree.technique ?? base?.technique, 120),
      description: texte(entree.description ?? base?.description, 4000),
      theme,
      format,
      couleur,
      ratio,
      image,
      thumb: texte(entree.thumb ?? base?.thumb, 400) || image,
      source: texte(entree.source ?? base?.source, 400),
      tailles: grille,
      prixMin: grille[0].prix,
      pieces: filtrer(entree.pieces ?? base?.pieces, PIECE_PAR_SLUG),
      nouveaute: Boolean(entree.nouveaute ?? base?.nouveaute ?? false),
      bestseller: Boolean(entree.bestseller ?? base?.bestseller ?? false),
      promo: Math.round(nombre(entree.promo ?? base?.promo, 0, 90)),
      note: Number(nombre(entree.note ?? base?.note, 0, 5, 4.6).toFixed(1)),
      avis: Math.round(nombre(entree.avis ?? base?.avis, 0, 9999, 0)),
      actif: Boolean(entree.actif ?? base?.actif ?? true),
      ordre: Math.round(nombre(entree.ordre ?? base?.ordre, 0, 9999, 0)),
    },
  };
}
