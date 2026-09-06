import { Suspense } from 'react';
import Link from 'next/link';
import Studio from '@/components/Studio';
import StudioAmorce from '@/components/StudioAmorce';
import { lireProduits } from '@/lib/catalogue';
import donneesPieces from '@/data/pieces.json';
import { IcoCamera, IcoRegle, IcoTelecharger } from '@/components/Icones';

export const metadata = {
  title: 'Studio d’essayage — voyez l’œuvre sur votre mur',
  description:
    'Chargez la photo de votre pièce, choisissez une œuvre et voyez-la à la taille réelle '
    + 'sur votre mur : formats, cadres, mur de cadres. Gratuit, sans inscription, et vos '
    + 'photos ne quittent pas votre appareil.',
  alternates: { canonical: '/studio' },
};

export default async function PageStudio() {
  const produits = await lireProduits();

  return (
    <>
      <section className="studio-hero">
        <div className="wrap page-head">
          <nav className="breadcrumb" aria-label="Fil d’Ariane" style={{ paddingTop: 0 }}>
            <Link href="/">Accueil</Link> <span>/</span> <span>Studio</span>
          </nav>
          <span className="eyebrow">Studio d’essayage</span>
          <h1 className="d2">Votre mur, à l’échelle, en dix secondes</h1>
          <p className="lede">
            Prenez votre pièce en photo, dites-nous la largeur du mur visible, et posez
            l’œuvre. Les centimètres affichés sont les vrais : c’est la seule façon de
            choisir un format sans se tromper.
          </p>
          <div className="row mt-2" style={{ gap: '1.5rem' }}>
            <span className="small muted row" style={{ gap: '0.45rem' }}><IcoCamera size={17} /> Photo ou appareil</span>
            <span className="small muted row" style={{ gap: '0.45rem' }}><IcoRegle size={17} /> Échelle réelle</span>
            <span className="small muted row" style={{ gap: '0.45rem' }}><IcoTelecharger size={17} /> Image à télécharger</span>
          </div>
        </div>
      </section>

      <div className="wrap section-tight">
        <Suspense fallback={<div className="empty-state">Ouverture du studio…</div>}>
          <StudioAmorce produits={produits} pieces={donneesPieces.pieces} />
        </Suspense>
      </div>

      <section className="wrap section-tight">
        <div className="center-head">
          <span className="eyebrow center">Bien photographier son mur</span>
          <h2 className="d3">Trois réflexes pour un rendu juste</h2>
        </div>
        <div className="reassure" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', borderRadius: 'var(--r-m)', overflow: 'hidden' }}>
          <div>
            <div>
              <strong>Placez-vous de face</strong>
              <p>Photographiez le mur perpendiculairement, sans incliner le téléphone : la perspective fausse les proportions.</p>
            </div>
          </div>
          <div>
            <div>
              <strong>Gardez un repère</strong>
              <p>Un canapé, une porte ou une table dans le cadre : cela vous aide à régler la largeur du mur au centimètre près.</p>
            </div>
          </div>
          <div>
            <div>
              <strong>Lumière du jour</strong>
              <p>Une photo prise de jour restitue mieux les couleurs de la pièce, donc l’accord avec l’œuvre.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
