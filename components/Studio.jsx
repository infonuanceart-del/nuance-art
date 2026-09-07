'use client';

/**
 * STUDIO D'ESSAYAGE
 *
 * Le client charge la photo de sa pièce (ou prend une photo), pose une ou
 * plusieurs œuvres sur le mur, les déplace, les tourne et change leur taille.
 *
 * Le point important : l'échelle est RÉELLE. On demande la largeur du pan de
 * mur visible sur la photo, ce qui donne un nombre de pixels par centimètre ;
 * un 60 × 90 s'affiche alors exactement à la taille qu'il aura chez lui.
 *
 * Tout se passe dans le navigateur : aucune image n'est envoyée sur un serveur.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CADRES, CADRE_PAR_SLUG } from '@/lib/taxonomie';
import { dh, prixTaille } from '@/lib/prix';
import { useBoutique } from './Boutique';
import {
  IcoCamera, IcoCroix, IcoImage, IcoPlus, IcoPoubelle, IcoRegle,
  IcoRotation, IcoTelecharger, IcoPanier,
} from './Icones';

/* Dégradés du cadre pour l'affichage écran. */
const DEGRADE = {
  aucun: 'transparent',
  noir: 'linear-gradient(140deg,#2f2b26,#14110f 58%,#241f1b)',
  chene: 'linear-gradient(140deg,#dcb98c,#b98d5b 55%,#cda775)',
  blanc: 'linear-gradient(140deg,#ffffff,#e9e4da 60%,#f7f4ee)',
  dore: 'linear-gradient(140deg,#eacd82,#b9902f 52%,#dcbd68)',
};

/* Couleur pleine équivalente, pour l'export en image. */
const PLEIN = { aucun: null, noir: '#1c1815', chene: '#c1935f', blanc: '#f1ede5', dore: '#c9a24d' };

const BORD_CM = 2.4;   // largeur de la moulure, en centimètres réels
const MARIE_CM = 4.5;  // largeur du passe-partout

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const uid = () => Math.random().toString(36).slice(2, 9);

