'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appeler, envoyerFichier } from '@/lib/api';
import { THEMES, FORMATS, COULEURS, PIECES } from '@/lib/taxonomie';
import { dh } from '@/lib/prix';
import { IcoPlus, IcoPoubelle, IcoImage } from '@/components/Icones';

/** Grille proposée par défaut : celle du catalogue de démonstration. */
const TAILLES_DEFAUT = [
  { l: 40, h: 30, prix: 290 },
  { l: 60, h: 40, prix: 420 },
  { l: 90, h: 60, prix: 850 },
];

const VIDE = {
  titre: '', artiste: '', epoque: '', technique: '', description: '',
  theme: 'art-islamique', format: 'paysage', couleur: 'beige',
  image: '', thumb: '', source: '', ratio: 0,
  tailles: TAILLES_DEFAUT, pieces: [],
  nouveaute: true, bestseller: false, promo: 0,
  note: 4.6, avis: 0, actif: true, ordre: 0,
};

export default function FormulaireProduit({ produit }) {
  const router = useRouter();
  const creation = !produit;
  const [f, setF] = useState(() => ({ ...VIDE, ...(produit || {}) }));
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [chargement, setChargement] = useState(false);

  const set = (champ, valeur) => setF((prec) => ({ ...prec, [champ]: valeur }));

  function setTaille(i, champ, valeur) {
    setF((prec) => ({
      ...prec,
      tailles: prec.tailles.map((t, j) => (j === i ? { ...t, [champ]: valeur } : t)),
    }));
  }

  const ajouterTaille = () =>
    setF((p) => ({ ...p, tailles: [...p.tailles, { l: 0, h: 0, prix: 0 }] }));

  const retirerTaille = (i) =>
    setF((p) => ({ ...p, tailles: p.tailles.filter((_, j) => j !== i) }));

  function basculerPiece(slug) {
    setF((p) => ({
      ...p,
      pieces: p.pieces.includes(slug) ? p.pieces.filter((x) => x !== slug) : [...p.pieces, slug],
    }));
  }

  /** L'image est traitée par le serveur (webp 1400 px + vignette) avant enregistrement. */
  async function televerser(fichier) {
    if (!fichier) return;
    setChargement(true);
    setErreur('');
    try {
      const corps = new FormData();
      corps.append('fichier', fichier);
      corps.append('nom', f.titre || fichier.name);
      const data = await envoyerFichier('/api/televersement', corps);
      setF((p) => ({ ...p, image: data.image, thumb: data.thumb, ratio: data.ratio }));
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  }

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      await appeler(creation ? '/api/produits' : `/api/produits/${produit.slug}`, {
        method: creation ? 'POST' : 'PATCH',
        corps: f,
        avecJeton: true,
      });
      router.push('/admin/produits');
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  }

  const prixMin = Math.min(...f.tailles.map((t) => Number(t.prix) || Infinity));

  return (
    <form onSubmit={soumettre} className="admin-form">
      <div className="admin-colonnes">
        {/* ----------------------------------------------------- colonne principale */}
        <div className="stack-lg">
          <section className="admin-carte">
            <h2 className="d4">Identité</h2>

            <div className="form-grid two mt-2">
              <div>
                <label className="lab" htmlFor="titre">Titre <span>*</span></label>
                <input id="titre" className="inp" value={f.titre} required maxLength={140}
                  onChange={(e) => set('titre', e.target.value)} />
              </div>
              <div>
                <label className="lab" htmlFor="artiste">Artiste</label>
                <input id="artiste" className="inp" value={f.artiste} placeholder="Artiste anonyme"
                  onChange={(e) => set('artiste', e.target.value)} />
              </div>
              <div>
                <label className="lab" htmlFor="epoque">Époque</label>
                <input id="epoque" className="inp" value={f.epoque} placeholder="1888"
                  onChange={(e) => set('epoque', e.target.value)} />
              </div>
              <div>
                <label className="lab" htmlFor="technique">Technique</label>
                <input id="technique" className="inp" value={f.technique} placeholder="Huile sur toile"
                  onChange={(e) => set('technique', e.target.value)} />
              </div>
            </div>

            <div className="mt-2">
              <label className="lab" htmlFor="description">Description</label>
              <textarea id="description" className="inp" rows={7} value={f.description}
                onChange={(e) => set('description', e.target.value)} />
              <p className="admin-aide">
                Les sauts de ligne séparent les paragraphes sur la fiche produit.
              </p>
            </div>
          </section>

          <section className="admin-carte">
            <h2 className="d4">Tailles et prix</h2>
            <p className="admin-aide">
              Dimensions en centimètres, prix en dirhams pour la toile seule. Le supplément
              de cadre est ajouté automatiquement à la commande.
            </p>

            <div className="admin-tailles mt-2">
              {f.tailles.map((t, i) => (
                <div className="admin-taille" key={i}>
                  <div className="field">
                    <label htmlFor={`l${i}`} className="tiny">Largeur</label>
                    <input id={`l${i}`} className="inp" type="number" min="5" max="400" value={t.l}
                      onChange={(e) => setTaille(i, 'l', e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor={`h${i}`} className="tiny">Hauteur</label>
                    <input id={`h${i}`} className="inp" type="number" min="5" max="400" value={t.h}
                      onChange={(e) => setTaille(i, 'h', e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor={`p${i}`} className="tiny">Prix (DH)</label>
                    <input id={`p${i}`} className="inp" type="number" min="0" step="10" value={t.prix}
                      onChange={(e) => setTaille(i, 'prix', e.target.value)} />
                  </div>
                  <button type="button" className="icone-danger" disabled={f.tailles.length === 1}
                    onClick={() => retirerTaille(i)} aria-label={`Retirer la taille ${t.l}x${t.h}`}>
                    <IcoPoubelle size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={ajouterTaille}>
              <IcoPlus size={15} /> Ajouter une taille
            </button>

            {Number.isFinite(prixMin) && (
              <p className="admin-aide mt-2">
                Prix d’appel affiché au catalogue : <b>{dh(prixMin)}</b>
                {f.promo > 0 && <> — soit {dh(prixMin * (1 - f.promo / 100))} remise déduite.</>}
              </p>
            )}
          </section>

          <section className="admin-carte">
            <h2 className="d4">Pièces conseillées</h2>
            <p className="admin-aide">
              Sert au filtre « par pièce » du catalogue et aux suggestions du studio.
            </p>
            <div className="chips mt-2">
              {PIECES.map((p) => (
                <button
                  type="button"
                  key={p.slug}
                  className={`chip ${f.pieces.includes(p.slug) ? 'on' : ''}`}
                  aria-pressed={f.pieces.includes(p.slug)}
                  onClick={() => basculerPiece(p.slug)}
                >
                  {p.nom}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ------------------------------------------------------- colonne latérale */}
        <div className="stack-lg">
          <section className="admin-carte">
            <h2 className="d4">Image</h2>

            <div className="admin-apercu mt-2">
              {f.image
                ? <img src={f.image} alt="" />
                : <span className="admin-apercu-vide"><IcoImage size={26} /> Aucune image</span>}
            </div>

            <label className="btn btn-ghost btn-sm btn-block mt-2" style={{ cursor: 'pointer' }}>
              {chargement ? 'Traitement…' : 'Choisir un fichier'}
              <input type="file" accept="image/*" hidden disabled={chargement}
                onChange={(e) => televerser(e.target.files?.[0])} />
            </label>

            <div className="mt-2">
              <label className="lab" htmlFor="image">Chemin de l’image <span>*</span></label>
              <input id="image" className="inp" value={f.image} required placeholder="/media/art/…"
                onChange={(e) => set('image', e.target.value)} />
            </div>
            <div className="mt-1">
              <label className="lab" htmlFor="thumb">Vignette</label>
              <input id="thumb" className="inp" value={f.thumb} placeholder="reprend l’image si vide"
                onChange={(e) => set('thumb', e.target.value)} />
            </div>
            <div className="mt-1">
              <label className="lab" htmlFor="source">Source (crédit)</label>
              <input id="source" className="inp" value={f.source} placeholder="https://…"
                onChange={(e) => set('source', e.target.value)} />
            </div>
          </section>

          <section className="admin-carte">
            <h2 className="d4">Classement</h2>

            <div className="stack mt-2">
              <div>
                <label className="lab" htmlFor="theme">Thème <span>*</span></label>
                <select id="theme" className="inp" value={f.theme} onChange={(e) => set('theme', e.target.value)}>
                  {THEMES.map((t) => <option key={t.slug} value={t.slug}>{t.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="lab" htmlFor="format">Format</label>
                <select id="format" className="inp" value={f.format} onChange={(e) => set('format', e.target.value)}>
                  {FORMATS.map((t) => <option key={t.slug} value={t.slug}>{t.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="lab" htmlFor="couleur">Couleur dominante</label>
                <select id="couleur" className="inp" value={f.couleur} onChange={(e) => set('couleur', e.target.value)}>
                  {COULEURS.map((t) => <option key={t.slug} value={t.slug}>{t.nom}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="admin-carte">
            <h2 className="d4">Mise en avant</h2>

            <div className="stack mt-2">
              <label className="admin-case">
                <input type="checkbox" checked={f.actif !== false}
                  onChange={(e) => set('actif', e.target.checked)} />
                <span>Visible sur la boutique</span>
              </label>
              <label className="admin-case">
                <input type="checkbox" checked={!!f.nouveaute}
                  onChange={(e) => set('nouveaute', e.target.checked)} />
                <span>Nouveauté</span>
              </label>
              <label className="admin-case">
                <input type="checkbox" checked={!!f.bestseller}
                  onChange={(e) => set('bestseller', e.target.checked)} />
                <span>Best-seller (accueil)</span>
              </label>

              <div>
                <label className="lab" htmlFor="promo">Remise (%)</label>
                <input id="promo" className="inp" type="number" min="0" max="90" value={f.promo}
                  onChange={(e) => set('promo', e.target.value)} />
              </div>

              <div className="form-grid two">
                <div>
                  <label className="lab" htmlFor="note">Note /5</label>
                  <input id="note" className="inp" type="number" min="0" max="5" step="0.1" value={f.note}
                    onChange={(e) => set('note', e.target.value)} />
                </div>
                <div>
                  <label className="lab" htmlFor="avis">Nombre d’avis</label>
                  <input id="avis" className="inp" type="number" min="0" value={f.avis}
                    onChange={(e) => set('avis', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="lab" htmlFor="ordre">Ordre d’affichage</label>
                <input id="ordre" className="inp" type="number" min="0" value={f.ordre}
                  onChange={(e) => set('ordre', e.target.value)} />
                <p className="admin-aide">Plus petit = plus haut dans le catalogue.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {erreur && <p className="alert err mt-2" role="alert">{erreur}</p>}

      <div className="admin-barre-action">
        <button type="button" className="btn btn-ghost" onClick={() => router.push('/admin/produits')}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={envoi || chargement}>
          {envoi ? 'Enregistrement…' : creation ? 'Créer l’œuvre' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
