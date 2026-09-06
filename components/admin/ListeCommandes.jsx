'use client';

import { useMemo, useState } from 'react';
import { appeler } from '@/lib/api';
import { dh } from '@/lib/prix';
import { STATUTS_COMMANDE, NOM_STATUT } from '@/lib/produit';
import { nomCadre } from '@/lib/taxonomie';
import { IcoChevron, IcoWhatsapp, IcoTelephone } from '@/components/Icones';

const TON = { nouvelle: 'warn', confirmee: '', expediee: '', livree: 'ok', annulee: 'no' };

const dateLongue = (iso) =>
  new Date(iso).toLocaleString('fr-MA', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export default function ListeCommandes({ commandes, recharger }) {
  const [filtre, setFiltre] = useState('');
  const [ouverte, setOuverte] = useState(null);
  const [occupee, setOccupee] = useState('');
  const [erreur, setErreur] = useState('');

  const liste = useMemo(
    () => (filtre ? commandes.filter((c) => c.statut === filtre) : commandes),
    [commandes, filtre],
  );

  async function changerStatut(ref, statut) {
    setOccupee(ref);
    setErreur('');
    try {
      await appeler('/api/commandes', {
        method: 'PATCH',
        corps: { ref, statut },
        avecJeton: true,
      });
      await recharger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setOccupee('');
    }
  }

  if (!commandes.length) {
    return (
      <div className="table-wrap">
        <p className="admin-vide">
          Aucune commande pour l’instant. Chaque panier validé sur la boutique arrive ici,
          avec les coordonnées du client et le détail des formats commandés.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-filtres">
        <button type="button" className={`chip ${filtre === '' ? 'on' : ''}`} onClick={() => setFiltre('')}>
          Toutes ({commandes.length})
        </button>
        {STATUTS_COMMANDE.map((s) => {
          const n = commandes.filter((c) => c.statut === s).length;
          return (
            <button key={s} type="button" className={`chip ${filtre === s ? 'on' : ''}`}
              onClick={() => setFiltre(s)} disabled={!n}>
              {NOM_STATUT[s]} ({n})
            </button>
          );
        })}
      </div>

      {erreur && <p className="alert err mt-1" role="alert">{erreur}</p>}

      <div className="stack mt-2">
        {liste.map((c) => {
          const dep = ouverte === c.ref;
          return (
            <article key={c.ref} className={`admin-commande ${dep ? 'ouverte' : ''}`}>
              <button
                type="button"
                className="admin-commande-tete"
                onClick={() => setOuverte(dep ? null : c.ref)}
                aria-expanded={dep}
              >
                <span className="admin-commande-ref">
                  <b>{c.ref}</b>
                  <span className="tiny">{dateLongue(c.createdAt)}</span>
                </span>
                <span className="admin-commande-client">
                  {c.client?.nom}
                  <span className="tiny">{c.client?.ville || '—'}</span>
                </span>
                <span className="hide-sm tiny">
                  {(c.articles || []).reduce((s, a) => s + a.qte, 0)} article(s)
                </span>
                <b>{dh(c.total)}</b>
                <span className={`tag ${TON[c.statut] || ''}`}>{NOM_STATUT[c.statut] || c.statut}</span>
                <IcoChevron size={16} />
              </button>

              {dep && (
                <div className="admin-commande-corps">
                  <div className="admin-commande-grille">
                    <div>
                      <p className="eyebrow">Client</p>
                      <p className="stack" style={{ gap: '0.25rem', marginTop: '0.5rem' }}>
                        <span><b>{c.client?.nom}</b></span>
                        <span>{c.client?.tel}</span>
                        {c.client?.email && <span>{c.client.email}</span>}
                        <span>{c.client?.adresse}</span>
                        <span>{c.client?.ville}</span>
                      </p>
                      {c.client?.note && (
                        <p className="admin-note-client">« {c.client.note} »</p>
                      )}
                      <div className="row mt-2">
                        <a className="btn btn-ghost btn-sm" href={`tel:${(c.client?.tel || '').replace(/\s/g, '')}`}>
                          <IcoTelephone size={15} /> Appeler
                        </a>
                        <a
                          className="btn btn-ghost btn-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://wa.me/${(c.client?.tel || '').replace(/\D/g, '').replace(/^0/, '212')}`}
                        >
                          <IcoWhatsapp size={15} /> WhatsApp
                        </a>
                      </div>
                    </div>

                    <div>
                      <p className="eyebrow">Articles</p>
                      <ul className="admin-articles">
                        {(c.articles || []).map((a, i) => (
                          <li key={i}>
                            {a.image && <img src={a.image} alt="" loading="lazy" />}
                            <span>
                              <b>{a.titre}</b>
                              <span className="tiny">
                                {a.taille?.ref} cm · {nomCadre(a.cadre)}
                                {a.passe ? ' · passe-partout' : ''} · ×{a.qte}
                              </span>
                            </span>
                            <b>{dh(a.prixUnit * a.qte)}</b>
                          </li>
                        ))}
                      </ul>

                      <dl className="admin-totaux">
                        <div><dt>Sous-total</dt><dd>{dh(c.sousTotal)}</dd></div>
                        <div>
                          <dt>Livraison</dt>
                          <dd>{c.livraison ? dh(c.livraison) : 'Offerte'}</dd>
                        </div>
                        <div className="fort"><dt>Total</dt><dd>{dh(c.total)}</dd></div>
                        <div>
                          <dt>Paiement</dt>
                          <dd>{c.paiement === 'virement' ? 'Virement bancaire' : 'À la livraison'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="admin-statuts">
                    <span className="eyebrow">Statut</span>
                    {STATUTS_COMMANDE.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`chip ${c.statut === s ? 'on' : ''}`}
                        disabled={occupee === c.ref || c.statut === s}
                        onClick={() => changerStatut(c.ref, s)}
                      >
                        {NOM_STATUT[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
