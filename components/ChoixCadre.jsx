'use client';

import { CADRES, cadreClair, degradeCadre } from '@/lib/taxonomie';

/** Choix du cadre en vignettes : chacune montre le coin d'une toile dans sa
 *  moulure, comme on la verrait accrochée. Le nom du cadre retenu s'affiche
 *  dans l'intitulé. `cadres` : ceux que l'admin propose pour l'œuvre. */
export default function ChoixCadre({ valeur, onChange, cadres = CADRES, titre = 'Cadre', Titre = 'h4' }) {
  const courant = cadres.find((c) => c.slug === valeur);

  return (
    <div className="choix-cadre">
      <Titre className="lab">
        {titre} : <em>{courant?.nom}</em>
        {courant?.supp > 0 && <small> (+{courant.supp} DH)</small>}
      </Titre>
      <div className="cadre-tuiles" role="radiogroup" aria-label={titre}>
        {cadres.map((c) => (
          <button
            key={c.slug}
            type="button"
            role="radio"
            aria-checked={valeur === c.slug}
            className={`cadre-tuile${valeur === c.slug ? ' on' : ''}`}
            onClick={() => onChange(c.slug)}
            title={c.desc ? `${c.nom} — ${c.desc}` : c.nom}
          >
            <span
              className={`cadre-coin${c.slug === 'aucun' ? ' cadre-coin-aucun' : ''}${cadreClair(c.hex) ? ' clair' : ''}`}
              style={c.slug === 'aucun' ? undefined : { '--moulure': degradeCadre(c.hex) }}
              aria-hidden="true"
            >
              <span className="cadre-toile" />
            </span>
            <span className="cadre-nom">{c.nom}</span>
            <span className="cadre-supp">{c.supp > 0 ? `+${c.supp} DH` : 'Inclus'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
