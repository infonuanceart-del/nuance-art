/**
 * Rend une œuvre encadrée. Utilisé partout : cartes, fiche produit, studio,
 * panier. Le cadre est purement CSS (dégradés), donc zéro image
 * supplémentaire à charger et un rendu net à n'importe quelle taille.
 *
 *  - `ratio`  largeur / hauteur de l'œuvre
 *  - `cadre`  aucun | noir | chene | blanc | dore
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
  passe = false,
  fit = 'auto',
  className = '',
  style,
  priority = false,
  ...rest
}) {
  const horizontal = fit === 'width' || (fit === 'auto' && ratio >= 1);

  const styleCadre = horizontal
    ? { width: '100%', ...style }
    : { height: '100%', width: 'auto', ...style };

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
      className={`frame frame-${cadre}${passe ? ' passe' : ''} ${className}`.trim()}
      style={styleCadre}
      {...rest}
    >
      {passe ? <div className="mat" style={horizontal ? undefined : { height: '100%' }}>{image}</div> : image}
    </div>
  );
}
