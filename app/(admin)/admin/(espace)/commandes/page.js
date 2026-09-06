'use client';

import { appeler } from '@/lib/api';
import { dh } from '@/lib/prix';
import { useDonnees, EtatChargement } from '@/components/admin/useDonnees';
import ListeCommandes from '@/components/admin/ListeCommandes';

export default function PageCommandes() {
  const { donnees, erreur, chargement, recharger } = useDonnees(
    () => appeler('/api/commandes', { avecJeton: true }),
  );

  const commandes = donnees?.commandes || [];
  const aTraiter = commandes.filter((c) => c.statut === 'nouvelle').length;
  const ca = commandes
    .filter((c) => c.statut !== 'annulee')
    .reduce((s, c) => s + (c.total || 0), 0);

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Boutique</p>
          <h1 className="d3">
            Commandes{' '}
            <span style={{ color: 'var(--muted)' }}>({donnees ? commandes.length : '…'})</span>
          </h1>
        </div>
        {donnees && (
          <p className="tiny" style={{ color: 'var(--muted)' }}>
            {aTraiter} à traiter · {dh(ca)} encaissés
          </p>
        )}
      </div>

      <EtatChargement chargement={chargement} erreur={erreur} />
      {donnees && <ListeCommandes commandes={commandes} recharger={recharger} />}
    </>
  );
}
