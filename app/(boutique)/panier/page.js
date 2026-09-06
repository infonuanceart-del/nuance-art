import Panier from '@/components/Panier';

export const metadata = {
  title: 'Mon panier',
  description: 'Votre sélection d’œuvres Nuance Art, prête à commander.',
  robots: { index: false, follow: true },
};

export default function PagePanier() {
  return (
    <div className="wrap section-tight">
      <header className="page-head" style={{ paddingTop: 0 }}>
        <span className="eyebrow">Panier</span>
        <h1 className="d2">Votre sélection</h1>
      </header>
      <Panier />
    </div>
  );
}
