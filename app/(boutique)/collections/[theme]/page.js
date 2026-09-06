import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Catalogue from '@/components/Catalogue';
import { lireProduits } from '@/lib/catalogue';
import { THEMES, THEME_PAR_SLUG } from '@/lib/taxonomie';

export function generateStaticParams() {
  return THEMES.map((t) => ({ theme: t.slug }));
}

export async function generateMetadata({ params }) {
  const { theme } = await params;
  const t = THEME_PAR_SLUG[theme];
  if (!t) return {};
  return {
    title: `${t.nom} — tableaux et affiches`,
    description: `${t.seo} Imprimé et encadré à Casablanca, livré en 48 h au Maroc. Essayez l’œuvre sur la photo de votre mur avant de commander.`,
    alternates: { canonical: `/collections/${t.slug}` },
    openGraph: { title: `${t.nom} — Nuance Art`, description: t.accroche },
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
    hasPart: produits.slice(0, 12).map((p) => ({
      '@type': 'Product',
      name: p.titre,
      image: p.image,
      offers: { '@type': 'Offer', price: p.prixMin, priceCurrency: 'MAD' },
    })),
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
