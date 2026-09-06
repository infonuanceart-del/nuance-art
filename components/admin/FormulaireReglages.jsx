'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SEUIL_LIVRAISON, FRAIS_LIVRAISON, dh } from '@/lib/prix';

/** Coordonnées reprises par le pied de page, le bouton WhatsApp et le JSON-LD. */
const CHAMPS = [
  { cle: 'telephone', label: 'Téléphone', type: 'tel', aide: 'Affiché au pied de page et sur la page contact.' },
  { cle: 'whatsapp', label: 'Numéro WhatsApp', type: 'tel', aide: 'Format international sans « + » : 212600000000.' },
  { cle: 'email', label: 'Adresse e-mail', type: 'email' },
  { cle: 'adresse', label: 'Adresse de l’atelier', type: 'text' },
];

export default function FormulaireReglages({ reglages }) {
  const router = useRouter();
  const [r, setR] = useState(reglages);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [ok, setOk] = useState(false);

  function set(cle, valeur) {
    setR((p) => ({ ...p, [cle]: valeur }));
    setOk(false);
  }

  async function soumettre(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur('');
    try {
      const rep = await fetch('/api/reglages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(CHAMPS.map((c) => [c.cle, r[c.cle]]))),
      });
      if (!rep.ok) throw new Error((await rep.json()).erreur || 'Enregistrement refusé.');
      setOk(true);
      router.refresh();
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="admin-colonnes">
      <form onSubmit={soumettre} className="admin-carte">
        <h2 className="d4">Coordonnées</h2>
        <p className="admin-aide">
          Ces informations alimentent le pied de page, le bouton WhatsApp flottant et la
          fiche « Store » lue par Google.
        </p>

        <div className="stack mt-2">
          {CHAMPS.map((c) => (
            <div key={c.cle}>
              <label className="lab" htmlFor={c.cle}>{c.label}</label>
              <input
                id={c.cle}
                className="inp"
                type={c.type}
                value={r[c.cle] ?? ''}
                onChange={(e) => set(c.cle, e.target.value)}
              />
              {c.aide && <p className="admin-aide">{c.aide}</p>}
            </div>
          ))}
        </div>

        {erreur && <p className="alert err mt-2" role="alert">{erreur}</p>}

        <div className="row mt-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {ok && <span className="tag ok">Enregistré</span>}
        </div>
      </form>

      <section className="admin-carte">
        <h2 className="d4">Réglages fixés dans le code</h2>
        <p className="admin-aide">
          Ces valeurs sont partagées par le serveur et le navigateur : les modifier depuis
          l’admin ferait diverger le prix affiché et le prix facturé. Elles se changent dans
          les fichiers indiqués.
        </p>

        <dl className="admin-totaux mt-2">
          <div>
            <dt>Livraison offerte dès</dt>
            <dd>{dh(SEUIL_LIVRAISON)}</dd>
          </div>
          <div>
            <dt>Frais de livraison</dt>
            <dd>{dh(FRAIS_LIVRAISON)}</dd>
          </div>
        </dl>
        <p className="admin-aide mt-1"><code>lib/prix.js</code></p>

        <p className="admin-aide mt-2">
          Suppléments de cadre, thèmes, formats, couleurs et pièces : <code>lib/taxonomie.js</code>.
          <br />
          Identifiants de connexion et base de données : <code>.env.local</code>, puis{' '}
          <code>npm run seed</code>.
        </p>
      </section>
    </div>
  );
}
