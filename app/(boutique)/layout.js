import { Fraunces, Manrope } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { BoutiqueProvider } from '@/components/Boutique';
import { lireProduits, lireReglages } from '@/lib/store';
import { IcoWhatsapp } from '@/components/Icones';
import '../globals.css';
import '../studio.css';

const display = Fraunces({
  subsets: ['latin'],
  // police variable : on laisse Next servir l'axe de graisse complet
  axes: ['SOFT', 'WONK'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Nuance Art — Tableaux et affiches d’art au Maroc',
    template: '%s | Nuance Art',
  },
  description:
    'Galerie en ligne de tableaux, affiches et calligraphies imprimés et encadrés à Casablanca. '
    + 'Essayez chaque œuvre sur la photo de votre mur avant d’acheter. Livraison 48 h partout au Maroc.',
  keywords: [
    'tableau maroc', 'tableau decoration murale', 'affiche art casablanca',
    'calligraphie arabe tableau', 'toile imprimee maroc', 'cadre mural rabat',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    siteName: 'Nuance Art',
    title: 'Nuance Art — L’art qui trouve sa place',
    description:
      'Tableaux imprimés et encadrés à Casablanca. Testez l’œuvre sur la photo de votre mur, à la taille réelle.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport = {
  themeColor: '#16120e',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const [produits, reglages] = await Promise.all([lireProduits(), lireReglages()]);

  // Index de recherche léger envoyé à l'en-tête (pas de requête réseau au clic).
  const indexRecherche = produits.map((p) => ({
    slug: p.slug, titre: p.titre, artiste: p.artiste,
    theme: p.theme, thumb: p.thumb, prixMin: p.prixMin,
  }));

  const vedette = produits.find((p) => p.bestseller) || produits[0] || null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Nuance Art',
    url: SITE,
    image: `${SITE}/og.jpg`,
    description: 'Galerie d’art en ligne : tableaux, affiches et calligraphies imprimés et encadrés à Casablanca.',
    telephone: reglages.telephone,
    email: reglages.email,
    priceRange: '260 – 1900 DH',
    address: {
      '@type': 'PostalAddress',
      streetAddress: reglages.adresse,
      addressLocality: 'Casablanca',
      addressCountry: 'MA',
    },
    areaServed: 'MA',
    openingHours: 'Mo-Sa 10:00-19:00',
  };

  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BoutiqueProvider>
          <a href="#contenu" className="skip">Aller au contenu</a>
          <Header vedette={vedette} indexRecherche={indexRecherche} />
          <main id="contenu">{children}</main>
          <Footer reglages={reglages} />
          <Toast />
          <a
            className="wa-float"
            href={`https://wa.me/${reglages.whatsapp}?text=${encodeURIComponent('Bonjour Nuance Art, j’ai une question sur une œuvre.')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nous écrire sur WhatsApp"
          >
            <IcoWhatsapp size={26} />
          </a>
        </BoutiqueProvider>
      </body>
    </html>
  );
}
