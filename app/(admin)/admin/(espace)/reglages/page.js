import { store, REGLAGES_DEFAUT } from '@/lib/store';
import FormulaireReglages from '@/components/admin/FormulaireReglages';

export const metadata = { title: 'Réglages' };
export const dynamic = 'force-dynamic';

export default async function PageReglages() {
  const enregistres = await store().reglages.lire();

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Boutique</p>
          <h1 className="d3">Réglages</h1>
        </div>
      </div>

      <FormulaireReglages reglages={{ ...REGLAGES_DEFAUT, ...(enregistres || {}) }} />
    </>
  );
}
