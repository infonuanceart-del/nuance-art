import Favoris from '@/components/Favoris';
import { lireProduits } from '@/lib/store';

export const metadata = {
  title: 'Mes favoris',
  robots: { index: false, follow: true },
};

export default async function PageFavoris() {
  const produits = await lireProduits();
  return (
    <div className="wrap section-tight">
      <header className="page-head" style={{ paddingTop: 0 }}>
        <span className="eyebrow">Favoris</span>
        <h1 className="d2">Les œuvres que vous avez mises de côté</h1>
      </header>
      <Favoris produits={produits} />
    </div>
  );
}
