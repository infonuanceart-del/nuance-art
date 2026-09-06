/**
 * Taxonomie de la boutique : thèmes, formats, couleurs, pièces.
 * Partagée par le serveur (pages, sitemap) et le client (filtres, studio).
 * Les slugs correspondent à ceux produits par scripts/build_catalogue.mjs.
 */

export const THEMES = [
  {
    slug: 'chefs-doeuvre',
    nom: "Chefs-d'œuvre",
    court: 'Chefs-d’œuvre',
    accroche: 'Les toiles qui ont fait l’histoire de l’art, rééditées en grand format.',
    seo: 'Reproductions de chefs-d’œuvre de la peinture à accrocher chez soi.',
  },
  {
    slug: 'orient-maroc',
    nom: 'Orient & Maroc',
    court: 'Orient & Maroc',
    accroche: 'Médinas, riads, lumière du Sud : le Maroc vu par les peintres voyageurs.',
    seo: 'Tableaux orientalistes et scènes marocaines pour un intérieur chaleureux.',
  },
  {
    slug: 'calligraphie',
    nom: 'Calligraphie',
    court: 'Calligraphie',
    accroche: 'Le geste arabe, l’encre et l’or, dans une lecture contemporaine.',
    seo: 'Tableaux de calligraphie arabe et folios enluminés.',
  },
  {
    slug: 'abstrait',
    nom: 'Abstrait & géométrique',
    court: 'Abstrait',
    accroche: 'Zellige, entrelacs et compositions libres : la forme pour elle-même.',
    seo: 'Tableaux abstraits et motifs géométriques inspirés du zellige.',
  },
  {
    slug: 'nature-botanique',
    nom: 'Nature & botanique',
    court: 'Nature',
    accroche: 'Planches botaniques, bouquets et natures mortes qui apaisent une pièce.',
    seo: 'Tableaux botaniques, fleurs et natures mortes.',
  },
  {
    slug: 'japandi',
    nom: 'Japandi & estampes',
    court: 'Japandi',
    accroche: 'Estampes japonaises : des aplats calmes, parfaits en chambre.',
    seo: 'Estampes japonaises ukiyo-e, style japandi.',
  },
  {
    slug: 'villes-voyages',
    nom: 'Villes & voyages',
    court: 'Villes',
    accroche: 'Ports, quais et façades : des fenêtres ouvertes sur ailleurs.',
    seo: 'Tableaux de villes, ports et paysages de voyage.',
  },
  {
    slug: 'portraits',
    nom: 'Portraits',
    court: 'Portraits',
    accroche: 'Des regards qui tiennent un mur à eux seuls.',
    seo: 'Portraits peints, classiques et modernes.',
  },
  {
    slug: 'noir-et-blanc',
    nom: 'Noir & blanc',
    court: 'Noir & blanc',
    accroche: 'Photographies et gravures, pour les intérieurs graphiques.',
    seo: 'Tableaux noir et blanc, photographie et gravure.',
  },
  {
    slug: 'affiches',
    nom: 'Affiches & lithographies',
    court: 'Affiches',
    accroche: 'L’esprit Belle Époque, à afficher dans une entrée ou un couloir.',
    seo: 'Affiches vintage et lithographies anciennes.',
  },
  {
    slug: 'animaux',
    nom: 'Animaux',
    court: 'Animaux',
    accroche: 'Planches ornithologiques et scènes animalières, un classique intemporel.',
    seo: 'Tableaux d’animaux et planches ornithologiques.',
  },
  {
    slug: 'boheme-berbere',
    nom: 'Bohème & berbère',
    court: 'Bohème',
    accroche: 'Tissages, tapis et motifs : la chaleur de l’artisanat au mur.',
    seo: 'Tableaux inspirés des tapis berbères et textiles anciens.',
  },
];

export const FORMATS = [
  { slug: 'portrait', nom: 'Portrait', desc: 'Vertical — idéal entre deux meubles' },
  { slug: 'paysage', nom: 'Paysage', desc: 'Horizontal — au-dessus d’un canapé' },
  { slug: 'carre', nom: 'Carré', desc: 'Équilibré — parfait en série' },
];

export const COULEURS = [
  { slug: 'beige', nom: 'Beige', hex: '#d6c3a5' },
  { slug: 'blanc', nom: 'Blanc', hex: '#f4f4f0' },
  { slug: 'noir', nom: 'Noir', hex: '#1a1a1a' },
  { slug: 'gris', nom: 'Gris', hex: '#8c8c8c' },
  { slug: 'or', nom: 'Or', hex: '#c69e4a' },
  { slug: 'terracotta', nom: 'Terracotta', hex: '#b25c3e' },
  { slug: 'rouge', nom: 'Rouge', hex: '#a32d2a' },
  { slug: 'rose', nom: 'Rose', hex: '#d69696' },
  { slug: 'vert', nom: 'Vert', hex: '#567054' },
  { slug: 'bleu', nom: 'Bleu', hex: '#3a5882' },
  { slug: 'violet', nom: 'Violet', hex: '#685082' },
  { slug: 'marron', nom: 'Marron', hex: '#604632' },
];

export const PIECES = [
  { slug: 'salon-moderne', nom: 'Salon moderne' },
  { slug: 'salon-marocain', nom: 'Salon marocain' },
  { slug: 'entree', nom: 'Entrée & couloir' },
  { slug: 'salle-a-manger', nom: 'Salle à manger' },
  { slug: 'chambre', nom: 'Chambre' },
  { slug: 'chambre-enfant', nom: 'Chambre d’enfant' },
  { slug: 'bureau', nom: 'Bureau' },
  { slug: 'hotel-restaurant', nom: 'Hôtel & restaurant' },
  { slug: 'cabinet', nom: 'Cabinet & clinique' },
];

/** Cadres proposés à la commande et dans le studio. */
export const CADRES = [
  { slug: 'aucun', nom: 'Sans cadre', supp: 0, hex: 'transparent', desc: 'Toile tendue sur châssis' },
  { slug: 'noir', nom: 'Noir mat', supp: 120, hex: '#1c1917', desc: 'Bois laqué 20 mm' },
  { slug: 'chene', nom: 'Chêne clair', supp: 150, hex: '#c79b68', desc: 'Chêne massif huilé' },
  { slug: 'blanc', nom: 'Blanc', supp: 120, hex: '#f2eee6', desc: 'Bois laqué 20 mm' },
  { slug: 'dore', nom: 'Doré', supp: 220, hex: '#c9a24d', desc: 'Feuille dorée à la main' },
];

const index = (arr) => Object.fromEntries(arr.map((x) => [x.slug, x]));

export const THEME_PAR_SLUG = index(THEMES);
export const FORMAT_PAR_SLUG = index(FORMATS);
export const COULEUR_PAR_SLUG = index(COULEURS);
export const PIECE_PAR_SLUG = index(PIECES);
export const CADRE_PAR_SLUG = index(CADRES);

export const nomTheme = (s) => THEME_PAR_SLUG[s]?.nom || s;
export const nomFormat = (s) => FORMAT_PAR_SLUG[s]?.nom || s;
export const nomCouleur = (s) => COULEUR_PAR_SLUG[s]?.nom || s;
export const nomPiece = (s) => PIECE_PAR_SLUG[s]?.nom || s;
export const nomCadre = (s) => CADRE_PAR_SLUG[s]?.nom || s;
