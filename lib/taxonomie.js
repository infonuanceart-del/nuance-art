/**
 * Taxonomie de la boutique : thèmes, formats, pièces.
 * Partagée par le serveur (pages, sitemap) et le client (filtres, studio).
 * Les slugs correspondent à ceux produits par scripts/build_catalogue.mjs.
 */

export const THEMES = [
  {
    slug: 'art-abstrait',
    nom: 'Art abstrait',
    court: 'Abstrait',
    accroche: 'Entrelacs, étoiles à huit branches et carreaux : la géométrie pure, sans sujet.',
    seo: 'Tableaux abstraits et géométriques : zellige, entrelacs et arabesques pour un mur graphique.',
  },
  {
    slug: 'art-contemporain',
    nom: 'Art contemporain',
    court: 'Contemporain',
    accroche: 'Van Gogh, Gauguin, Degas : la touche libre et la couleur franche des modernes.',
    seo: 'Tableaux modernes et contemporains : Van Gogh, Monet, Degas, Gauguin, Sisley.',
  },
  {
    slug: 'heritage-marocain',
    nom: 'Héritage marocain',
    court: 'Héritage',
    accroche: 'Delacroix, Gérôme, Fromentin : le Maroc et le Maghreb vus par les grands peintres.',
    seo: 'Tableaux orientalistes : scènes marocaines, médinas et cavaliers par Delacroix et Gérôme.',
  },
  {
    slug: 'nature-paysage',
    nom: 'Nature & paysage',
    court: 'Nature',
    accroche: 'Paysages, jardins et fleurs, de la campagne française aux estampes de Hiroshige.',
    seo: 'Tableaux de paysage, jardins, fleurs et estampes japonaises de Hiroshige et Hokusai.',
  },
  {
    slug: 'art-islamique',
    nom: 'Art islamique',
    court: 'Art islamique',
    accroche: 'Miniatures persanes et mogholes : la couleur, l’or et le détail à hauteur de regard.',
    seo: 'Tableaux d’art islamique : miniatures persanes, mogholes et pages enluminées.',
  },
];

export const FORMATS = [
  { slug: 'portrait', nom: 'Portrait', desc: 'Vertical — idéal entre deux meubles' },
  { slug: 'paysage', nom: 'Paysage', desc: 'Horizontal — au-dessus d’un canapé' },
  { slug: 'carre', nom: 'Carré', desc: 'Équilibré — parfait en série' },
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
export const PIECE_PAR_SLUG = index(PIECES);
export const CADRE_PAR_SLUG = index(CADRES);

export const nomTheme = (s) => THEME_PAR_SLUG[s]?.nom || s;
export const nomFormat = (s) => FORMAT_PAR_SLUG[s]?.nom || s;
export const nomPiece = (s) => PIECE_PAR_SLUG[s]?.nom || s;
export const nomCadre = (s) => CADRE_PAR_SLUG[s]?.nom || s;
