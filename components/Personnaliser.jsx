'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Cadre from './Cadre';
import { useBoutique } from './Boutique';
import { envoyerFichierPublic } from '@/lib/api';
import { dh, SEUIL_LIVRAISON } from '@/lib/prix';
import { CADRES } from '@/lib/taxonomie';
import {
  SLUG_PERSO, TAILLES_PERSO, prixPerso, pixelsConseilles, resolutionSuffisante,
} from '@/lib/personnalisation';
import { IcoImage, IcoPanier, IcoPlus, IcoMoins, IcoCroix, IcoCheck } from './Icones';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const POIDS_MAX = 15 * 1024 * 1024;

/**
 * Tableau personnalisé : le visiteur envoie sa photo, la voit dans un cadre,
 * choisit un format puis commande.
 *
 * L'aperçu est local — un objet URL, rien ne part tant qu'on regarde. La photo
 * n'est déposée sur le serveur qu'au moment de l'ajout au panier : inutile de
 * stocker les essais de quelqu'un qui repart sans commander.
 */
export default function Personnaliser() {
  const { ajouter } = useBoutique();
  const champ = useRef(null);

  const [fichier, setFichier] = useState(null);
  const [apercu, setApercu] = useState('');   // objet URL local
  const [mesure, setMesure] = useState(null); // dimensions en pixels
  const [taille, setTaille] = useState(TAILLES_PERSO[1]);
  const [cadre, setCadre] = useState('noir');
  const [qte, setQte] = useState(1);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [survol, setSurvol] = useState(false);

  // Un objet URL retient le fichier en mémoire tant qu'on ne le révoque pas.
  useEffect(() => () => { if (apercu) URL.revokeObjectURL(apercu); }, [apercu]);

  const choisir = useCallback((f) => {
    setErreur('');
    if (!f) return;
    if (!TYPES.includes(f.type)) {
      setErreur('Format non accepté : envoyez un JPEG, un PNG ou un WebP.');
      return;
    }
    if (f.size > POIDS_MAX) {
      setErreur('Photo trop lourde : 15 Mo au maximum.');
      return;
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => setMesure({ largeur: img.naturalWidth, hauteur: img.naturalHeight });
    img.src = url;

    setApercu((ancien) => { if (ancien) URL.revokeObjectURL(ancien); return url; });
    setFichier(f);
  }, []);

  const retirer = () => {
    if (apercu) URL.revokeObjectURL(apercu);
    setApercu('');
    setFichier(null);
    setMesure(null);
    setErreur('');
    if (champ.current) champ.current.value = '';
  };

  const prix = prixPerso(taille, cadre);
  const vise = pixelsConseilles(taille);
  const petite = mesure && !resolutionSuffisante(mesure, taille);

  async function auPanier() {
    if (!fichier || envoi) return;
    setErreur('');
    setEnvoi(true);
    try {
      const corps = new FormData();
      corps.append('fichier', fichier);
      const envoye = await envoyerFichierPublic('/api/personnalisation/image', corps);

      ajouter({
        slug: SLUG_PERSO,
        titre: 'Tableau personnalisé',
        image: envoye.image,
        thumb: envoye.thumb,
        ratio: taille.l / taille.h,
        taille,
        cadre,
        passe: false,
        prixUnit: prix.final,
        qte,
        perso: true,
      });
      retirer();
      setQte(1);
    } catch (e) {
      setErreur(e.message || 'L’envoi a échoué. Réessayez.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="perso-layout">
      {/* ------------------------------------------------------- aperçu */}
      <div>
        <div className="perso-scene">
          {apercu ? (
            <Cadre
              src={apercu}
              alt="Votre photo, telle qu’elle sera imprimée"
              ratio={taille.l / taille.h}
              cadre={cadre}
              priority
            />
          ) : (
            <button
              type="button"
              className={`perso-depot${survol ? ' survol' : ''}`}
              onClick={() => champ.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setSurvol(true); }}
              onDragLeave={() => setSurvol(false)}
              onDrop={(e) => {
                e.preventDefault();
                setSurvol(false);
                choisir(e.dataTransfer.files?.[0]);
              }}
            >
              <IcoImage size={30} />
              <b>Déposez votre photo</b>
              <span className="tiny muted">
                ou cliquez pour la choisir · JPEG, PNG ou WebP, 15 Mo max
              </span>
            </button>
          )}
        </div>

        {apercu && (
          <div className="row mt-2" style={{ justifyContent: 'center', gap: '0.6rem' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => champ.current?.click()}>
              Changer de photo
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={retirer}>
              <IcoCroix size={14} /> Retirer
            </button>
          </div>
        )}

        <input
          ref={champ}
          type="file"
          accept={TYPES.join(',')}
          hidden
          onChange={(e) => choisir(e.target.files?.[0])}
        />

        <p className="tiny muted mt-2" style={{ textAlign: 'center' }}>
          Votre photo ne sert qu’à cette commande. Elle n’est envoyée qu’au moment
          de l’ajout au panier, et jamais publiée sur le site.
        </p>
      </div>

      {/* -------------------------------------------------------- choix */}
      <div className="perso-choix">
        <div className="price-row">
          <span className="price-now">{dh(prix.final * qte)}</span>
        </div>
        <p className="tiny muted">
          Tirage {taille.l} × {taille.h} cm,{' '}
          {cadre === 'aucun'
            ? 'toile sans cadre'
            : `cadre ${CADRES.find((c) => c.slug === cadre)?.nom.toLowerCase()}`}.
          {' '}Livraison offerte dès {dh(SEUIL_LIVRAISON)}.
        </p>

        <div className="mt-3">
          <h2 className="lab">Format</h2>
          <div className="size-grid">
            {TAILLES_PERSO.map((t) => (
              <button
                key={t.ref}
                type="button"
                className={`size-opt${taille.ref === t.ref ? ' on' : ''}`}
                onClick={() => setTaille(t)}
              >
                <b>{t.l} × {t.h}</b>
                <span>{dh(prixPerso(t, cadre).final)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="lab">Cadre</h2>
          <div className="prod-views">
            {CADRES.map((c) => (
              <button
                key={c.slug}
                type="button"
                className={cadre === c.slug ? 'on' : ''}
                onClick={() => setCadre(c.slug)}
                title={c.desc}
              >
                <span
                  className="swatch"
                  style={{
                    background: c.hex === 'transparent'
                      ? 'repeating-linear-gradient(45deg,#ddd,#ddd 3px,#fff 3px,#fff 6px)'
                      : c.hex,
                  }}
                />
                {c.nom}{c.supp > 0 ? ` +${c.supp} DH` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="lab">Quantité</h2>
          <div className="qte-choix">
            <button
              type="button"
              onClick={() => setQte((n) => Math.max(1, n - 1))}
              disabled={qte <= 1}
              aria-label="Retirer un exemplaire"
            >
              <IcoMoins size={15} />
            </button>
            <span aria-live="polite">{qte}</span>
            <button
              type="button"
              onClick={() => setQte((n) => Math.min(20, n + 1))}
              disabled={qte >= 20}
              aria-label="Ajouter un exemplaire"
            >
              <IcoPlus size={15} />
            </button>
          </div>
        </div>

        {/* Une photo trop petite s'imprime quand même, mais le grain se voit :
            on prévient sans bloquer, le client juge. */}
        {mesure && (
          <p className={`perso-verdict${petite ? ' alerte' : ''}`}>
            {petite ? (
              <>
                Photo de {mesure.largeur} × {mesure.hauteur} px. Pour un {taille.l} × {taille.h} cm
                net, visez {vise.l} × {vise.h} px. L’impression reste possible, le grain
                sera visible de près.
              </>
            ) : (
              <><IcoCheck size={14} /> Résolution suffisante pour un {taille.l} × {taille.h} cm.</>
            )}
          </p>
        )}

        {erreur && <p className="perso-verdict alerte" role="alert">{erreur}</p>}

        <button
          type="button"
          className="btn btn-primary btn-lg btn-block mt-3"
          onClick={auPanier}
          disabled={!fichier || envoi}
        >
          <IcoPanier size={17} />
          {envoi ? 'Envoi de la photo…' : 'Ajouter au panier'}
        </button>
        {!fichier && (
          <p className="tiny muted mt-1" style={{ textAlign: 'center' }}>
            Choisissez d’abord une photo.
          </p>
        )}

        <p className="tiny muted mt-3">
          Vous devez détenir les droits sur l’image envoyée. Voir nos{' '}
          <Link href="/cgv">conditions de vente</Link>.
        </p>
      </div>
    </div>
  );
}
