import { store } from '@/lib/store';
import { dh } from '@/lib/prix';
import ListeCommandes from '@/components/admin/ListeCommandes';

export const metadata = { title: 'Commandes' };
export const dynamic = 'force-dynamic';

export default async function PageCommandes() {
  const commandes = await store().commandes.toutes();
  const enCours = commandes.filter((c) => c.statut === 'nouvelle').length;
  const ca = commandes
    .filter((c) => c.statut !== 'annulee')
    .reduce((s, c) => s + (c.total || 0), 0);

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Boutique</p>
          <h1 className="d3">Commandes <span style={{ color: 'var(--muted)' }}>({commandes.length})</span></h1>
        </div>
        <p className="tiny" style={{ color: 'var(--muted)' }}>
          {enCours} à traiter · {dh(ca)} encaissés
        </p>
      </div>

      <ListeCommandes commandes={commandes} />
    </>
  );
}
