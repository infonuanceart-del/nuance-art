'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useBoutique } from './Boutique';
import { dh, fraisLivraison } from '@/lib/prix';
import { nomCadre } from '@/lib/taxonomie';
import { IcoCamion, IcoCheck } from './Icones';

const VILLES = [
  'Casablanca', 'Rabat', 'Salé', 'Marrakech', 'Tanger', 'Fès', 'Agadir',
  'Kénitra', 'Meknès', 'Oujda', 'Tétouan', 'Témara', 'Mohammedia', 'El Jadida', 'Autre ville',
];

export default function Commande({ whatsapp }) {
  const router = useRouter();
  const { articles, sousTotal, vider, pret } = useBoutique();
  const [form, setForm] = useState({
    nom: '', tel: '', email: '', ville: 'Casablanca', adresse: '', note: '', paiement: 'livraison',
  });
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const port = fraisLivraison(sousTotal);
  const total = sousTotal + port;
  const maj = (cle) => (e) => setForm((f) => ({ ...f, [cle]: e.target.value }));

  if (!pret) return <div className="empty-state">Chargement…</div>;

  if (articles.length === 0) {
    return (
      <div className="vide">
        <h2 className="d3">Rien à commander</h2>
        <p className="lede" style={{ margin: '0.75rem auto 1.5rem' }}>Votre panier est vide.</p>
        <Link href="/tableaux" className="btn btn-primary">Voir les œuvres</Link>
      </div>
    );
  }

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');

    if (form.nom.trim().length < 3) return setErreur('Merci d’indiquer votre nom complet.');
    if (!/^0[5-7][0-9]{8}$/.test(form.tel.replace(/[\s.-]/g, ''))) {
      return setErreur('Le numéro doit être un mobile ou fixe marocain à 10 chiffres (ex. 0612345678).');
    }
    if (form.adresse.trim().length < 8) return setErreur('L’adresse de livraison est trop courte.');

    setEnvoi(true);
    try {
      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            nom: form.nom, tel: form.tel, email: form.email,
            ville: form.ville, adresse: form.adresse, note: form.note,
          },
          articles: articles.map((a) => ({
            slug: a.slug, titre: a.titre, taille: a.taille, cadre: a.cadre,
            passe: a.passe, prixUnit: a.prixUnit, qte: a.qte,
          })),
          paiement: form.paiement,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erreur || 'Envoi impossible');
      vider();
      router.push(`/commande/merci?ref=${encodeURIComponent(data.ref)}`);
    } catch (err) {
      setErreur(err.message + ' — vous pouvez aussi finaliser sur WhatsApp.');
      setEnvoi(false);
    }
  }

  const resume = articles
    .map((a) => `• ${a.titre} — ${a.taille.l}x${a.taille.h} cm, ${nomCadre(a.cadre)} x${a.qte}`)
    .join('\n');

  return (
    <div className="cart-layout">
      <form onSubmit={envoyer} className="stack-lg">
        <div>
          <h2 className="d4" style={{ marginBottom: '1rem' }}>Vos coordonnées</h2>
          <div className="form-grid two">
            <div>
              <label className="lab" htmlFor="nom">Nom complet <span>*</span></label>
              <input id="nom" className="inp" value={form.nom} onChange={maj('nom')} autoComplete="name" required />
            </div>
            <div>
              <label className="lab" htmlFor="tel">Téléphone <span>*</span></label>
              <input id="tel" className="inp" value={form.tel} onChange={maj('tel')} placeholder="0612345678" inputMode="tel" autoComplete="tel" required />
            </div>
            <div>
              <label className="lab" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="inp" value={form.email} onChange={maj('email')} autoComplete="email" />
            </div>
            <div>
              <label className="lab" htmlFor="ville">Ville <span>*</span></label>
              <select id="ville" className="inp" value={form.ville} onChange={maj('ville')}>
                {VILLES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2">
            <label className="lab" htmlFor="adresse">Adresse de livraison <span>*</span></label>
            <textarea id="adresse" className="inp" value={form.adresse} onChange={maj('adresse')} placeholder="Rue, numéro, résidence, étage…" required />
          </div>
          <div className="mt-2">
            <label className="lab" htmlFor="note">Précisions (facultatif)</label>
            <input id="note" className="inp" value={form.note} onChange={maj('note')} placeholder="Digicode, horaire de livraison, cadeau…" />
          </div>
        </div>

        <div>
          <h2 className="d4" style={{ marginBottom: '1rem' }}>Paiement</h2>
          <div className="stack">
            <label className={`radio-card${form.paiement === 'livraison' ? ' on' : ''}`}>
              <input type="radio" name="paiement" value="livraison" checked={form.paiement === 'livraison'} onChange={maj('paiement')} />
              <span>
                <strong>Paiement à la livraison</strong>
                <p>Vous réglez en espèces au livreur, à la remise du colis. Sans supplément.</p>
              </span>
            </label>
            <label className={`radio-card${form.paiement === 'virement' ? ' on' : ''}`}>
              <input type="radio" name="paiement" value="virement" checked={form.paiement === 'virement'} onChange={maj('paiement')} />
              <span>
                <strong>Virement bancaire</strong>
                <p>Nous vous envoyons le RIB ; la commande part à réception du virement. Idéal pour les factures professionnelles.</p>
              </span>
            </label>
          </div>
        </div>

        {erreur && <div className="alert err">{erreur}</div>}

        <div className="row">
          <button className="btn btn-primary btn-lg" disabled={envoi} type="submit">
            {envoi ? 'Envoi en cours…' : `Confirmer la commande — ${dh(total)}`}
          </button>
          <a
            className="btn btn-ghost btn-lg"
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour Nuance Art, je souhaite commander :\n${resume}\nTotal : ${dh(total)}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Finaliser sur WhatsApp
          </a>
        </div>
      </form>

      <aside className="summary">
        <h2 className="d4">Votre commande</h2>
        {articles.map((a) => (
          <div className="sum-row" key={a.id}>
            <span style={{ paddingRight: '0.75rem' }}>
              {a.titre} <span className="tiny muted">({a.taille.l}×{a.taille.h}, {nomCadre(a.cadre)}) ×{a.qte}</span>
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>{dh(a.prixUnit * a.qte)}</span>
          </div>
        ))}
        <div className="hr" style={{ margin: '0.4rem 0' }} />
        <div className="sum-row"><span>Sous-total</span><span>{dh(sousTotal)}</span></div>
        <div className="sum-row"><span>Livraison</span><span>{port === 0 ? 'Offerte' : dh(port)}</span></div>
        <div className="sum-row total"><span>Total</span><span>{dh(total)}</span></div>
        <p className="tiny muted row" style={{ gap: '0.4rem' }}>
          <IcoCamion size={16} /> Expédition sous 48 h après confirmation.
        </p>
        <p className="tiny muted row" style={{ gap: '0.4rem' }}>
          <IcoCheck size={16} /> Retour accepté 14 jours.
        </p>
      </aside>
    </div>
  );
}
