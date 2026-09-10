/**
 * Tableau personnalisé : le client fournit sa propre image.
 *
 * Le module est partagé avec l'API (serveur/partage/), car le prix d'une
 * commande n'est jamais celui envoyé par le navigateur : le serveur le
 * recalcule à partir de cette même grille.
 */
import { CADRE_PAR_SLUG } from './taxonomie.js';

/** Le slug qui identifie une ligne personnalisée dans le panier et les commandes. */
export const SLUG_PERSO = 'tableau-personnalise';

/**
 * Grille de formats. Un tirage sur mesure coûte plus cher qu'une réédition du
 * catalogue : le fichier est vérifié à la main et l'impression n'est pas
 * mutualisée avec une autre commande.
 */
export const TAILLES_PERSO = [
  { ref: 'p-30-40', l: 30, h: 40, prix: 340 },
  { ref: 'p-40-60', l: 40, h: 60, prix: 490 },
  { ref: 'p-50-70', l: 50, h: 70, prix: 690 },
  { ref: 'p-60-90', l: 60, h: 90, prix: 950 },
  { ref: 'p-80-120', l: 80, h: 120, prix: 1450 },
];

export const TAILLE_PERSO_PAR_REF = Object.fromEntries(TAILLES_PERSO.map((t) => [t.ref, t]));

/** Prix d'un tirage personnalisé, cadre compris. Aucune remise ne s'y applique. */
export function prixPerso(taille, cadre = 'aucun') {
  const base = (taille?.prix || 0) + (CADRE_PAR_SLUG[cadre]?.supp || 0);
  return { base, final: Math.round(base), remise: 0 };
}

/**
 * Résolution conseillée : 120 pixels par pouce à la taille demandée.
 *
 * En dessous, le tirage reste possible mais le grain devient visible de près ;
 * on prévient plutôt que de refuser, une photo de téléphone récente passe
 * largement en 40 × 60.
 */
export const PPP_CONSEILLE = 120;

export function pixelsConseilles(taille) {
  const pouces = (cm) => cm / 2.54;
  return {
    l: Math.round(pouces(taille.l) * PPP_CONSEILLE),
    h: Math.round(pouces(taille.h) * PPP_CONSEILLE),
  };
}

/** true si l'image envoyée suffit pour ce format. */
export function resolutionSuffisante(image, taille) {
  if (!image?.largeur || !image?.hauteur) return true;
  const vise = pixelsConseilles(taille);
  // l'image peut être présentée dans l'autre sens : on compare au mieux
  const grand = Math.max(image.largeur, image.hauteur);
  const petit = Math.min(image.largeur, image.hauteur);
  return grand >= Math.max(vise.l, vise.h) && petit >= Math.min(vise.l, vise.h);
}
