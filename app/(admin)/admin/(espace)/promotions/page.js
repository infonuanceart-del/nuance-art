import { store, REGLAGES_DEFAUT } from '@/lib/store';
import EcranPromotions from '@/components/admin/EcranPromotions';

export const metadata = { title: 'Promotions' };
export const dynamic = 'force-dynamic';

export default async function PagePromotionsAdmin() {
  const [produits, enregistres] = await Promise.all([
    store().produits.tous(),
    store().reglages.lire(),
  ]);

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Ventes flash</p>
          <h1 className="d3">Promotions</h1>
        </div>
      </div>

      <EcranPromotions
        produits={produits}
        reglages={{ ...REGLAGES_DEFAUT, ...(enregistres || {}) }}
      />
    </>
  );
}
