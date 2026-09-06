import { notFound } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import FormulaireProduit from '@/components/admin/FormulaireProduit';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (slug === 'nouveau') return { title: 'Nouvelle œuvre' };
  const produit = await store().produits.parSlug(slug);
  return { title: produit ? produit.titre : 'Œuvre introuvable' };
}

export default async function PageProduit({ params }) {
  const { slug } = await params;
  const creation = slug === 'nouveau';

  const produit = creation ? null : await store().produits.parSlug(slug);
  if (!creation && !produit) notFound();

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="breadcrumb" style={{ padding: 0 }}>
            <Link href="/admin/produits">Œuvres</Link>
            <span>/</span>
            <span>{creation ? 'Nouvelle œuvre' : produit.titre}</span>
          </p>
          <h1 className="d3">{creation ? 'Nouvelle œuvre' : 'Modifier l’œuvre'}</h1>
        </div>
        {!creation && (
          <Link href={`/tableaux/${produit.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            Voir sur la boutique
          </Link>
        )}
      </div>

      <FormulaireProduit produit={produit} />
    </>
  );
}
