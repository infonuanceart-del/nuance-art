'use client';

import Link from 'next/link';
import { appeler } from '@/lib/api';
import { useDonnees, EtatChargement } from '@/components/admin/useDonnees';
import TableProduits from '@/components/admin/TableProduits';

export default function PageProduits() {
  const { donnees, erreur, chargement, recharger } = useDonnees(
    () => appeler('/api/produits', { avecJeton: true }),
  );

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="d3">
            Œuvres{' '}
            <span style={{ color: 'var(--muted)' }}>
              ({donnees?.produits.length ?? '…'})
            </span>
          </h1>
        </div>
        <Link href="/admin/produits/editer" className="btn btn-primary btn-sm">
          Ajouter une œuvre
        </Link>
      </div>

      <EtatChargement chargement={chargement} erreur={erreur} />
      {donnees && <TableProduits produits={donnees.produits} recharger={recharger} />}
    </>
  );
}
