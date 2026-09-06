'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { appeler } from '@/lib/api';
import { useDonnees, EtatChargement } from '@/components/admin/useDonnees';
import FormulaireProduit from '@/components/admin/FormulaireProduit';

/**
 * L'oeuvre a modifier est designee par ?slug=… et non par un segment d'URL :
 * un export statique ne peut pas fabriquer une route dynamique pour un slug
 * qui n'existe pas encore au moment de la construction.
 * Sans slug, l'ecran sert a la creation.
 */
function Editeur() {
  const slug = useSearchParams().get('slug');

  const { donnees, erreur, chargement } = useDonnees(async () => {
    if (!slug) return { produit: null };
    return appeler(`/api/produits/${slug}`, { avecJeton: true });
  });

  const produit = donnees?.produit || null;

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="breadcrumb" style={{ padding: 0 }}>
            <Link href="/admin/produits">Œuvres</Link>
            <span>/</span>
            <span>{slug ? produit?.titre || '…' : 'Nouvelle œuvre'}</span>
          </p>
          <h1 className="d3">{slug ? 'Modifier l’œuvre' : 'Nouvelle œuvre'}</h1>
        </div>
        {produit && (
          <a
            href={`/tableaux/${produit.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            Voir sur la boutique
          </a>
        )}
      </div>

      <EtatChargement chargement={chargement} erreur={erreur} />
      {donnees && <FormulaireProduit produit={produit} />}
    </>
  );
}

export default function PageEditerProduit() {
  // useSearchParams impose une frontiere Suspense en export statique.
  return (
    <Suspense fallback={<p className="admin-vide">Chargement…</p>}>
      <Editeur />
    </Suspense>
  );
}
