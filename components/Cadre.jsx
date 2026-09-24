import { degradeCadre } from '@/lib/taxonomie';

/**
 * Rend une œuvre encadrée. Utilisé partout : cartes, fiche produit, studio,
 * panier. Le cadre est purement CSS (dégradés), donc zéro image
 * supplémentaire à charger et un rendu net à n'importe quelle taille.
 *
 *  - `ratio`  largeur / hauteur de l'œuvre
 *  - `cadre`  aucun | noir | chene | blanc | dore
 *  - `couleur` teinte saisie par l'admin (#rrggbb) : prime sur celle du slug
 *  - `passe`  passe-partout blanc autour de l'image
 *  - `fit`    "auto" (défaut) : occupe la largeur en paysage, la hauteur en portrait
 */
export default function Cadre({
  src,
  srcSet,
  sizes,
  alt = '',
  ratio = 0.8,
  cadre = 'aucun',
  couleur,
  passe = false,
  fit = 'auto',
  className = '',
  style,
  priority = false,
  ...rest
}) {
  const horizontal = fit === 'width' || (fit === 'auto' && ratio >= 1);

  const teinte = cadre !== 'aucun' && /^#[0-9a-f]{6}$/i.test(couleur || '');
  const styleCadre = {
    ...(horizontal ? { width: '100%' } : { height: '100%', width: 'auto' }),
    ...(teinte ? { background: degradeCadre(couleur) } : null),
    ...style,
  };

  const styleImage = horizontal
    ? { width: '100%', height: 'auto', aspectRatio: String(ratio) }
    : { height: '100%', width: 'auto', aspectRatio: String(ratio) };

  const image = (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      style={styleImage}
    />
  );

  return (
    <div
      className={`frame ${teinte ? 'frame-teinte' : `frame-${cadre}`}${passe ? ' passe' : ''} ${className}`.trim()}
      style={styleCadre}
      {...rest}
    >
      {passe ? <div className="mat" style={horizontal ? undefined : { height: '100%' }}>{image}</div> : image}
    </div>
  );
}
