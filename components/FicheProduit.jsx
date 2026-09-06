'use client';

import { useState } from 'react';
import Cadre from './Cadre';
import Studio from './Studio';
import { useBoutique } from './Boutique';
import { CADRES } from '@/lib/taxonomie';
import { dh, prixTaille, SEUIL_LIVRAISON } from '@/lib/prix';
import {
  IcoCamion, IcoCoeur, IcoCroix, IcoEtoile, IcoPanier, IcoPinceau, IcoRetour, IcoWhatsapp,
} from './Icones';

/** Partie interactive de la fiche produit : visuel, taille, cadre, panier,
 *  et l'essai grandeur nature dans une fenêtre superposée. */
export default function FicheProduit({ produit, oeuvresStudio, pieces, whatsapp }) {
  const { ajouter, favoris, basculerFavori } = useBoutique();
  const [taille, setTaille] = useState(produit.tailles[1] || produit.tailles[0]);
  const [cadre, setCadre] = useState('noir');
  const [passe, setPasse] = useState(false);
  const [studio, setStudio] = useState(false);

  const prix = prixTaille(produit, taille, cadre);
  const aime = favoris.includes(produit.slug);

  const auPanier = () => ajouter({
    slug: produit.slug,
    titre: produit.titre,
    image: produit.image,
    thumb: produit.thumb,
    ratio: taille.l / taille.h,
    taille,
    cadre,
    passe,
    prixUnit: prix.final,
    qte: 1,
  });

  return (
    <>
      <div className="prod-layout">
        <div>
          <div className="prod-visual">
            <Cadre
              src={produit.image}
              alt={`${produit.titre} — ${produit.artiste}`}
              ratio={taille.l / taille.h}
              cadre={cadre}
              passe={passe}
              priority
              style={{ maxWidth: 'min(100%, 520px)' }}
            />
          </div>

          <div className="prod-views">
            {CADRES.map((c) => (
              <button
                key={c.slug}
                className={cadre === c.slug ? 'on' : ''}
                onClick={() => setCadre(c.slug)}
              >
                <span
                  className="swatch"
                  style={{ background: c.hex === 'transparent' ? 'repeating-linear-gradient(45deg,#ddd,#ddd 3px,#fff 3px,#fff 6px)' : c.hex }}
                />
                {c.nom}{c.supp > 0 ? ` +${c.supp} DH` : ''}
              </button>
            ))}
            <button className={passe ? 'on' : ''} onClick={() => setPasse((v) => !v)}>
              Passe-partout
            </button>
          </div>

          <button className="btn btn-clay btn-block mt-2" onClick={() => setStudio(true)}>
            <IcoPinceau size={17} /> Voir cette œuvre sur mon mur
          </button>
        </div>

        <div className="prod-info">
          <span className="eyebrow">{produit.artiste}{produit.epoque ? ` · ${produit.epoque}` : ''}</span>
          <h1 className="d2">{produit.titre}</h1>

          <div className="row" style={{ gap: '0.6rem' }}>
            <span className="stars" aria-label={`Note ${produit.note} sur 5`}>
              {[0, 1, 2, 3, 4].map((i) => <IcoEtoile key={i} size={13} plein={i < Math.round(produit.note)} />)}
            </span>
            <span className="tiny muted">{produit.note.toFixed(1)} · {produit.avis} avis</span>
            {produit.promo > 0 && <span className="badge badge-promo">-{produit.promo} %</span>}
          </div>

          <div className="price-row">
            <span className="price-now">{dh(prix.final)}</span>
            {prix.remise > 0 && <span className="price-old">{dh(prix.base)}</span>}
          </div>
          <p className="tiny muted">
            Prix pour {taille.l} × {taille.h} cm, {cadre === 'aucun' ? 'toile sans cadre' : `cadre ${CADRES.find((c) => c.slug === cadre)?.nom.toLowerCase()}`}.
            Livraison offerte dès {dh(SEUIL_LIVRAISON)}.
          </p>

          <div className="mt-3">
            <h4 className="lab">Format <span>*</span></h4>
            <div className="size-grid">
              {produit.tailles.map((t) => (
                <button
                  key={t.ref}
                  className={`size-opt${taille.ref === t.ref ? ' on' : ''}`}
                  onClick={() => setTaille(t)}
                >
                  <b>{t.l} × {t.h}</b>
                  <span>{dh(prixTaille(produit, t, cadre).final)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sticky-buy">
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={auPanier}>
                <IcoPanier size={17} /> Ajouter au panier
              </button>
              <button
                className="icon-btn"
                style={{ border: '1px solid var(--line)', width: 48, height: 48 }}
                onClick={() => basculerFavori(produit.slug)}
                aria-label={aime ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <IcoCoeur style={aime ? { fill: 'var(--clay)', color: 'var(--clay)' } : undefined} />
              </button>
            </div>
            <a
              className="btn btn-ghost btn-block mt-1"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite commander « ${produit.titre} » en ${taille.l} × ${taille.h} cm.`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IcoWhatsapp size={17} /> Commander sur WhatsApp
            </a>
          </div>

          <div className="row mt-2" style={{ gap: '1.25rem' }}>
            <span className="tiny muted row" style={{ gap: '0.4rem' }}><IcoCamion size={16} /> Livré en 48 h</span>
            <span className="tiny muted row" style={{ gap: '0.4rem' }}><IcoRetour size={16} /> Retour 14 jours</span>
          </div>

          <div className="mt-3">
            <details className="acc-faq" open>
              <summary>Description</summary>
              <p style={{ whiteSpace: 'pre-line' }}>{produit.description}</p>
            </details>
            <details className="acc-faq">
              <summary>Impression & encadrement</summary>
              <p>
                Impression pigmentaire douze couleurs, toile d’art 380 g ou papier mat 250 g
                selon le format. Moulure en bois de 20 mm, montage à la main, attaches et
                niveau à bulle fournis. Chaque pièce est contrôlée avant emballage.
              </p>
            </details>
            <details className="acc-faq">
              <summary>Quel format choisir ?</summary>
              <p>
                Au-dessus d’un canapé, visez les deux tiers de la largeur du meuble :
                pour un canapé de 210 cm, un 120 × 80 ou deux 60 × 90 côte à côte.
                Dans une entrée, un format vertical 50 × 70 suffit. Le studio d’essayage
                répond en dix secondes, à l’échelle de votre mur.
              </p>
            </details>
            <details className="acc-faq">
              <summary>Livraison & paiement</summary>
              <p>
                48 h à Casablanca, Rabat, Marrakech et Tanger, 3 à 5 jours ouvrés ailleurs
                au Maroc. Paiement à la livraison sans supplément, ou virement bancaire.
                Livraison offerte dès {dh(SEUIL_LIVRAISON)} d’achat.
              </p>
            </details>
          </div>
        </div>
      </div>

      {/* ---------------------------- studio en superposition ---------------------------- */}
      {studio && (
        <div className="modale" role="dialog" aria-modal="true" aria-label="Studio d’essayage">
          <div className="modale-bg" onClick={() => setStudio(false)} />
          <div className="modale-boite">
            <div className="modale-tete">
              <div>
                <span className="eyebrow">Studio d’essayage</span>
                <h2 className="d4" style={{ marginTop: '0.35rem' }}>{produit.titre}</h2>
              </div>
              <button className="icon-btn" onClick={() => setStudio(false)} aria-label="Fermer le studio">
                <IcoCroix />
              </button>
            </div>
            <div className="modale-corps">
              <Studio oeuvres={oeuvresStudio} pieces={pieces} slugInitial={produit.slug} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
