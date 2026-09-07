import Link from 'next/link';
import { notFound } from 'next/navigation';
import FicheProduit from '@/components/FicheProduit';
import CarteProduit from '@/components/CarteProduit';
import { lireProduit, lireProduits, lireReglages } from '@/lib/catalogue';
import { nomTheme } from '@/lib/taxonomie';
import donneesPieces from '@/data/pieces.json';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';

export async function generateStaticParams() {
  const produits = await lireProduits();
  return produits.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await lireProduit(slug);
  if (!p) return { title: 'Œuvre introuvable' };
  return {
    title: `${p.titre} — ${p.artiste}`,
    description:
      `${p.titre} de ${p.artiste}, tirage d’art imprimé et encadré à Casablanca. `
      + `Cinq formats de ${p.tailles[0].l} × ${p.tailles[0].h} à ${p.tailles.at(-1).l} × ${p.tailles.at(-1).h} cm. `
      + 'Essayez l’œuvre sur la photo de votre mur avant de commander.',
    alternates: { canonical: `/tableaux/${p.slug}` },
    openGraph: {
      title: `${p.titre} — Nuance Art`,
      description: `${nomTheme(p.theme)} · ${p.artiste}`,
      images: [{ url: p.image }],
      type: 'article',
    },
  };
}

export default async function PageProduit({ params }) {
  const { slug } = await params;
  const [produit, tous, reglages] = await Promise.all([
    lireProduit(slug), lireProduits(), lireReglages(),
  ]);
  if (!produit) notFound();

  const similaires = tous
    .filter((p) => p.slug !== produit.slug && p.theme === produit.theme)
    .slice(0, 4);

  const pourStudio = [produit, ...tous.filter((p) => p.slug !== produit.slug)].slice(0, 40);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produit.titre,
    image: `${SITE}${produit.image}`,
    description: produit.description,
    brand: { '@type': 'Brand', name: 'Nuance Art' },
    category: nomTheme(produit.theme),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: produit.note.toFixed(1),
      reviewCount: produit.avis,
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'MAD',
      lowPrice: Math.round(produit.tailles[0].prix * (1 - (produit.promo || 0) / 100)),
      highPrice: produit.tailles.at(-1).prix,
      offerCount: produit.tailles.length,
      availability: 'https://schema.org/InStock',
      url: `${SITE}/tableaux/${produit.slug}`,
    },
  };

  const filAriane = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Tableaux', item: `${SITE}/tableaux` },
      { '@type': 'ListItem', position: 3, name: nomTheme(produit.theme), item: `${SITE}/collections/${produit.theme}` },
      { '@type': 'ListItem', position: 4, name: produit.titre },
    ],
  };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(filAriane) }} />

      <nav className="breadcrumb" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link> <span>/</span>
        <Link href="/tableaux">Tableaux</Link> <span>/</span>
        <Link href={`/collections/${produit.theme}`}>{nomTheme(produit.theme)}</Link> <span>/</span>
        <span>{produit.titre}</span>
      </nav>

      <FicheProduit
        produit={produit}
        oeuvresStudio={pourStudio}
        pieces={donneesPieces.pieces}
        whatsapp={reglages.whatsapp}
      />

      {similaires.length > 0 && (
        <section className="section-tight">
          <div className="sec-head">
            <div>
              <span className="eyebrow">Dans le même esprit</span>
              <h2 className="d3">Ces œuvres s’accordent avec celle-ci</h2>
            </div>
            <Link href={`/collections/${produit.theme}`} className="link-arrow">
              Toute la collection {nomTheme(produit.theme)}
            </Link>
          </div>
          <div className="grid-produits">
            {similaires.map((p) => <CarteProduit key={p.slug} produit={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
