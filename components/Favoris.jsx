'use client';

import Link from 'next/link';
import { useBoutique } from './Boutique';
import CarteProduit from './CarteProduit';
import { IcoCoeur } from './Icones';

export default function Favoris({ produits }) {
  const { favoris, pret } = useBoutique();

  if (!pret) return <div className="empty-state">Chargement…</div>;

  const liste = produits.filter((p) => favoris.includes(p.slug));

  if (liste.length === 0) {
    return (
      <div className="vide">
        <IcoCoeur size={44} />
        <h2 className="d3">Aucun favori pour l’instant</h2>
        <p className="lede" style={{ margin: '0.75rem auto 1.75rem' }}>
          Touchez le cœur sur une œuvre pour la retrouver ici, sur cet appareil.
        </p>
        <Link href="/tableaux" className="btn btn-primary">Parcourir le catalogue</Link>
      </div>
    );
  }

  return (
    <div className="grid-produits">
      {liste.map((p) => <CarteProduit key={p.slug} produit={p} />)}
    </div>
  );
}
