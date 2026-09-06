import Link from 'next/link';
import { store } from '@/lib/store';
import { dh } from '@/lib/prix';
import { NOM_STATUT } from '@/lib/produit';
import { nomTheme } from '@/lib/taxonomie';

export const metadata = { title: 'Tableau de bord' };
// Les chiffres doivent refléter la base à chaque visite, jamais un rendu mis en cache.
export const dynamic = 'force-dynamic';

const TON = { nouvelle: 'warn', confirmee: '', expediee: '', livree: 'ok', annulee: 'no' };

export default async function PageTableauDeBord() {
  const [produits, commandes] = await Promise.all([
    store().produits.tous(),
    store().commandes.toutes(),
  ]);

  // Une commande annulée ne compte ni dans le chiffre d'affaires ni dans le panier moyen.
  const valides = commandes.filter((c) => c.statut !== 'annulee');
  const ca = valides.reduce((s, c) => s + (c.total || 0), 0);
  const aTraiter = commandes.filter((c) => c.statut === 'nouvelle').length;

  const kpis = [
    { nom: 'Chiffre d’affaires', valeur: dh(ca) },
    { nom: 'Commandes', valeur: commandes.length },
    { nom: 'Panier moyen', valeur: valides.length ? dh(ca / valides.length) : '—' },
    { nom: 'À traiter', valeur: aTraiter },
    { nom: 'Œuvres en ligne', valeur: produits.filter((p) => p.actif !== false).length },
    { nom: 'En promotion', valeur: produits.filter((p) => p.promo > 0).length },
  ];

  const recentes = commandes.slice(0, 8);
  const vedettes = produits.filter((p) => p.bestseller).slice(0, 5);

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">Nuance Art</p>
          <h1 className="d3">Tableau de bord</h1>
        </div>
        <Link href="/admin/produits/nouveau" className="btn btn-primary btn-sm">
          Ajouter une œuvre
        </Link>
      </div>

      <div className="kpis">
        {kpis.map((k) => (
          <div className="kpi" key={k.nom}>
            <span>{k.nom}</span>
            <b>{k.valeur}</b>
          </div>
        ))}
      </div>

      <div className="row-between mt-2" style={{ marginBottom: '0.9rem' }}>
        <h2 className="d4">Dernières commandes</h2>
        {commandes.length > 0 && (
          <Link href="/admin/commandes" className="link-arrow">Toutes les commandes</Link>
        )}
      </div>

      <div className="table-wrap">
        {recentes.length === 0 ? (
          <p className="admin-vide">
            Aucune commande pour le moment. Elles apparaîtront ici dès la première
            validation de panier sur la boutique.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th className="hide-sm">Articles</th>
                <th>Total</th>
                <th>Statut</th>
                <th className="hide-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((c) => (
                <tr key={c.ref}>
                  <td><b>{c.ref}</b></td>
                  <td>
                    {c.client?.nom}
                    <br />
                    <span className="tiny" style={{ color: 'var(--muted)' }}>{c.client?.ville}</span>
                  </td>
                  <td className="hide-sm">{(c.articles || []).reduce((s, a) => s + a.qte, 0)}</td>
                  <td>{dh(c.total)}</td>
                  <td><span className={`tag ${TON[c.statut] || ''}`}>{NOM_STATUT[c.statut] || c.statut}</span></td>
                  <td className="hide-sm tiny">
                    {new Date(c.createdAt).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {vedettes.length > 0 && (
        <>
          <h2 className="d4 mt-3" style={{ marginBottom: '0.9rem' }}>Mises en avant sur l’accueil</h2>
          <div className="admin-vignettes">
            {vedettes.map((p) => (
              <Link key={p.slug} href={`/admin/produits/${p.slug}`} className="admin-vignette">
                <img src={p.thumb} alt="" loading="lazy" />
                <div>
                  <b>{p.titre}</b>
                  <span className="tiny">{nomTheme(p.theme)} · {dh(p.prixMin)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
