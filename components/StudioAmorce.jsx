'use client';

import { useSearchParams } from 'next/navigation';
import Studio from './Studio';

/** Ouvre le studio sur l'œuvre passée dans l'URL (/studio?oeuvre=slug),
 *  ce qui permet aux cartes produit de pointer directement dessus. */
export default function StudioAmorce({ produits, pieces }) {
  const params = useSearchParams();
  const slug = params.get('oeuvre');

  // l'œuvre demandée passe en tête de la sélection proposée dans le panneau
  const ordonnees = slug
    ? [...produits.filter((p) => p.slug === slug), ...produits.filter((p) => p.slug !== slug)]
    : produits;

  return <Studio oeuvres={ordonnees.slice(0, 60)} pieces={pieces} slugInitial={slug} />;
}
