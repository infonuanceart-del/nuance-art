import { revalidatePath } from 'next/cache';

/**
 * Purge le rendu statique de la boutique après une écriture dans l'admin.
 *
 * Les pages publiques sont pré-rendues (c'est ce qui les rend rapides et
 * indexables) : sans cet appel, une œuvre modifiée resterait invisible en
 * production jusqu'au prochain déploiement.
 *
 * ⚠ Le chemin doit contenir le groupe de routes. « / » seul ne purge que la
 * fiche demandée et laisse le catalogue et l'accueil sur leur ancienne version :
 * c'est « /(boutique) » qui fait cascader la purge sur tout ce qui hérite du
 * layout de la boutique.
 */
export function rafraichirBoutique() {
  try {
    revalidatePath('/(boutique)', 'layout');
  } catch (e) {
    // Une purge ratée ne doit jamais faire échouer l'enregistrement lui-même.
    console.error('[revalidation]', e.message);
  }
}
