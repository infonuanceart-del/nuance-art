import { Bodoni_Moda, Inter } from 'next/font/google';
import '../globals.css';

/**
 * Racine de l'espace d'administration.
 *
 * L'admin est une seconde racine (groupe de routes) : il ne charge ni l'en-tête,
 * ni le pied de page, ni le catalogue de la boutique. Les URL sont inchangées,
 * les groupes entre parenthèses n'apparaissent jamais dans le chemin.
 */

const display = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: { default: 'Administration', template: '%s | Administration Nuance Art' },
  // un espace privé n'a rien à faire dans un index de moteur de recherche
  robots: { index: false, follow: false },
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function LayoutRacineAdmin({ children }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      {/* Les extensions de navigateur (ColorZilla, gestionnaires de mots de passe)
          posent leurs attributs sur <body> avant l'hydratation de React : on
          tait l'avertissement pour cette balise seule, jamais pour ses enfants. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
