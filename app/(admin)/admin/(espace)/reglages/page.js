'use client';

import { appeler } from '@/lib/api';
import { useDonnees, EtatChargement } from '@/components/admin/useDonnees';
import FormulaireReglages from '@/components/admin/FormulaireReglages';

export default function PageReglages() {
  const { donnees, erreur, chargement } = useDonnees(
    () => appeler('/api/reglages', { avecJeton: true }),
  );

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Boutique</p>
          <h1 className="d3">Réglages</h1>
        </div>
      </div>

      <EtatChargement chargement={chargement} erreur={erreur} />
      {donnees && <FormulaireReglages reglages={donnees.reglages} />}
    </>
  );
}
