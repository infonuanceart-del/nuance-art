import { cadreProduit, suppCadre } from './taxonomie.js';

/** Formatte un montant en dirhams, sans décimales inutiles. */
export function dh(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('fr-MA').replace(/ | /g, ' ') + ' DH';
}

/** Prix d'une taille donnée, supplément du cadre pour cette taille compris, remise appliquée. */
export function prixTaille(produit, taille, cadre = 'aucun') {
  const base = (taille?.prix || produit?.prixMin || 0) + suppCadre(cadreProduit(produit, cadre), taille);
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

/** Livraison offerte sur toutes les commandes, sans minimum d'achat
 * (demande de la cliente, sept. 2026 ; avant : 45 DH sous 600 DH). */
export const FRAIS_LIVRAISON = 0;

export function fraisLivraison() {
  return FRAIS_LIVRAISON;
}
