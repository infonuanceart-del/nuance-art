import Link from 'next/link';
import Personnaliser from '@/components/Personnaliser';

export const metadata = {
  title: 'Personnaliser mon tableau — votre photo imprimée et encadrée',
  description:
    'Envoyez votre photo, choisissez le format et le cadre, et recevez votre tableau '
    + 'imprimé au pigment et encadré à la main à Casablanca. Livraison 48 h partout au Maroc.',
  alternates: { canonical: '/personnaliser' },
};

export default function PagePersonnaliser() {
  return (
    <div className="wrap section-tight">
      <nav className="breadcrumb" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link> <span>/</span> <span>Personnaliser</span>
      </nav>

      <header className="page-head">
        <span className="eyebrow">Sur mesure</span>
        <h1 className="d2">Personnaliser mon tableau</h1>
        <p className="lede">
          Votre photo, imprimée au pigment sur toile premium et encadrée à la main
          dans notre atelier. Choisissez le format et le cadre, nous nous occupons
          du reste.
        </p>
      </header>

      <Personnaliser />
    </div>
  );
}
