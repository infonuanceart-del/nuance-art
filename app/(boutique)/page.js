import Link from 'next/link';
import { lireProduits, lireReglages } from '@/lib/catalogue';
import { THEMES } from '@/lib/taxonomie';
import { dh } from '@/lib/prix';
import CarteProduit from '@/components/CarteProduit';
import HeroScene from '@/components/HeroScene';
import Reveal from '@/components/Reveal';
import Compteur from '@/components/Compteur';
import Avatar from '@/components/Avatar';
import {
  IcoBouclier, IcoCamion, IcoEtoile, IcoFleche, IcoRegle, IcoRetour,
} from '@/components/Icones';
import donneesPieces from '@/data/pieces.json';

/* En construction serveur, la page se refait au plus toutes les deux minutes :
   une oeuvre ajoutee dans l'administration apparait donc sans redeploiement.
   Valeur litterale exigee par Next, elle double FRAICHEUR de lib/catalogue.js.
   Sans effet sur l'export statique, qui ignore la revalidation. */
export const revalidate = 120;


export const metadata = {
  title: 'Nuance Art — Calligraphie, zellige et art traditionnel encadrés',
  description:
    'Calligraphies arabes, zelliges, tapis anciens et enluminures, imprimés au pigment et '
    + 'encadrés à Casablanca. Une galerie d’art traditionnel pensée pour les intérieurs '
    + 'marocains. Livraison 48 h partout au Maroc.',
  alternates: { canonical: '/' },
};

const AVIS = [
  {
    texte: 'J’ai posé la photo de mon salon, essayé quatre formats, et j’ai enfin compris que le 60 × 90 était trop petit. Commandé en 80 × 120, c’est exactement ça.',
    qui: 'Salma B.', ou: 'Casablanca — Anfa',
  },
  {
    texte: 'Le cadre est superbe et la toile est épaisse, pas la qualité fine qu’on trouve ailleurs. Livré à Rabat en deux jours, emballé comme il faut.',
    qui: 'Youssef A.', ou: 'Rabat — Agdal',
  },
  {
    texte: 'On a équipé les six chambres de la maison d’hôtes. L’équipe a conseillé les formats pièce par pièce, et la facture était nette.',
    qui: 'Nadia E.', ou: 'Marrakech — Hivernage',
  },
];

const FAQ = [
  {
    q: 'Comment fonctionne l’essai sur mon mur ?',
    r: 'Vous chargez une photo de votre pièce, vous indiquez la largeur du mur visible, et l’œuvre s’affiche à sa taille réelle. Vous pouvez la déplacer, l’incliner, changer de format et de cadre, puis télécharger l’image obtenue. Rien n’est envoyé sur nos serveurs : tout se calcule dans votre navigateur.',
  },
  {
    q: 'Quels sont les délais de livraison ?',
    r: '48 h à Casablanca, Rabat, Marrakech et Tanger ; 3 à 5 jours ouvrés pour le reste du Maroc. Chaque pièce est imprimée à la commande dans notre atelier, puis expédiée avec son système d’accroche.',
  },
  {
    q: 'Puis-je payer à la livraison ?',
    r: 'Oui. Le paiement à la livraison est disponible partout au Maroc, sans supplément. Le virement bancaire est également possible pour les commandes professionnelles.',
  },
  {
    q: 'Les œuvres sont-elles libres de droits ?',
    r: 'Notre catalogue s’appuie sur des œuvres du domaine public issues de collections muséales ouvertes, rééditées en haute définition. Vous pouvez donc les accrocher chez vous comme dans un lieu recevant du public.',
  },
  {
    q: 'Que se passe-t-il si le format ne me convient pas ?',
    r: 'Vous avez 14 jours pour nous retourner une pièce non personnalisée. Nous remboursons ou nous échangeons le format — c’est justement pour éviter cela que nous avons construit le studio d’essayage.',
  },
];

