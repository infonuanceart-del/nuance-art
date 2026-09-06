'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { THEMES, nomTheme } from '@/lib/taxonomie';
import { dh } from '@/lib/prix';
import { IcoLoupe, IcoPoubelle } from '@/components/Icones';

export default function TableProduits({ produits }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [theme, setTheme] = useState('');
  const [etat, setEtat] = useState('');
  const [occupe, setOccupe] = useState('');
  const [erreur, setErreur] = useState('');

  const liste = useMemo(() => {
    const mots = q.trim().toLowerCase();
    return produits.filter((p) => {
      if (theme && p.theme !== theme) return false;
      if (etat === 'en-ligne' && p.actif === false) return false;
      if (etat === 'masquee' && p.actif !== false) return false;
      if (etat === 'promo' && !(p.promo > 0)) return false;
      if (!mots) return true;
      return `${p.titre} ${p.artiste} ${p.slug}`.toLowerCase().includes(mots);
    });
  }, [produits, q, theme, etat]);

  /** Bascule optimiste impossible ici : on rafraîchit la page rendue par le serveur. */
  async function basculer(slug, champ, valeur) {
    setOccupe(slug);
    setErreur('');
    try {
      const r = await fetch(`/api/produits/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [champ]: valeur }),
      });
      if (!r.ok) throw new Error((await r.json()).erreur || 'Modification refusée.');
      router.refresh();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setOccupe('');
    }
  }

  async function supprimer(p) {
    if (!confirm(`Supprimer définitivement « ${p.titre} » ?`)) return;
    setOccupe(p.slug);
    setErreur('');
    try {
      const r = await fetch(`/api/produits/${p.slug}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).erreur || 'Suppression refusée.');
      router.refresh();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setOccupe('');
    }
  }

  return (
    <>
      <div className="admin-filtres">
        <div className="admin-recherche">
          <IcoLoupe size={16} />
          <input
            className="inp"
            type="search"
            placeholder="Rechercher un titre, un artiste…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Rechercher une œuvre"
          />
        </div>

        <select className="select" value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Filtrer par thème">
          <option value="">Tous les thèmes</option>
          {THEMES.map((t) => <option key={t.slug} value={t.slug}>{t.nom}</option>)}
        </select>

        <select className="select" value={etat} onChange={(e) => setEtat(e.target.value)} aria-label="Filtrer par état">
          <option value="">Tous les états</option>
          <option value="en-ligne">En ligne</option>
          <option value="masquee">Masquées</option>
          <option value="promo">En promotion</option>
        </select>

        <span className="tiny" style={{ color: 'var(--muted)', marginLeft: 'auto' }}>
          {liste.length} sur {produits.length}
        </span>
      </div>

      {erreur && <p className="alert err mt-1" role="alert">{erreur}</p>}

      <div className="table-wrap mt-2">
        {liste.length === 0 ? (
          <p className="admin-vide">Aucune œuvre ne correspond à cette recherche.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 62 }}><span className="sr-only">Aperçu</span></th>
                <th>Œuvre</th>
                <th className="hide-sm">Thème</th>
                <th>Prix</th>
                <th className="hide-sm">Promo</th>
                <th>En ligne</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((p) => (
                <tr key={p.slug} style={occupe === p.slug ? { opacity: 0.45 } : undefined}>
                  <td>
                    <img className="admin-thumb" src={p.thumb} alt="" loading="lazy" />
                  </td>
                  <td>
                    <Link href={`/admin/produits/${p.slug}`}><b>{p.titre}</b></Link>
                    <br />
                    <span className="tiny" style={{ color: 'var(--muted)' }}>{p.artiste}</span>
                  </td>
                  <td className="hide-sm">{nomTheme(p.theme)}</td>
                  <td>{dh(p.prixMin)}</td>
                  <td className="hide-sm">
                    {p.promo > 0 ? <span className="tag warn">−{p.promo} %</span> : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>
                  <td>
                    <label className="bascule">
                      <input
                        type="checkbox"
                        checked={p.actif !== false}
                        onChange={(e) => basculer(p.slug, 'actif', e.target.checked)}
                        disabled={occupe === p.slug}
                      />
                      <span />
                      <i className="sr-only">Afficher {p.titre} sur la boutique</i>
                    </label>
                  </td>
                  <td>
                    <div className="row" style={{ gap: '0.35rem', flexWrap: 'nowrap' }}>
                      <Link href={`/admin/produits/${p.slug}`} className="btn btn-ghost btn-sm">Modifier</Link>
                      <button
                        type="button"
                        className="icone-danger"
                        onClick={() => supprimer(p)}
                        disabled={occupe === p.slug}
                        aria-label={`Supprimer ${p.titre}`}
                        title="Supprimer"
                      >
                        <IcoPoubelle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
