'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { dh, prixAffiche } from '@/lib/prix';
import { IcoFleche } from './Icones';

const DUREE = 5400;

/**
 * Scène du héros : une cimaise de galerie.
 *
 * L'œuvre est accrochée à une cimaise, éclairée, et accompagnée de son cartel —
 * le même vocabulaire qu'une salle d'exposition. Elle change toutes les 5 s ;
 * le survol met la rotation en pause, et les pastilles permettent de choisir.
 */
export default function HeroScene({ oeuvres = [] }) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (oeuvres.length < 2 || pause) return undefined;
    // une personne qui a demandé moins d'animation garde une image fixe
    const calme = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calme) return undefined;

    const t = setInterval(() => setI((v) => (v + 1) % oeuvres.length), DUREE);
    return () => clearInterval(t);
  }, [oeuvres.length, pause]);

  const suspendre = useCallback(() => setPause(true), []);
  const reprendre = useCallback(() => setPause(false), []);

  const o = oeuvres[i];
  if (!o) return null;

  const prix = prixAffiche(o);
  // la plus grande taille disponible : c'est celle qui fait rêver en vitrine
  const grande = o.tailles?.[o.tailles.length - 1];

  return (
    <div
      className="cimaise"
      onMouseEnter={suspendre}
      onMouseLeave={reprendre}
      onFocusCapture={suspendre}
      onBlurCapture={reprendre}
    >
      <div className="cimaise-mur" aria-hidden="true">
        <span className="cimaise-rail" />
        <span className="cimaise-lueur" />
      </div>

      <div className="cimaise-accroche">
        <span className="cimaise-fil" aria-hidden="true" />

        <div className="cimaise-cadres">
          {oeuvres.map((oe, k) => (
            <div
              key={oe.slug}
              className={`cimaise-cadre frame frame-noir passe${k === i ? ' est-vue' : ''}`}
              aria-hidden={k !== i}
            >
              <div className="mat">
                <img
                  src={oe.image}
                  alt={k === i ? `${oe.titre}, ${oe.artiste}` : ''}
                  loading={k === 0 ? 'eager' : 'lazy'}
                  fetchPriority={k === 0 ? 'high' : 'auto'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* le cartel, comme au musée : titre, auteur, technique, format, prix */}
      <figcaption className="cartel">
        <div className="cartel-texte">
          <strong>{o.titre}</strong>
          <span>
            {o.artiste}
            {o.epoque ? <> · <i>{o.epoque}</i></> : null}
          </span>
          <span className="cartel-tech">
            Tirage pigmentaire sur toile d’art
            {grande ? ` · jusqu’à ${grande.l} × ${grande.h} cm` : ''}
          </span>
        </div>

        <div className="cartel-prix">
          <span className="cartel-des">à partir de</span>
          <strong>{dh(prix.final)}</strong>
          <Link href={`/tableaux/${o.slug}`} className="link-arrow">
            Voir l’œuvre <IcoFleche size={15} />
          </Link>
        </div>
      </figcaption>

      {oeuvres.length > 1 && (
        <div className="cimaise-pastilles" role="tablist" aria-label="Œuvres à l’affiche">
          {oeuvres.map((oe, k) => (
            <button
              key={oe.slug}
              type="button"
              role="tab"
              aria-selected={k === i}
              aria-label={oe.titre}
              className={k === i ? 'est-vue' : undefined}
              onClick={() => setI(k)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
