import { Suspense } from 'react';
import Link from 'next/link';
import Catalogue from '@/components/Catalogue';
import { lireProduits } from '@/lib/catalogue';
import { dh } from '@/lib/prix';
import { IcoFleche } from '@/components/Icones';

/* En construction serveur, la page se refait au plus toutes les deux minutes :
   une oeuvre ajoutee dans l'administration apparait donc sans redeploiement.
   Valeur litterale exigee par Next, elle double FRAICHEUR de lib/catalogue.js.
   Sans effet sur l'export statique, qui ignore la revalidation. */
export const revalidate = 120;


export const metadata = {
  title: 'Best-sellers — les tableaux les plus vendus',
  description:
    'Les œuvres les plus commandées chez Nuance Art : calligraphies, zelliges, tapis anciens '
    + 'et enluminures encadrés à Casablanca. Notes clients, formats, livraison 48 h au Maroc.',
  alternates: { canonical: '/bestsellers' },
};

export default async function PageBestsellers() {
  const tous = await lireProduits();
  // le meme classement que le tri « populaires » du catalogue
  const best = tous
    .filter((p) => p.bestseller)
    .sort((a, b) => b.note - a.note || b.avis - a.avis);

  const noteMoyenne = best.length
    ? (best.reduce((s, p) => s + (p.note || 0), 0) / best.length).toFixed(1).replace('.', ',')
    : '—';
  const avisTotal = best.reduce((s, p) => s + (p.avis || 0), 0);
  const premierPrix = best.length ? Math.min(...best.map((p) => p.prixMin)) : 0;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best-sellers Nuance Art',
    numberOfItems: best.length,
    itemListElement: best.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `/tableaux/${p.slug}`,
      name: p.titre,
    })),
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="breadcrumb" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link> <span>/</span> <span>Best-sellers</span>
      </nav>

      <header className="page-head">
        <span className="eyebrow">Les plus accrochés</span>
        <h1 className="d2">Ce que les Marocains choisissent</h1>
        <p className="lede">
          {best.length} œuvres qui reviennent commande après commande, de Casablanca à Tanger.
          Toutes sont imprimées au pigment et encadrées dans notre atelier, puis livrées
          prêtes à accrocher.
        </p>
      </header>

      <div className="promo-strip">
        <div>
          <b>{best.length}</b>
          <span className="small muted">Œuvres au palmarès</span>
        </div>
        <div>
          <b>{noteMoyenne}/5</b>
          <span className="small muted">Note moyenne de la sélection</span>
        </div>
        <div>
          <b>{avisTotal}</b>
          <span className="small muted">Avis clients cumulés</span>
        </div>
        <div>
          <b>{dh(premierPrix)}</b>
          <span className="small muted">Premier prix de la sélection</span>
        </div>
      </div>

      <div className="sec-head" style={{ marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
        <div>
          <span className="eyebrow">La sélection</span>
          <h2 className="d3">Le palmarès, du plus plébiscité au moins</h2>
        </div>
        <Link href="/tableaux" className="link-arrow">Voir tout le catalogue <IcoFleche size={16} /></Link>
      </div>

      <Suspense fallback={<div className="empty-state">Chargement…</div>}>
        <Catalogue produits={best} titreVide="Aucun best-seller ne correspond à ces filtres" />
      </Suspense>

      <div style={{ height: 'clamp(2rem, 5vw, 4rem)' }} />
    </div>
  );
}
