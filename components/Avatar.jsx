/**
 * Pastille d'avatar dessinée à partir du nom.
 *
 * Volontairement pas une photo : illustrer un avis client avec le portrait
 * d'un inconnu laisserait croire que la personne a été photographiée. On
 * dessine donc un disque dégradé, tiré du nom, avec ses initiales — toujours
 * le même rendu pour le même nom, et aucun appel réseau.
 */

// Deux teintes par duo, prises dans la palette du site.
const DUOS = [
  ['#c39a4e', '#8d3f21'],
  ['#57634a', '#c39a4e'],
  ['#b0512c', '#e4d8c4'],
  ['#3b342c', '#c39a4e'],
  ['#8d3f21', '#57634a'],
];

function empreinte(nom) {
  let n = 0;
  for (const c of nom) n = (n * 31 + c.codePointAt(0)) % 100000;
  return n;
}

export default function Avatar({ nom, taille = 34 }) {
  const initiales = nom
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join('')
    .toUpperCase();

  const n = empreinte(nom);
  const [a, b] = DUOS[n % DUOS.length];
  const id = `av-${n}`;
  // l'angle du dégradé varie aussi : deux noms voisins ne se ressemblent pas
  const angle = (n % 4) * 45;

  return (
    <svg
      className="avis-avatar"
      width={taille}
      height={taille}
      viewBox="0 0 64 64"
      role="img"
      aria-label={nom}
    >
      <defs>
        <linearGradient id={id} gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0%" stopColor={a} />
          <stop offset="100%" stopColor={b} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${id})`} />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fcfaf6"
        fontSize="26"
        fontFamily="Didot, 'Bodoni MT', Georgia, serif"
        letterSpacing="0.5"
      >
        {initiales}
      </text>
    </svg>
  );
}