export default function Studio({ oeuvres = [], pieces = [], slugInitial = null, compact = false }) {
  const { ajouter } = useBoutique();

  const scene = useRef(null);
  const zone = useRef(null);
  const fichier = useRef(null);
  const photo = useRef(null);

  const [fond, setFond] = useState(() => pieces[0] || null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [murCm, setMurCm] = useState(340);
  const [items, setItems] = useState([]);
  const [sel, setSel] = useState(null);
  const [choix, setChoix] = useState(() => {
    const dep = oeuvres.find((o) => o.slug === slugInitial);
    return dep || oeuvres[0] || null;
  });
  const [ombre, setOmbre] = useState(true);
  const [aide, setAide] = useState(true);
  const [occupe, setOccupe] = useState(false);

  const pxParCm = dims.w ? dims.w / murCm : 0;

  /* --- taille de la scène, suivie en continu (responsive + rotation mobile) --- */
  useEffect(() => {
    const el = scene.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setDims({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* --- première œuvre posée automatiquement --- */
  useEffect(() => {
    if (items.length === 0 && choix && dims.w > 0) {
      setItems([creerItem(choix, { x: 0.5, y: 0.38 })]);
    }
    // volontairement limité au premier rendu utile
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.w, choix]);

  function creerItem(oeuvre, pos = {}) {
    const tailles = oeuvre.tailles || [];
    const taille = tailles[Math.min(2, tailles.length - 1)] || { l: 50, h: 70, prix: oeuvre.prixMin, ref: '50x70' };
    const id = uid();
    setSel(id);
    return {
      id,
      slug: oeuvre.slug,
      titre: oeuvre.titre,
      image: oeuvre.image,
      thumb: oeuvre.thumb,
      promo: oeuvre.promo || 0,
      prixMin: oeuvre.prixMin,
      tailles,
      taille,
      cadre: 'noir',
      passe: false,
      x: pos.x ?? 0.5,
      y: pos.y ?? 0.38,
      rot: 0,
    };
  }

  const majItem = useCallback((id, patch) => {
    setItems((l) => l.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const courant = items.find((i) => i.id === sel) || null;

  /* ------------------------------------------------------------ déplacement */
  const commencerDeplacement = (e, item) => {
    e.stopPropagation();
    setSel(item.id);
    const rect = scene.current.getBoundingClientRect();
    const depart = { px: e.clientX, py: e.clientY, x: item.x, y: item.y };
    e.currentTarget.setPointerCapture(e.pointerId);

    const bouger = (ev) => {
      const dx = (ev.clientX - depart.px) / rect.width;
      const dy = (ev.clientY - depart.py) / rect.height;
      majItem(item.id, { x: clamp(depart.x + dx, 0.02, 0.98), y: clamp(depart.y + dy, 0.02, 0.98) });
    };
    const finir = () => {
      window.removeEventListener('pointermove', bouger);
      window.removeEventListener('pointerup', finir);
    };
    window.addEventListener('pointermove', bouger);
    window.addEventListener('pointerup', finir);
  };

  /* --- poignée d'angle : on change de TAILLE RÉELLE, en s'aimantant sur les
         formats réellement proposés à la vente --- */
  const commencerTaille = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = scene.current.getBoundingClientRect();
    const cx = rect.left + item.x * rect.width;
    const cy = rect.top + item.y * rect.height;
    const d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const l0 = item.taille.l;

    const bouger = (ev) => {
      const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
      const vise = l0 * (d / d0);
      const proche = item.tailles.reduce(
        (best, t) => (Math.abs(t.l - vise) < Math.abs(best.l - vise) ? t : best),
        item.tailles[0],
      );
      if (proche.ref !== item.taille.ref) majItem(item.id, { taille: proche });
    };
    const finir = () => {
      window.removeEventListener('pointermove', bouger);
      window.removeEventListener('pointerup', finir);
    };
    window.addEventListener('pointermove', bouger);
    window.addEventListener('pointerup', finir);
  };

  const commencerRotation = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = scene.current.getBoundingClientRect();
    const cx = rect.left + item.x * rect.width;
    const cy = rect.top + item.y * rect.height;

    const bouger = (ev) => {
      const a = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI + 90;
      // aimantation sur l'horizontale : un tableau se pose rarement de travers
      const arrondi = Math.abs(a) < 3 ? 0 : a;
      majItem(item.id, { rot: clamp(arrondi, -24, 24) });
    };
    const finir = () => {
      window.removeEventListener('pointermove', bouger);
      window.removeEventListener('pointerup', finir);
    };
    window.addEventListener('pointermove', bouger);
    window.addEventListener('pointerup', finir);
  };

  /* ------------------------------------------------------------ photo pièce */
  const chargerPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setFond({ cle: 'perso', nom: 'Ma pièce', image: url, ratio: img.width / img.height, perso: true });
      setAide(false);
    };
    img.src = url;
    e.target.value = '';
  };

  /* ------------------------------------------------------------ export PNG */
  const telecharger = async () => {
    if (!fond) return;
    setOccupe(true);
    try {
      const bg = await charger(fond.image);
      const W = Math.min(1800, bg.naturalWidth || 1600);
      const H = Math.round(W / (fond.ratio || 1.5));
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.drawImage(bg, 0, 0, W, H);

      const k = W / dims.w; // passage écran -> export
      for (const it of items) {
        const img = await charger(it.image);
        const pw = it.taille.l * pxParCm * k;
        const ph = it.taille.h * pxParCm * k;
        const bord = (it.cadre === 'aucun' ? 0 : BORD_CM) * pxParCm * k;
        const marie = (it.passe ? MARIE_CM : 0) * pxParCm * k;

        ctx.save();
        ctx.translate(it.x * W, it.y * H);
        ctx.rotate((it.rot * Math.PI) / 180);

        const totalW = pw + 2 * (bord + marie);
        const totalH = ph + 2 * (bord + marie);

        if (ombre) {
          ctx.shadowColor = 'rgba(0,0,0,0.38)';
          ctx.shadowBlur = 26 * (W / 1400);
          ctx.shadowOffsetY = 12 * (W / 1400);
        }
        if (PLEIN[it.cadre]) {
          ctx.fillStyle = PLEIN[it.cadre];
          ctx.fillRect(-totalW / 2, -totalH / 2, totalW, totalH);
        } else {
          // sans cadre : l'ombre a quand même besoin d'un support
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        if (marie > 0) {
          ctx.fillStyle = '#fbf9f4';
          ctx.fillRect(-(pw / 2 + marie), -(ph / 2 + marie), pw + 2 * marie, ph + 2 * marie);
        }

        // recadrage « cover » : l'impression remplit le format choisi
        const ri = img.naturalWidth / img.naturalHeight;
        const rc = pw / ph;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;
        if (ri > rc) sw = img.naturalHeight * rc; else sh = img.naturalWidth / rc;
        const sx = (img.naturalWidth - sw) / 2;
        const sy = (img.naturalHeight - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, -pw / 2, -ph / 2, pw, ph);
        ctx.restore();
      }

      // filigrane discret
      ctx.font = `500 ${Math.round(W / 68)}px Manrope, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.textAlign = 'right';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 10;
      ctx.fillText('nuanceart.ma', W - W / 40, H - H / 34);

      const a = document.createElement('a');
      a.download = 'nuance-art-ma-piece.png';
      a.href = cv.toDataURL('image/png');
      a.click();
    } finally {
      setOccupe(false);
    }
  };

  const charger = (src) =>
    new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });

  /* ------------------------------------------------------------ panier */
  const total = useMemo(
    () => items.reduce((s, it) => s + prixTaille(it, it.taille, it.cadre).final, 0),
    [items],
  );

  const toutAjouter = () => {
    items.forEach((it) => {
      const p = prixTaille(it, it.taille, it.cadre);
      ajouter({
        slug: it.slug, titre: it.titre, image: it.image, thumb: it.thumb,
        ratio: it.taille.l / it.taille.h,
        taille: it.taille, cadre: it.cadre, passe: it.passe,
        prixUnit: p.final, qte: 1,
      });
    });
  };

  /* ------------------------------------------------------------ rendu */
  return (
    <div className="studio-app">
      <div>
        <div className="stage-wrap" ref={zone}>
          <div className="stage-toolbar">
            <button className="btn btn-sm" onClick={() => fichier.current?.click()}>
              <IcoImage size={15} /> Ma photo
            </button>
            <button className="btn btn-sm" onClick={() => photo.current?.click()}>
              <IcoCamera size={15} /> Photo live
            </button>
            <button className="btn btn-sm" onClick={telecharger} disabled={occupe || items.length === 0}>
              <IcoTelecharger size={15} /> {occupe ? 'Export…' : 'Télécharger'}
            </button>
            {items.length > 0 && (
              <button className="btn btn-sm" onClick={() => { setItems([]); setSel(null); }}>
                <IcoCroix size={15} /> Vider
              </button>
            )}
          </div>

          <div
            className={`stage${fond ? ' has-photo' : ''}`}
            ref={scene}
            onPointerDown={() => setSel(null)}
            style={fond ? { aspectRatio: String(fond.ratio) } : undefined}
          >
            {fond ? (
              <img className="bg" src={fond.image} alt={`Aperçu dans : ${fond.nom}`} />
            ) : (
              <div className="stage-empty">
                <IcoImage size={30} />
                <p className="small muted">Choisissez une pièce d’exemple ou chargez votre photo.</p>
              </div>
            )}

            {pxParCm > 0 && items.map((it) => {
              const bord = (it.cadre === 'aucun' ? 0 : BORD_CM) * pxParCm;
              const marie = (it.passe ? MARIE_CM : 0) * pxParCm;
              const w = it.taille.l * pxParCm;
              const h = it.taille.h * pxParCm;
              return (
                <div
                  key={it.id}
                  className={`piece${sel === it.id ? ' sel' : ''}`}
                  style={{
                    left: `${it.x * 100}%`,
                    top: `${it.y * 100}%`,
                    width: w + 2 * (bord + marie),
                    height: h + 2 * (bord + marie),
                    padding: bord,
                    background: DEGRADE[it.cadre],
                    transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
                  }}
                  onPointerDown={(e) => commencerDeplacement(e, it)}
                >
                  {ombre && <span className="piece-shadow" />}
                  <div style={{ width: '100%', height: '100%', padding: marie, background: it.passe ? '#fbf9f4' : 'transparent' }}>
                    <img
                      src={it.image}
                      alt={it.titre}
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>

                  {sel === it.id && (
                    <>
                      <span
                        className="handle"
                        style={{ right: -11, bottom: -11 }}
                        onPointerDown={(e) => commencerTaille(e, it)}
                        title="Changer la taille"
                      >
                        <IcoPlus size={12} />
                      </span>
                      <span
                        className="handle rot"
                        style={{ left: '50%', top: -30, transform: 'translateX(-50%)' }}
                        onPointerDown={(e) => commencerRotation(e, it)}
                        title="Incliner"
                      >
                        <IcoRotation size={12} />
                      </span>
                      <span className="piece-cote">{it.taille.l} × {it.taille.h} cm</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Tant que le client regarde une piece d'exemple, l'essai ne lui parle
              pas vraiment de chez lui : l'invitation a charger son propre mur
              passe donc devant, et l'astuce d'echelle ne vient qu'apres. */}
          {aide && fond && !fond.perso && (
            <div className="stage-invite">
              <button onClick={() => setAide(false)} className="stage-invite-fermer" aria-label="Masquer">
                <IcoCroix size={14} />
              </button>
              <b>Voyez-la sur votre mur</b>
              <p>
                Chargez une photo de votre pièce : l’œuvre s’y pose à sa taille réelle,
                cadre compris. Rien ne quitte votre appareil.
              </p>
              <div className="stage-invite-actions">
                <button className="btn btn-primary btn-sm" onClick={() => fichier.current?.click()}>
                  <IcoImage size={15} /> Charger la photo de mon mur
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => photo.current?.click()}>
                  <IcoCamera size={15} /> Prendre la photo
                </button>
              </div>
              <span>ou continuez sur cette pièce d’exemple</span>
            </div>
          )}
        </div>

        <input ref={fichier} type="file" accept="image/*" hidden onChange={chargerPhoto} />
        <input ref={photo} type="file" accept="image/*" capture="environment" hidden onChange={chargerPhoto} />

        {!compact && (
          <p className="studio-note">
            Vos photos restent sur votre appareil : rien n’est envoyé sur nos serveurs.
            Les pièces d’exemple sont des photographies libres de droits (CC0).
          </p>
        )}
      </div>

      {/* ------------------------------- panneau de réglages ------------------------------- */}
      <div className="panel">
        <div>
          <h4>La pièce</h4>
          <div className="picker" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            {pieces.map((p) => (
              <button
                key={p.cle}
                className={fond?.cle === p.cle ? 'on' : ''}
                onClick={() => { setFond(p); setAide(true); }}
                title={p.nom}
              >
                <img src={p.image} alt={p.nom} />
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm btn-block mt-1" onClick={() => fichier.current?.click()}>
            <IcoImage size={15} /> Charger ma pièce
          </button>
        </div>

        <div className="field">
          <label htmlFor="mur">
            <IcoRegle size={15} style={{ display: 'inline', verticalAlign: '-3px' }} /> Largeur du mur visible
            <b style={{ float: 'right' }}>{(murCm / 100).toFixed(2)} m</b>
          </label>
          <input
            id="mur"
            className="range"
            type="range"
            min="150"
            max="650"
            step="5"
            value={murCm}
            onChange={(e) => setMurCm(Number(e.target.value))}
          />
          <span className="hint">
            Repères : un canapé 3 places ≈ 210 cm, une porte ≈ 80 cm. Plus le réglage est
            juste, plus la taille affichée est fidèle.
          </span>
        </div>

        <div>
          <h4>L’œuvre</h4>
          <div className="picker">
            {oeuvres.slice(0, 40).map((o) => (
              <button
                key={o.slug}
                className={choix?.slug === o.slug ? 'on' : ''}
                title={o.titre}
                onClick={() => {
                  setChoix(o);
                  if (courant) {
                    majItem(courant.id, {
                      slug: o.slug, titre: o.titre, image: o.image, thumb: o.thumb,
                      promo: o.promo || 0, prixMin: o.prixMin, tailles: o.tailles,
                      taille: o.tailles?.find((t) => t.ref === courant.taille.ref) || o.tailles?.[2] || courant.taille,
                    });
                  }
                }}
              >
                <img src={o.thumb} alt={o.titre} />
              </button>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm btn-block mt-1"
            onClick={() => choix && setItems((l) => [...l, creerItem(choix, { x: 0.5 + (l.length % 3) * 0.12, y: 0.36 })])}
          >
            <IcoPlus size={15} /> Ajouter au mur (mur de cadres)
          </button>
        </div>

        {courant ? (
          <>
            <div>
              <h4>Taille — {courant.titre.slice(0, 30)}</h4>
              <div className="chips">
                {courant.tailles.map((t) => (
                  <button
                    key={t.ref}
                    className={`chip${courant.taille.ref === t.ref ? ' on' : ''}`}
                    onClick={() => majItem(courant.id, { taille: t })}
                  >
                    {t.l} × {t.h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4>Cadre</h4>
              <div className="chips">
                {CADRES.map((c) => (
                  <button
                    key={c.slug}
                    className={`chip${courant.cadre === c.slug ? ' on' : ''}`}
                    onClick={() => majItem(courant.id, { cadre: c.slug })}
                  >
                    <span className="swatch" style={{ background: c.hex === 'transparent' ? 'repeating-linear-gradient(45deg,#eee,#eee 3px,#fff 3px,#fff 6px)' : c.hex }} />
                    {c.nom}
                  </button>
                ))}
              </div>
              <div className="chips mt-1">
                <button className={`chip${courant.passe ? ' on' : ''}`} onClick={() => majItem(courant.id, { passe: !courant.passe })}>
                  Passe-partout
                </button>
                <button className={`chip${ombre ? ' on' : ''}`} onClick={() => setOmbre((v) => !v)}>
                  Ombre portée
                </button>
                <button className="chip" onClick={() => { setItems((l) => l.filter((i) => i.id !== courant.id)); setSel(null); }}>
                  <IcoPoubelle size={14} /> Retirer
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="small muted">Cliquez sur une œuvre posée sur le mur pour la régler.</p>
        )}

        <div className="studio-total">
          <div className="row-between">
            <span className="small muted">{items.length} œuvre{items.length > 1 ? 's' : ''} sur le mur</span>
            <b>{dh(total)}</b>
          </div>
          <button className="btn btn-primary btn-block mt-1" onClick={toutAjouter} disabled={items.length === 0}>
            <IcoPanier size={16} /> Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
