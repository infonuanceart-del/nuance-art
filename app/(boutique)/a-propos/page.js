import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { IcoBouclier, IcoCamion, IcoFleche, IcoRegle, IcoRetour } from '@/components/Icones';
import { lireProduits } from '@/lib/catalogue';
import { THEMES } from '@/lib/taxonomie';
import donneesPieces from '@/data/pieces.json';

/* Les chiffres de la page sont calcules sur le catalogue en ligne : ils suivent
   seuls les oeuvres ajoutees ou retirees dans l'administration. */
export const revalidate = 120;

export const metadata = {
  title: 'L’atelier — qui sommes-nous',
  description:
    'Nuance Art, atelier d’édition d’art à Casablanca : œuvres du domaine public rééditées '
    + 'en haute définition, imprimées au pigment, encadrées à la main, livrées au Maroc.',
  alternates: { canonical: '/a-propos' },
};

const ETAPES = [
  {
    titre: 'Choisir l’œuvre',
    texte: 'Calligraphies, zelliges, tapis, enluminures, peintres orientalistes : chaque œuvre vient d’une collection muséale ouverte, dans le domaine public, et elle est retenue pour la façon dont elle vivra dans une pièce, pas seulement en photo.',
  },
  {
    titre: 'Préparer le fichier',
    texte: 'Les fichiers sont repris œuvre par œuvre, en haute définition, pour que les détails tiennent jusqu’au plus grand format.',
  },
  {
    titre: 'Imprimer au pigment',
    texte: 'Impression pigmentaire douze couleurs sur toile d’art 380 g ou papier mat 250 g, avec des encres résistantes à la lumière.',
  },
  {
    titre: 'Encadrer à la main',
    texte: 'La toile est montée sur châssis en bois massif dans notre atelier de Casablanca, puis contrôlée à la lumière du jour avant l’emballage.',
  },
  {
    titre: 'Livrer prêt à accrocher',
    texte: 'Le tableau part avec son système d’accroche posé et un niveau à bulle : il n’y a plus qu’à choisir le mur.',
  },
];

export default async function PageAPropos() {
  const produits = await lireProduits();
  const pieces = donneesPieces.pieces;
  // une oeuvre marocaine pour illustrer le propos, celle dont les proportions
  // approchent le plus le cadre 4/3 du bloc : un portrait y perdrait la tete
  const marocaines = produits.filter((p) => p.theme === 'heritage-marocain');
  const vitrine = (marocaines.length ? marocaines : produits)
    .reduce((m, p) => (Math.abs(p.ratio - 4 / 3) < Math.abs(m.ratio - 4 / 3) ? p : m), (marocaines[0] || produits[0]));
  // le plus grand nombre de formats proposes pour une oeuvre (cinq a ce jour)
  const formats = produits.length
    ? Math.max(...produits.map((p) => p.tailles?.length || 0))
    : 5;

  return (
    <div>
      <div className="wrap section-tight">
        <nav className="breadcrumb" aria-label="Fil d’Ariane">
          <Link href="/">Accueil</Link> <span>/</span> <span>L’atelier</span>
        </nav>

        <header className="page-head">
          <span className="eyebrow">L’atelier</span>
          <h1 className="d2">Un atelier d’édition d’art à Casablanca</h1>
          <p className="lede">
            Nous imprimons, encadrons et livrons partout au Maroc des œuvres choisies pour
            vivre chez vous — pas seulement pour être belles en photo.
          </p>
        </header>

        <div className="duo">
          <Reveal className="duo-img">
            {vitrine && (
              <img
                src={vitrine.thumb}
                srcSet={`${vitrine.thumb} 520w, ${vitrine.image} 1400w`}
                sizes="(max-width: 899px) 100vw, 600px"
                alt={`${vitrine.titre}, ${vitrine.artiste}`}
              />
            )}
          </Reveal>
          <Reveal delai={90}>
            <span className="eyebrow">Notre parti pris</span>
            <h2 className="d2" style={{ margin: '0.7rem 0 1rem' }}>
              Le patrimoine des musées, à la taille de votre mur
            </h2>
            <p className="lede">
              Les grandes collections ont ouvert leurs archives : calligraphies, carreaux de
              zellige, tapis anciens, pages enluminées, scènes du Maroc et d’Andalousie. Nous
              les rééditons en haute définition et les faisons passer du musée au salon.
            </p>
            <p className="lede mt-2">
              Nous ne sommes pas un intermédiaire : tout ce qui sort de l’atelier y a été
              imprimé et monté.
            </p>
            <div className="chiffres mt-3">
              <div><b>{produits.length}</b><span>œuvres au catalogue</span></div>
              <div><b>{THEMES.length}</b><span>collections</span></div>
              <div><b>{formats}</b><span>formats par œuvre</span></div>
              <div><b>Offerte</b><span>livraison au Maroc</span></div>
            </div>
          </Reveal>
        </div>
      </div>

      <section className="section-tight wrap">
        <Reveal className="center-head">
          <span className="eyebrow center">Notre façon de faire</span>
          <h2 className="d2">Du fichier au mur, sans intermédiaire</h2>
        </Reveal>
        <ol className="methode">
          {ETAPES.map((e, i) => (
            <Reveal tag="li" key={e.titre} delai={i * 60}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <div>
                <strong>{e.titre}</strong>
                <p>{e.texte}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="section-tight wrap">
        <div className="duo duo-inverse">
          <Reveal className="duo-img">
            <img src={pieces[1]?.image} alt="Salon lumineux, un mur libre à habiller" />
          </Reveal>
          <Reveal delai={90}>
            <span className="eyebrow">Le studio d’essayage</span>
            <h2 className="d2" style={{ margin: '0.7rem 0 1rem' }}>
              Voir l’œuvre chez vous avant de la commander
            </h2>
            <p className="lede">
              Le mauvais format est la première déception d’un tableau acheté en ligne. Notre
              studio pose l’œuvre à sa taille réelle sur la photo de votre mur, avec le cadre
              de votre choix. Tout se calcule dans votre navigateur : vos photos ne nous sont
              jamais envoyées.
            </p>
            <Link href="/studio" className="link-arrow mt-3">Essayer une œuvre <IcoFleche size={16} /></Link>
          </Reveal>
        </div>
      </section>

      <div className="wrap">
        <div className="reassure">
          <div><IcoCamion size={22} /><div><strong>Livraison dans tout le Maroc</strong><p>Offerte, sans minimum d’achat, jusqu’à votre porte.</p></div></div>
          <div><IcoRegle size={22} /><div><strong>Les vraies mesures</strong><p>Chaque format annonce ses dimensions en centimètres.</p></div></div>
          <div><IcoBouclier size={22} /><div><strong>Paiement à la livraison</strong><p>Vous payez quand le colis est entre vos mains.</p></div></div>
          <div><IcoRetour size={22} /><div><strong>14 jours pour changer</strong><p>Mauvais format ? On échange, sans discussion.</p></div></div>
        </div>
      </div>

      <section className="section-tight wrap">
        <div className="cta-final">
          <div>
            <h2 className="d3">Trouver l’œuvre de votre mur</h2>
            <p className="lede">Parcourez le catalogue, ou décrivez-nous la pièce : on vous propose une sélection.</p>
          </div>
          <div className="row">
            <Link href="/tableaux" className="btn btn-primary">Voir les œuvres</Link>
            <Link href="/contact" className="btn btn-ghost">Nous écrire</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