export default async function Accueil() {
  const [produits, reglages] = await Promise.all([lireProduits(), lireReglages()]);
  const pieces = donneesPieces.pieces;

  const tousBest = produits.filter((p) => p.bestseller);
  const bestsellers = tousBest.slice(0, 8);
  const compteBest = tousBest.length;
  const nouveautes = produits.filter((p) => p.nouveaute).slice(0, 4);
  const promos = produits.filter((p) => p.promo > 0).slice(0, 4);
  // La cimaise du héros montre une œuvre par grande catégorie plutôt que les
  // quatre premières du catalogue, pour que les quatre cadres ne se ressemblent
  // pas. Format portrait : c'est celui du cadre accroché au mur.
  const FAMILLES = ['heritage-marocain', 'art-contemporain', 'nature-paysage', 'art-islamique'];
  const heros = FAMILLES
    .map((t) => produits.find((p) => p.theme === t && p.format === 'portrait'))
    .filter(Boolean);
  // filet de sécurité si une famille venait à manquer d'œuvre verticale
  if (heros.length < 3) {
    for (const p of produits.filter((p) => p.format === 'portrait')) {
      if (heros.length >= 4) break;
      if (!heros.includes(p)) heros.push(p);
    }
  }

  // une image de couverture et un décompte par collection
  const couvertures = Object.fromEntries(
    THEMES.map((t) => [t.slug, produits.find((p) => p.theme === t.slug)?.image]),
  );
  const compte = produits.reduce((acc, p) => ({ ...acc, [p.theme]: (acc[p.theme] || 0) + 1 }), {});

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.r },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------------------------------------------------------- HÉROS */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Atelier d’édition d’art — Casablanca</span>
            <h1 className="d1">
              Plus qu’un tableau,<br /><i>une émotion chez vous.</i>
            </h1>
            <p className="lede">
              Des œuvres inspirées de grandes collections, rééditées avec une précision
              exceptionnelle, peintes à la main et encadrées avec soin pour offrir une
              œuvre singulière, prête à trouver sa place chez vous.
            </p>
            <p className="lede" style={{ marginTop: '0.9rem' }}>
              De l’atelier à votre intérieur, nous prenons soin de chaque détail :
              livraison, installation et accrochage de votre œuvre à domicile.
            </p>
            <div className="hero-cta">
              <Link href="/tableaux" className="btn btn-primary btn-lg">
                Découvrir les œuvres <IcoFleche size={17} />
              </Link>
              <a href="#collections" className="btn btn-ghost btn-lg">
                Parcourir les collections
              </a>
            </div>
          </div>

          <HeroScene oeuvres={heros} />
        </div>
      </section>

      {/* ------------------------------------------------------- BANDEAU */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((n) => (
            <div className="marquee-track" key={n} style={{ animation: 'none' }}>
              <span>Impression pigmentaire 12 couleurs</span>
              <span>Toile premium</span>
              <span>Cadres montés à la main</span>
              <span>Essai sur votre mur, à l’échelle</span>
              <span>Paiement à la livraison</span>
              <span>Livraison 48 h</span>
            </div>
          ))}
        </div>
      </div>

      <div className="wrap">
        <div className="reassure">
          <div><IcoCamion size={22} /><div><strong>Livraison 48 h</strong><p>Casablanca, Rabat, Marrakech, Tanger — offerte dès 600 DH.</p></div></div>
          <div><IcoRegle size={22} /><div><strong>Cinq formats</strong><p>Du 40 × 30 au 120 × 80, avec les centimètres annoncés.</p></div></div>
          <div><IcoBouclier size={22} /><div><strong>Paiement à la livraison</strong><p>Vous payez quand le colis est entre vos mains.</p></div></div>
          <div><IcoRetour size={22} /><div><strong>14 jours pour changer</strong><p>Mauvais format ? On échange, sans discussion.</p></div></div>
        </div>
      </div>

      {/* ---------------------------------------------------- BESTSELLERS */}
      <section className="section wrap">
        <Reveal className="sec-head">
          <div>
            <span className="eyebrow">Les plus accrochés</span>
            <h2 className="d2">Nos best-sellers</h2>
            <p className="lede">
              Les {compteBest} œuvres qui reviennent commande après commande, de Casablanca
              à Tanger. Calligraphies, zelliges et tapis en tête.
            </p>
          </div>
          <Link href="/bestsellers" className="btn btn-clay">
            Voir les {compteBest} best-sellers <IcoFleche size={16} />
          </Link>
        </Reveal>

        <div className="grid-produits">
          {bestsellers.map((p, i) => (
            <CarteProduit key={p.slug} produit={p} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------- COLLECTIONS */}
      <section className="section wrap" id="collections">
        <Reveal className="sec-head">
          <div>
            <span className="eyebrow">Collections</span>
            <h2 className="d2">Des œuvres qui changent tout.</h2>
            <p className="lede">
              Une sélection de tableaux conçue pour transformer un simple mur en
              véritable signature intérieure.
            </p>
          </div>
          <Link href="/tableaux" className="link-arrow">Tout le catalogue <IcoFleche size={16} /></Link>
        </Reveal>

        <div className="collections">
          {THEMES.slice(0, 7).map((t) => (
            <Link key={t.slug} href={`/collections/${t.slug}`} className="col-card">
              {couvertures[t.slug] && <img src={couvertures[t.slug]} alt="" loading="lazy" />}
              <div>
                <h3>{t.nom}</h3>
                <span>{compte[t.slug] || 0} œuvres</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- PROMOTIONS */}
      {reglages.promoActive && promos.length > 0 && (
        <section className="section-tight wrap">
          <Reveal className="sec-head">
            <div>
              <span className="eyebrow">Ventes flash</span>
              <h2 className="d2">{reglages.promoTitre}</h2>
              <p className="lede">{reglages.promoTexte}</p>
            </div>
            <Link href="/promotions" className="btn btn-clay">Voir toutes les promotions</Link>
          </Reveal>

          <div className="grid-produits">
            {promos.map((p) => <CarteProduit key={p.slug} produit={p} />)}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------- PAR PIÈCE */}
      <section className="section wrap">
        <Reveal className="center-head">
          <span className="eyebrow center">Par pièce</span>
          <h2 className="d2">Dites-nous où ça va s’accrocher</h2>
          <p className="lede">
            Un couloir ne demande pas le même format qu’un salon. Partez de la pièce,
            on s’occupe du reste.
          </p>
        </Reveal>

        <div className="grid-produits" style={{ marginTop: '2rem' }}>
          {nouveautes.map((p) => <CarteProduit key={p.slug} produit={p} />)}
        </div>
      </section>

      {/* ------------------------------------------------------- ATELIER */}
      <section className="section-tight wrap">
        <div className="duo">
          <Reveal className="duo-img">
            <img src={pieces[1]?.image} alt="Atelier d’encadrement Nuance Art" loading="lazy" />
          </Reveal>
          <Reveal delai={90}>
            <span className="eyebrow">L’atelier</span>
            <h2 className="d2" style={{ margin: '0.7rem 0 1rem' }}>
              Imprimé, peint, encadré à Casablanca
            </h2>
            <p className="lede">
              Nous ne sommes pas un intermédiaire. Les fichiers sont préparés œuvre par
              œuvre, imprimés sur toile premium, puis montés sur châssis. Chaque pièce
              est contrôlée à la lumière du jour avant emballage.
            </p>
            <div className="chiffres mt-3">
              <div><b>10</b><span>ans de savoir-faire</span></div>
              <div><b>12</b><span>collections</span></div>
              <div><b>Toile</b><span>premium</span></div>
              <div><b>48 h</b><span>de délai</span></div>
            </div>
            <Link href="/a-propos" className="link-arrow mt-3">Visiter l’atelier <IcoFleche size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- AVIS */}
      <section className="section-tight wrap">
        <Reveal className="center-head">
          <span className="eyebrow center">Avis clients</span>
          <h2 className="d2">Des émotions qui se racontent</h2>
        </Reveal>

        <div className="avis-grid">
          {AVIS.map((a) => (
            <Reveal key={a.qui} className="avis" delai={60}>
              <span className="stars">
                {[0, 1, 2, 3, 4].map((i) => <IcoEtoile key={i} size={13} />)}
              </span>
              <p>« {a.texte} »</p>
              <footer>
                <Avatar nom={a.qui} />
                <span><b>{a.qui}</b><br /><span className="tiny muted">{a.ou}</span></span>
              </footer>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- FAQ */}
      <section className="section-tight wrap faq">
        <Reveal className="center-head">
          <span className="eyebrow center">Questions fréquentes</span>
          <h2 className="d2">Ce qu’on nous demande le plus</h2>
        </Reveal>

        {FAQ.map((f) => (
          <details key={f.q} className="acc-faq">
            <summary>{f.q}</summary>
            <p>{f.r}</p>
          </details>
        ))}
      </section>

      {/* ---------------------------------------------------------- FINAL */}
      <section className="section-tight wrap">
        <div className="cta-final">
          <div>
            <h2 className="d3">Un doute sur le format ?</h2>
            <p className="lede">
              Envoyez-nous la photo de votre mur sur WhatsApp : on vous renvoie une
              simulation avec deux ou trois propositions, gratuitement.
            </p>
          </div>
          <div className="row">
            <a
              className="btn btn-primary btn-lg"
              href={`https://wa.me/${reglages.whatsapp}?text=${encodeURIComponent('Bonjour Nuance Art, voici la photo de mon mur — quel format me conseillez-vous ?')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Demander un conseil
            </a>
            <Link href="/promotions" className="btn btn-ghost btn-lg">
              Promotions dès {dh(Math.min(...produits.map((p) => Math.round(p.prixMin * 0.6))))}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
