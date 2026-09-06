'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES, nomTheme } from '@/lib/taxonomie';
import { dh } from '@/lib/prix';

/**
 * Deux réglages en un seul écran : le bandeau de la page /promotions
 * (titre, texte, fin du compte à rebours, code) et la remise appliquée
 * en lot aux œuvres cochées.
 */
export default function EcranPromotions({ produits, reglages }) {
  const router = useRouter();

  const [r, setR] = useState(reglages);
  const [enregistre, setEnregistre] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const [selection, setSelection] = useState(() => new Set());
  const [remise, setRemise] = useState(20);
  const [theme, setTheme] = useState('');
  const [lot, setLot] = useState(false);

  const set = (cle, valeur) => {
    setR((p) => ({ ...p, [cle]: valeur }));
    setEnregistre(false);
  };

  const liste = useMemo(
    () => (theme ? produits.filter((p) => p.theme === theme) : produits),
    [produits, theme],
  );

  const enPromo = produits.filter((p) => p.promo > 0);

  function basculer(slug) {
    setSelection((prec) => {
      const suivant = new Set(prec);
      if (suivant.has(slug)) suivant.delete(slug);
      else suivant.add(slug);
      return suivant;
    });
  }

  const toutSelectionner = () => setSelection(new Set(liste.map((p) => p.slug)));
  const toutDeselectionner = () => setSelection(new Set());

  async function enregistrerBandeau(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      const rep = await fetch('/api/reglages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoActive: r.promoActive,
          promoTitre: r.promoTitre,
          promoTexte: r.promoTexte,
          promoFin: r.promoFin,
          promoCode: r.promoCode,
        }),
      });
      if (!rep.ok) throw new Error((await rep.json()).erreur || 'Enregistrement refusé.');
      setEnregistre(true);
      router.refresh();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  /** Applique la remise saisie — ou la retire, avec 0 — aux œuvres cochées. */
  async function appliquer(valeur) {
    if (!selection.size) return;
    setLot(true);
    setErreur('');
    try {
      const rep = await fetch('/api/produits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: [...selection], promo: valeur }),
      });
      if (!rep.ok) throw new Error((await rep.json()).erreur || 'Modification refusée.');
      setSelection(new Set());
      router.refresh();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLot(false);
    }
  }

  // <input type="datetime-local"> attend « AAAA-MM-JJTHH:MM », la base stocke de l'ISO.
  const pourChamp = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  return (
    <>
      {erreur && <p className="alert err" role="alert">{erreur}</p>}

      <div className="kpis">
        <div className="kpi"><span>Œuvres en promotion</span><b>{enPromo.length}</b></div>
        <div className="kpi">
          <span>Remise maximale</span>
          <b>{enPromo.length ? `−${Math.max(...enPromo.map((p) => p.promo))} %` : '—'}</b>
        </div>
        <div className="kpi"><span>Sélection en cours</span><b>{selection.size}</b></div>
      </div>

      <div className="admin-colonnes">
        <section className="admin-carte">
          <h2 className="d4">Œuvres en promotion</h2>
          <p className="admin-aide">
            Cochez les œuvres, choisissez une remise, appliquez. « Retirer » remet le prix plein.
          </p>

          <div className="admin-filtres mt-2">
            <select className="select" value={theme} onChange={(e) => setTheme(e.target.value)}
              aria-label="Filtrer par thème">
              <option value="">Tous les thèmes</option>
              {THEMES.map((t) => <option key={t.slug} value={t.slug}>{t.nom}</option>)}
            </select>
            <button type="button" className="chip" onClick={toutSelectionner}>Tout cocher</button>
            <button type="button" className="chip" onClick={toutDeselectionner} disabled={!selection.size}>
              Tout décocher
            </button>
          </div>

          <div className="admin-liste-promo mt-2">
            {liste.map((p) => (
              <label key={p.slug} className={`admin-ligne-promo ${selection.has(p.slug) ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={selection.has(p.slug)}
                  onChange={() => basculer(p.slug)}
                />
                <img src={p.thumb} alt="" loading="lazy" />
                <span>
                  <b>{p.titre}</b>
                  <span className="tiny">{nomTheme(p.theme)} · {dh(p.prixMin)}</span>
                </span>
                {p.promo > 0
                  ? <span className="tag warn">−{p.promo} %</span>
                  : <span className="tiny" style={{ color: 'var(--muted)' }}>prix plein</span>}
              </label>
            ))}
          </div>

          <div className="admin-barre-lot">
            <div className="field" style={{ maxWidth: 120 }}>
              <label htmlFor="remise" className="tiny">Remise (%)</label>
              <input id="remise" className="inp" type="number" min="1" max="90" value={remise}
                onChange={(e) => setRemise(e.target.value)} />
            </div>
            <button type="button" className="btn btn-primary btn-sm"
              disabled={!selection.size || lot} onClick={() => appliquer(Number(remise))}>
              {lot ? 'Application…' : `Appliquer à ${selection.size || 0} œuvre(s)`}
            </button>
            <button type="button" className="btn btn-ghost btn-sm"
              disabled={!selection.size || lot} onClick={() => appliquer(0)}>
              Retirer la remise
            </button>
          </div>
        </section>

        <form onSubmit={enregistrerBandeau} className="admin-carte">
          <h2 className="d4">Bandeau de la page /promotions</h2>

          <div className="stack mt-2">
            <label className="admin-case">
              <input type="checkbox" checked={!!r.promoActive}
                onChange={(e) => set('promoActive', e.target.checked)} />
              <span>Afficher la vente flash sur l’accueil</span>
            </label>

            <div>
              <label className="lab" htmlFor="promoTitre">Titre</label>
              <input id="promoTitre" className="inp" value={r.promoTitre}
                onChange={(e) => set('promoTitre', e.target.value)} />
            </div>
            <div>
              <label className="lab" htmlFor="promoTexte">Accroche</label>
              <textarea id="promoTexte" className="inp" rows={3} value={r.promoTexte}
                onChange={(e) => set('promoTexte', e.target.value)} />
            </div>
            <div>
              <label className="lab" htmlFor="promoFin">Fin du compte à rebours</label>
              <input
                id="promoFin"
                className="inp"
                type="datetime-local"
                value={pourChamp(r.promoFin)}
                onChange={(e) => set('promoFin', e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
              <p className="admin-aide">Laisser vide pour masquer le compte à rebours.</p>
            </div>
            <div>
              <label className="lab" htmlFor="promoCode">Code promo affiché</label>
              <input id="promoCode" className="inp" value={r.promoCode}
                onChange={(e) => set('promoCode', e.target.value.toUpperCase())} />
            </div>
          </div>

          <div className="row mt-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer le bandeau'}
            </button>
            {enregistre && <span className="tag ok">Enregistré</span>}
          </div>
        </form>
      </div>
    </>
  );
}
