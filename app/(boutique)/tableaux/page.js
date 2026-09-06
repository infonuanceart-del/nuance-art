import { Suspense } from 'react';
import Link from 'next/link';
import Catalogue from '@/components/Catalogue';
import { lireProduits } from '@/lib/catalogue';

export const metadata = {
  title: 'Tous les tableaux — catalogue Nuance Art',
  description:
    'Parcourez le catalogue complet : abstrait, calligraphie, orientalisme, botanique, '
    + 'estampes japonaises. Filtrez par format, couleur dominante et pièce, puis essayez '
    + 'l’œuvre sur la photo de votre mur.',
  alternates: { canonical: '/tableaux' },
};

export default async function PageTableaux() {
  const produits = await lireProduits();

  return (
    <div className="wrap">
      <nav className="breadcrumb" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link> <span>/</span> <span>Tableaux</span>
      </nav>

      <header className="page-head">
        <span className="eyebrow">Catalogue</span>
        <h1 className="d2">{produits.length} œuvres, prêtes à accrocher</h1>
        <p className="lede">
          Chaque œuvre est imprimée à la commande, encadrée dans notre atelier et
          livrée avec son système d’accroche. Un doute sur le format ? Ouvrez le{' '}
          <Link href="/studio" style={{ borderBottom: '1px solid var(--clay)', color: 'var(--clay)' }}>studio d’essayage</Link>.
        </p>
      </header>

      <Suspense fallback={<div className="empty-state">Chargement du catalogue…</div>}>
        <Catalogue produits={produits} />
      </Suspense>

      <div style={{ height: 'clamp(2rem, 5vw, 4rem)' }} />
    </div>
  );
}
