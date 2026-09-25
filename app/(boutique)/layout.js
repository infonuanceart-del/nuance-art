import { Bodoni_Moda, Inter } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import { BoutiqueProvider } from '@/components/Boutique';
import { lireProduits, lireReglages } from '@/lib/catalogue';
import { IcoTelephone, IcoWhatsapp } from '@/components/Icones';
import '../globals.css';
import '../studio.css';

/* En construction serveur, la page se refait au plus toutes les deux minutes :
   une oeuvre ajoutee dans l'administration apparait donc sans redeploiement.
   Valeur litterale exigee par Next, elle double FRAICHEUR de lib/catalogue.js.
   Sans effet sur l'export statique, qui ignore la revalidation. */
export const revalidate = 120;


// Didone a fort contraste pour les titres : le caractere des cartels de musee.
// L'axe optique est variable, Next sert donc la bonne graisse a chaque taille.
const display = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

// Grotesque neutre pour tout le reste : lisible a 13 px comme a 20 px.
const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Nuance Art — Art traditionnel encadré au Maroc',
    template: '%s | Nuance Art',
  },
  description:
    'Galerie en ligne d’art traditionnel : calligraphie arabe, zellige, tapis anciens et '
    + 'enluminures, imprimés et encadrés à Casablanca. Livraison offerte dans tout le Maroc.',
  keywords: [
    'tableau maroc', 'calligraphie arabe tableau', 'tableau zellige',
    'art islamique tableau', 'decoration marocaine murale', 'tableau salon marocain',
    'toile imprimee maroc', 'cadre mural casablanca',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    siteName: 'Nuance Art',
    title: 'Nuance Art — L’art qui trouve sa place',
    description:
      'Calligraphie, zellige, tapis anciens et enluminures, imprimés et encadrés à Casablanca.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  // Preuve de propriete pour Google Search Console : a garder tant que le
  // domaine y est suivi, sa suppression retire l'acces a la propriete.
  verification: { google: 'lufA6xUXg65aTgh4zE2pZ1-vX92v7JNYr-eTU9GRbqo' },
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE}/#boutique`,
    name: 'Nuance Art',
    url: SITE,
    logo: `${SITE}/logo.png`,
    image: `${SITE}/logo.png`,
    description: 'Galerie d’art traditionnel en ligne : calligraphie, zellige, tapis et enluminures encadrés à Casablanca.',
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
      {/* Les extensions de navigateur (ColorZilla, gestionnaires de mots de passe)
          posent leurs attributs sur <body> avant l'hydratation de React : on
          tait l'avertissement pour cette balise seule, jamais pour ses enfants. */}
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BoutiqueProvider>
          <a href="#contenu" className="skip">Aller au contenu</a>
          <Header indexRecherche={indexRecherche} />
          <main id="contenu">{children}</main>
          <Footer reglages={reglages} />
          <Toast />
          {/* Boutons flottants : appel au-dessus, WhatsApp (canal principal) en bas */}
          <div className="contact-float">
            {reglages.telephone && (
              <a
                className="tel-float"
                href={`tel:${reglages.telephone.replace(/\s/g, '')}`}
                aria-label={`Nous appeler au ${reglages.telephone}`}
              >
                <IcoTelephone size={21} />
              </a>
            )}
            <a
              className="wa-float"
              href={`https://wa.me/${reglages.whatsapp}?text=${encodeURIComponent('Bonjour Nuance Art, j’ai une question sur une œuvre.')}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Nous écrire sur WhatsApp"
            >
              <IcoWhatsapp size={26} />
            </a>
          </div>
        </BoutiqueProvider>
      </body>
    </html>
  );
}
