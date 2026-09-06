'use client';

import { appeler } from '@/lib/api';
import { useDonnees, EtatChargement } from '@/components/admin/useDonnees';
import EcranPromotions from '@/components/admin/EcranPromotions';

export default function PagePromotionsAdmin() {
  const { donnees, erreur, chargement, recharger } = useDonnees(async () => {
    const [p, r] = await Promise.all([
      appeler('/api/produits', { avecJeton: true }),
      appeler('/api/reglages', { avecJeton: true }),
    ]);
    return { produits: p.produits, reglages: r.reglages };
  });

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Ventes flash</p>
          <h1 className="d3">Promotions</h1>
        </div>
      </div>

      <EtatChargement chargement={chargement} erreur={erreur} />
      {donnees && (
        <EcranPromotions
          produits={donnees.produits}
          reglages={donnees.reglages}
          recharger={recharger}
        />
      )}
    </>
  );
}
