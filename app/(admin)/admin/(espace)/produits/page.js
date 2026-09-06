import Link from 'next/link';
import { store } from '@/lib/store';
import TableProduits from '@/components/admin/TableProduits';

export const metadata = { title: 'Œuvres' };
export const dynamic = 'force-dynamic';

export default async function PageProduits() {
  const produits = await store().produits.tous();

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="d3">Œuvres <span style={{ color: 'var(--muted)' }}>({produits.length})</span></h1>
        </div>
        <Link href="/admin/produits/nouveau" className="btn btn-primary btn-sm">
          Ajouter une œuvre
        </Link>
      </div>

      <TableProduits produits={produits} />
    </>
  );
}
