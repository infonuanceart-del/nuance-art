'use client';

import Link from 'next/link';
import Cadre from './Cadre';
import { useBoutique } from './Boutique';
import { dh, prixAffiche } from '@/lib/prix';
import { nomTheme } from '@/lib/taxonomie';
import { IcoCoeur, IcoEtoile, IcoOeil, IcoPinceau } from './Icones';

export default function CarteProduit({ produit, priority = false, cadre = 'noir' }) {
  const { favoris, basculerFavori } = useBoutique();
  const prix = prixAffiche(produit);
  const aime = favoris.includes(produit.slug);

  return (
    <article className="card">
      <div className="card-media">
        <div className="card-flags">
          {produit.promo > 0 && <span className="badge badge-promo">-{produit.promo} %</span>}
          {produit.nouveaute && <span className="badge badge-new">Nouveau</span>}
          {produit.bestseller && <span className="badge badge-best">Best-seller</span>}
        </div>

        <button
          className="card-coeur"
          aria-label={aime ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={aime}
          onClick={(e) => { e.preventDefault(); basculerFavori(produit.slug); }}
        >
          <IcoCoeur size={17} style={aime ? { fill: 'var(--clay)', color: 'var(--clay)' } : undefined} />
        </button>

        <Cadre
          src={produit.thumb}
          srcSet={`${produit.thumb} 520w, ${produit.image} 1400w`}
          sizes="(max-width: 720px) 45vw, (max-width: 1100px) 30vw, 280px"
          alt={`${produit.titre} — ${produit.artiste}`}
          ratio={produit.ratio}
          cadre={cadre}
          priority={priority}
        />

        <div className="card-quick">
          {/* sur petit ecran le libelle disparait : il ne reste que l'oeil, et
              aria-label garde l'intitule pour les lecteurs d'ecran */}
          <Link
            href={`/studio?oeuvre=${produit.slug}`}
            className="btn btn-light btn-sm card-essai"
            aria-label="Voir sur mon mur"
          >
            <IcoPinceau size={14} className="essai-ico-large" />
            <IcoOeil size={16} className="essai-ico-small" />
            <span className="essai-texte">Voir sur mon mur</span>
          </Link>
        </div>
      </div>

      <div className="card-body">
        <Link href={`/tableaux/${produit.slug}`} className="stretch">
          <h3 className="card-title">{produit.titre}</h3>
        </Link>
        <span className="card-sub">
          {produit.artiste} · {nomTheme(produit.theme)}
        </span>
        <span className="card-price">
          {dh(prix.final)}
          {prix.remise > 0 && (
            <>
              <del>{dh(prix.base)}</del>
              <span className="off">-{prix.remise} %</span>
            </>
          )}
        </span>
        <span className="stars" aria-label={`Note ${produit.note} sur 5`}>
          {[0, 1, 2, 3, 4].map((i) => <IcoEtoile key={i} size={11} plein={i < Math.round(produit.note)} />)}
          <span className="tiny muted" style={{ marginLeft: 4 }}>({produit.avis})</span>
        </span>
      </div>
    </article>
  );
}
