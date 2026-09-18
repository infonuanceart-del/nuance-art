import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Catalogue from '@/components/Catalogue';
import { lireProduits } from '@/lib/catalogue';
import { THEMES, THEME_PAR_SLUG } from '@/lib/taxonomie';

/* En construction serveur, la page se refait au plus toutes les deux minutes :
   une oeuvre ajoutee dans l'administration apparait donc sans redeploiement.
   Valeur litterale exigee par Next, elle double FRAICHEUR de lib/catalogue.js.
   Sans effet sur l'export statique, qui ignore la revalidation. */
export const revalidate = 120;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';


export function generateStaticParams() {
  return THEMES.map((t) => ({ theme: t.slug }));
}

export async function generateMetadata({ params }) {
  const { theme } = await params;
  const t = THEME_PAR_SLUG[theme];
  if (!t) return {};
  const premiere = (await lireProduits()).find((p) => p.theme === theme);
  return {
    title: `${t.nom} — tableaux et affiches`,
    description: `${t.seo} Imprimé et encadré à Casablanca, livré en 48 h au Maroc.`,
    alternates: { canonical: `/collections/${t.slug}` },
    // Un openGraph declare ici remplace celui du parent, image comprise :
    // sans cette ligne, la page se partage sans visuel.
    openGraph: { title: `${t.nom} — Nuance Art`, description: t.accroche, images: premiere ? [{ url: premiere.image }] : undefined },
  };
}

export default async function PageCollection({ params }) {
  const { theme } = await params;
  const t = THEME_PAR_SLUG[theme];
  if (!t) notFound();

  const tous = await lireProduits();
  const produits = tous.filter((p) => p.theme === theme);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t.nom,
    description: t.seo,
    url: `${SITE}/collections/${t.slug}/`,
    // Une liste de liens vers les fiches, qui portent chacune leur Product
    // complet : Google ne lit pas de Product sans page propre ni URL.
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: produits.length,
      itemListElement: produits.slice(0, 20).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/tableaux/${p.slug}/`,
        name: p.titre,
      })),
    },
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="breadcrumb" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link> <span>/</span>
        <Link href="/tableaux">Tableaux</Link> <span>/</span> <span>{t.nom}</span>
      </nav>

      <header className="page-head">
        <span className="eyebrow">Collection</span>
        <h1 className="d2">{t.nom}</h1>
        <p className="lede">{t.accroche}</p>
        <div className="row mt-2">
          {THEMES.filter((x) => x.slug !== t.slug).slice(0, 5).map((x) => (
            <Link key={x.slug} href={`/collections/${x.slug}`} className="chip">{x.court}</Link>
          ))}
          <Link href="/tableaux" className="chip">Toutes les collections</Link>
        </div>
      </header>

      <Suspense fallback={<div className="empty-state">Chargement…</div>}>
        <Catalogue
          produits={produits}
          themeVerrouille={theme}
          titreVide={`Aucune œuvre de la collection ${t.nom} ne correspond`}
        />
      </Suspense>

      <div style={{ height: 'clamp(2rem, 5vw, 4rem)' }} />
    </div>
  );
}
