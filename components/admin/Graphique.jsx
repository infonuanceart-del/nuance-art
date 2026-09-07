'use client';

/**
 * Petits graphiques du tableau de bord, en SVG ecrit a la main.
 *
 * Le projet n'embarque aucune bibliotheque de graphiques et n'a pas besoin
 * d'en embarquer une : deux formes suffisent ici, et un SVG en ligne se rend
 * cote serveur, se met a l'echelle sans JavaScript et suit la charte au lieu
 * d'imposer la sienne.
 */

/** Repere en pourcentage, pour un SVG qui se redimensionne avec sa colonne. */
const L = 720;

/**
 * Courbe d'aire du chiffre d'affaires.
 *
 * @param {{t:number, ca:number, nb:number}[]} points  une entree par journee
 * @param {(v:number)=>string} format  mise en forme de l'infobulle
 */
export function Courbe({ points, format = String, hauteur = 170 }) {
  const H = hauteur;
  const marge = { g: 4, d: 4, h: 14, b: 20 };
  const n = points.length;

  if (!n) return null;

  const max = Math.max(1, ...points.map((p) => p.ca));
  const large = L - marge.g - marge.d;
  const haut = H - marge.h - marge.b;

  const x = (i) => (n === 1 ? marge.g + large / 2 : marge.g + (i * large) / (n - 1));
  const y = (v) => marge.h + (1 - v / max) * haut;

  const ligne = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)} ${y(p.ca).toFixed(2)}`).join(' ');
  const aire = `${ligne} L${x(n - 1).toFixed(2)} ${marge.h + haut} L${x(0).toFixed(2)} ${marge.h + haut} Z`;

  // Au-dela d'un mois les pastilles se chevauchent et brouillent la lecture.
  const pastilles = n <= 31;
  const jour = (t) => new Date(t).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' });

  return (
    <svg
      className="graph"
      viewBox={`0 0 ${L} ${H}`}
      role="img"
      aria-label={`Chiffre d’affaires par jour, maximum ${format(max)}`}
    >
      <defs>
        <linearGradient id="graph-remplissage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--clay)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--clay)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ligne de base : sans elle l'aire flotte quand toutes les valeurs sont nulles. */}
      <line
        x1={marge.g} y1={marge.h + haut} x2={L - marge.d} y2={marge.h + haut}
        stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke"
      />

      <path d={aire} fill="url(#graph-remplissage)" />
      <path
        d={ligne}
        fill="none"
        stroke="var(--clay)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {points.map((p, i) => (
        <g key={p.t}>
          {pastilles && p.ca > 0 && (
            <circle
              cx={x(i)} cy={y(p.ca)} r="3"
              fill="var(--paper)" stroke="var(--clay)" strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {/* Bande transparente : donne une infobulle native sur toute la hauteur. */}
          <rect
            x={x(i) - large / (2 * Math.max(1, n - 1))}
            y={marge.h}
            width={large / Math.max(1, n - 1)}
            height={haut}
            fill="transparent"
          >
            <title>{`${jour(p.t)} — ${format(p.ca)} · ${p.nb} commande${p.nb > 1 ? 's' : ''}`}</title>
          </rect>
        </g>
      ))}
    </svg>
  );
}

/** Repere temporel sous la courbe : premiere et derniere journee affichees. */
export function BornesCourbe({ points }) {
  if (points.length < 2) return null;
  const jour = (t) => new Date(t).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' });
  return (
    <div className="graph-bornes tiny">
      <span>{jour(points[0].t)}</span>
      <span>{jour(points[points.length - 1].t)}</span>
    </div>
  );
}

/**
 * Barres horizontales pour un classement court (themes, villes, statuts).
 *
 * @param {{cle:string, nom:string, valeur:number, note?:string}[]} lignes
 */
export function Barres({ lignes, format = String, vide = 'Rien a afficher.' }) {
  if (!lignes.length) return <p className="admin-vide">{vide}</p>;

  const max = Math.max(1, ...lignes.map((l) => l.valeur));

  return (
    <ul className="barres">
      {lignes.map((l) => (
        <li key={l.cle}>
          <span className="barres-nom" title={l.nom}>{l.nom}</span>
          <span className="barres-piste">
            <span className="barres-jauge" style={{ width: `${(l.valeur / max) * 100}%` }} />
          </span>
          <b>{format(l.valeur)}</b>
        </li>
      ))}
    </ul>
  );
}
