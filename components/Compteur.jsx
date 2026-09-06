'use client';

import { useEffect, useState } from 'react';

const BOITES = [
  ['jours', 864e5],
  ['heures', 36e5],
  ['minutes', 6e4],
  ['secondes', 1e3],
];

/** Compte à rebours de fin de vente flash. Rendu vide côté serveur pour éviter
 *  toute différence d'hydratation. */
export default function Compteur({ fin }) {
  const [reste, setReste] = useState(null);

  useEffect(() => {
    if (!fin) return undefined;
    const calc = () => setReste(Math.max(0, new Date(fin).getTime() - Date.now()));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [fin]);

  if (reste === null) return null;

  let restant = reste;
  const valeurs = BOITES.map(([nom, ms]) => {
    const v = Math.floor(restant / ms);
    restant -= v * ms;
    return [nom, v];
  });

  return (
    <div className="countdown" role="timer" aria-label="Fin de la vente flash">
      {valeurs.map(([nom, v]) => (
        <div className="cd-box" key={nom}>
          <b>{String(v).padStart(2, '0')}</b>
          <span>{nom}</span>
        </div>
      ))}
    </div>
  );
}
