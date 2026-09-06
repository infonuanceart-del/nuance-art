import { CADRE_PAR_SLUG } from './taxonomie';

/** Formatte un montant en dirhams, sans décimales inutiles. */
export function dh(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('fr-MA').replace(/ | /g, ' ') + ' DH';
}

/** Prix d'une taille donnée, remise du produit appliquée. */
export function prixTaille(produit, taille, cadre = 'aucun') {
  const base = (taille?.prix || produit?.prixMin || 0) + (CADRE_PAR_SLUG[cadre]?.supp || 0);
  const remise = Number(produit?.promo) || 0;
  return {
    base,
    final: Math.round(base * (1 - remise / 100)),
    remise,
  };
}

/** Prix d'appel affiché sur les cartes catalogue. */
export function prixAffiche(produit) {
  const base = produit?.prixMin || 0;
  const remise = Number(produit?.promo) || 0;
  return { base, final: Math.round(base * (1 - remise / 100)), remise };
}

/** Livraison offerte au-dessus de ce montant. */
export const SEUIL_LIVRAISON = 600;
export const FRAIS_LIVRAISON = 45;

export function fraisLivraison(sousTotal) {
  return sousTotal >= SEUIL_LIVRAISON || sousTotal === 0 ? 0 : FRAIS_LIVRAISON;
}
