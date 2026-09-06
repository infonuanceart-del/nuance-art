'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dh, prixAffiche } from '@/lib/prix';
import { IcoPinceau } from './Icones';

/**
 * Scène du héros : un vrai mur, et l'œuvre qui change toutes les 4 secondes.
 * C'est la promesse du site en une image — « voilà ce que ça donne chez vous ».
 */
export default function HeroScene({ piece, oeuvres = [] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (oeuvres.length < 2) return undefined;
    const t = setInterval(() => setI((v) => (v + 1) % oeuvres.length), 4200);
    return () => clearInterval(t);
  }, [oeuvres.length]);

  const o = oeuvres[i];
  if (!piece || !o) return null;
  const prix = prixAffiche(o);

  return (
    <div className="scene" style={{ aspectRatio: String(piece.ratio) }}>
      <img className="room" src={piece.image} alt="Salon avec un mur clair" />

      {oeuvres.map((oe, k) => (
        <div
          key={oe.slug}
          className="scene-art frame frame-noir"
          style={{
            left: '72%',
            top: '42%',
            width: '21%',
            transform: 'translate(-50%, -50%)',
            opacity: k === i ? 1 : 0,
            padding: '1.6%',
          }}
          aria-hidden={k !== i}
        >
          <img
            src={oe.image}
            alt=""
            style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover' }}
            loading={k === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      <div className="scene-tag">
        <span>
          <strong>{o.titre}</strong>
          <span>{o.artiste} · 50 × 70 cm · cadre noir · {dh(prix.final)}</span>
        </span>
        <Link href={`/studio?oeuvre=${o.slug}`} className="btn btn-primary btn-sm">
          <IcoPinceau size={15} /> Sur mon mur
        </Link>
      </div>
    </div>
  );
}
