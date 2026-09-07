'use client';

/**
 * Catalogue filtrable. Les filtres vivent dans l'URL (partageable, indexable,
 * et le retour arrière fonctionne), le filtrage lui-même est fait en mémoire :
 * 81 œuvres tiennent largement côté client, donc zéro aller-retour réseau.
 */
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CarteProduit from './CarteProduit';
import { FORMATS, PIECES, THEMES } from '@/lib/taxonomie';
import { prixAffiche } from '@/lib/prix';
import { IcoCroix, IcoLoupe } from './Icones';

const TRIS = [
  { cle: 'populaires', nom: 'Les plus populaires' },
  { cle: 'nouveautes', nom: 'Nouveautés' },
  { cle: 'prix-croissant', nom: 'Prix croissant' },
  { cle: 'prix-decroissant', nom: 'Prix décroissant' },
  { cle: 'promo', nom: 'Meilleures remises' },
];

const MULTI = ['theme', 'format', 'piece'];

export default function Catalogue({ produits, themeVerrouille = null, titreVide = 'Aucune œuvre ne correspond' }) {
  const router = useRouter();
  const chemin = usePathname();
  const params = useSearchParams();
  const [panneau, setPanneau] = useState(false);
  const [q, setQ] = useState(params.get('q') || '');

  const lire = (cle) => (params.get(cle) || '').split(',').filter(Boolean);
  const tri = params.get('tri') || 'populaires';
  const promoSeule = params.get('promo') === '1';

  const sel = {
    theme: themeVerrouille ? [themeVerrouille] : lire('theme'),
    format: lire('format'),
    piece: lire('piece'),
  };

  useEffect(() => { setQ(params.get('q') || ''); }, [params]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', panneau);
    return () => document.body.classList.remove('no-scroll');
  }, [panneau]);

  function ecrire(patch) {
    const p = new URLSearchParams(params.toString());
    for (const [cle, valeur] of Object.entries(patch)) {
      if (!valeur || valeur.length === 0) p.delete(cle);
      else p.set(cle, Array.isArray(valeur) ? valeur.join(',') : valeur);
    }
    const s = p.toString();
    router.replace(s ? `${chemin}?${s}` : chemin, { scroll: false });
  }

  const basculer = (cle, valeur) => {
    const actuel = sel[cle];
    ecrire({ [cle]: actuel.includes(valeur) ? actuel.filter((v) => v !== valeur) : [...actuel, valeur] });
  };

  const toutEffacer = () => {
    const p = new URLSearchParams();
    if (params.get('tri')) p.set('tri', params.get('tri'));
    router.replace(p.toString() ? `${chemin}?${p}` : chemin, { scroll: false });
  };

  /* --- comptages, calculés sur le catalogue complet pour rester stables --- */
  const compte = useMemo(() => {
    const c = { theme: {}, format: {}, piece: {} };
    for (const p of produits) {
      c.theme[p.theme] = (c.theme[p.theme] || 0) + 1;
      c.format[p.format] = (c.format[p.format] || 0) + 1;
      for (const pi of p.pieces || []) c.piece[pi] = (c.piece[pi] || 0) + 1;
    }
    return c;
  }, [produits]);

  const resultats = useMemo(() => {
    const texte = (params.get('q') || '').trim().toLowerCase();
    let liste = produits.filter((p) => {
      if (sel.theme.length && !sel.theme.includes(p.theme)) return false;
      if (sel.format.length && !sel.format.includes(p.format)) return false;
      if (sel.piece.length && !(p.pieces || []).some((x) => sel.piece.includes(x))) return false;
      if (promoSeule && !(p.promo > 0)) return false;
      if (texte) {
        const foin = `${p.titre} ${p.titreOriginal || ''} ${p.artiste} ${p.theme}`.toLowerCase();
        if (!foin.includes(texte)) return false;
      }
      return true;
    });

    const prix = (p) => prixAffiche(p).final;
    const ordres = {
      populaires: (a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0) || b.note - a.note,
      nouveautes: (a, b) => (b.nouveaute ? 1 : 0) - (a.nouveaute ? 1 : 0) || a.ordre - b.ordre,
      'prix-croissant': (a, b) => prix(a) - prix(b),
      'prix-decroissant': (a, b) => prix(b) - prix(a),
      promo: (a, b) => (b.promo || 0) - (a.promo || 0),
    };
    liste = [...liste].sort(ordres[tri] || ordres.populaires);
    return liste;
  }, [produits, params, tri, promoSeule]);

  const actifs = [
    ...(themeVerrouille ? [] : sel.theme.map((v) => ['theme', v, THEMES.find((t) => t.slug === v)?.nom])),
    ...sel.format.map((v) => ['format', v, FORMATS.find((t) => t.slug === v)?.nom]),
    ...sel.piece.map((v) => ['piece', v, PIECES.find((t) => t.slug === v)?.nom]),
  ];

  const groupe = (cle, titre, options, rendu) => (
    <div className="fgroup" key={cle}>
      <h4>{titre}</h4>
      {options.map((o) => (
        <label className="fopt" key={o.slug}>
          <input
            type="checkbox"
            checked={sel[cle].includes(o.slug)}
            onChange={() => basculer(cle, o.slug)}
          />
          {rendu ? rendu(o) : o.nom}
          <i>{compte[cle][o.slug] || 0}</i>
        </label>
      ))}
    </div>
  );

  return (
    <div className="cat-layout">
      <div className={`voile${panneau ? ' on' : ''}`} onClick={() => setPanneau(false)} />

      <aside className={`filters${panneau ? ' open' : ''}`} aria-label="Filtres">
        <div className="filtres-fermer">
          <b>Filtrer</b>
          <button className="icon-btn" onClick={() => setPanneau(false)} aria-label="Fermer les filtres">
            <IcoCroix />
          </button>
        </div>

        <div className="fgroup">
          <h4>Rechercher</h4>
          <form
            onSubmit={(e) => { e.preventDefault(); ecrire({ q }); }}
            style={{ position: 'relative' }}
          >
            <input
              className="inp"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => ecrire({ q })}
              placeholder="Titre, artiste…"
              aria-label="Rechercher dans le catalogue"
              style={{ paddingRight: '2.4rem' }}
            />
            <button
              type="submit"
              aria-label="Lancer la recherche"
              style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
            >
              <IcoLoupe size={17} />
            </button>
          </form>
        </div>

        {!themeVerrouille && groupe('theme', 'Collection', THEMES)}
        {groupe('format', 'Format', FORMATS)}
        {groupe('piece', 'Pièce conseillée', PIECES)}

        <div className="fgroup">
          <h4>Bons plans</h4>
          <label className="fopt">
            <input type="checkbox" checked={promoSeule} onChange={() => ecrire({ promo: promoSeule ? '' : '1' })} />
            En promotion
            <i>{produits.filter((p) => p.promo > 0).length}</i>
          </label>
        </div>

        <button className="btn btn-ghost btn-sm btn-block" onClick={toutEffacer}>
          Tout effacer
        </button>
      </aside>

      <div>
        <div className="cat-bar">
          <div className="filtres-mobile">
            <button className="btn btn-ghost btn-sm" onClick={() => setPanneau(true)}>
              Filtrer{actifs.length > 0 ? ` (${actifs.length})` : ''}
            </button>
          </div>

          <span className="small muted">
            {resultats.length} œuvre{resultats.length > 1 ? 's' : ''}
          </span>

          <div className="active-filters">
            {actifs.map(([cle, valeur, nom]) => (
              <span className="pill" key={cle + valeur}>
                {nom || valeur}
                <button onClick={() => basculer(cle, valeur)} aria-label={`Retirer ${nom}`}>
                  <IcoCroix size={12} />
                </button>
              </span>
            ))}
            {promoSeule && (
              <span className="pill">
                En promotion
                <button onClick={() => ecrire({ promo: '' })} aria-label="Retirer le filtre promotion">
                  <IcoCroix size={12} />
                </button>
              </span>
            )}
          </div>

          <label style={{ marginLeft: 'auto' }} className="row">
            <span className="tiny muted hide-sm">Trier</span>
            <select className="select" value={tri} onChange={(e) => ecrire({ tri: e.target.value })} aria-label="Trier les œuvres">
              {TRIS.map((t) => <option key={t.cle} value={t.cle}>{t.nom}</option>)}
            </select>
          </label>
        </div>

        {resultats.length === 0 ? (
          <div className="empty-state">
            <h3 className="d4">{titreVide}</h3>
            <p className="muted small mt-1">Essayez d’élargir le format ou la collection.</p>
            <button className="btn btn-primary btn-sm mt-2" onClick={toutEffacer}>Réinitialiser les filtres</button>
          </div>
        ) : (
          <div className="grid-produits">
            {resultats.map((p, i) => <CarteProduit key={p.slug} produit={p} priority={i < 4} />)}
          </div>
        )}
      </div>
    </div>
  );
}
