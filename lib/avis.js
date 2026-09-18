/**
 * Affichage des notes et avis clients sur la vitrine.
 *
 * Coupe tant que la boutique n'a pas de vrais avis : les notes du catalogue
 * sont des valeurs de demonstration (scripts/build_catalogue.mjs) et les
 * temoignages de l'accueil sont des textes d'exemple. Les montrer comme avis
 * clients tromperait l'acheteur. Repasser a true quand de vrais avis existent
 * (et les saisir dans l'administration, champs note et avis).
 */
export const AVIS_AFFICHES = false;
