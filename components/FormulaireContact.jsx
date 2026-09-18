'use client';

import { useState } from 'react';
import { IcoMail, IcoWhatsapp } from './Icones';

const SUJETS = [
  'Une question sur une œuvre',
  'Ma commande en cours',
  'Un tableau personnalisé',
  'Un projet professionnel (hôtel, bureau, riad)',
  'Autre chose',
];

/**
 * Formulaire de contact sans serveur : il compose le message et l'ouvre dans
 * WhatsApp (canal principal de la boutique) ou dans la messagerie du visiteur.
 * Rien n'est stocke ni envoye par le site lui-meme.
 */
export default function FormulaireContact({ whatsapp, email }) {
  const [form, setForm] = useState({ nom: '', telephone: '', sujet: SUJETS[0], message: '' });
  const maj = (cle) => (e) => setForm((f) => ({ ...f, [cle]: e.target.value }));

  const texte = () => [
    `Bonjour Nuance Art, je suis ${form.nom.trim()}.`,
    `Sujet : ${form.sujet}`,
    '',
    form.message.trim(),
    ...(form.telephone.trim() ? ['', `Mon numéro : ${form.telephone.trim()}`] : []),
  ].join('\n');

  const envoyer = (e) => {
    e.preventDefault();
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(texte())}`, '_blank', 'noopener');
  };

  // Le lien courriel suit le formulaire : il part avec ce qui est deja saisi.
  const mailto = `mailto:${email}?subject=${encodeURIComponent(`${form.sujet} — ${form.nom.trim() || 'Nuance Art'}`)}`
    + `&body=${encodeURIComponent(texte())}`;

  return (
    <form className="panel" onSubmit={envoyer}>
      <div className="form-grid two">
        <div>
          <label className="lab" htmlFor="c-nom">Votre nom <span>*</span></label>
          <input id="c-nom" className="inp" value={form.nom} onChange={maj('nom')} autoComplete="name" required />
        </div>
        <div>
          <label className="lab" htmlFor="c-tel">Téléphone (facultatif)</label>
          <input id="c-tel" type="tel" className="inp" value={form.telephone} onChange={maj('telephone')} autoComplete="tel" />
        </div>
      </div>
      <div>
        <label className="lab" htmlFor="c-sujet">Sujet</label>
        <select id="c-sujet" className="inp" value={form.sujet} onChange={maj('sujet')}>
          {SUJETS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="lab" htmlFor="c-message">Votre message <span>*</span></label>
        <textarea
          id="c-message"
          className="inp"
          value={form.message}
          onChange={maj('message')}
          placeholder="Le titre de l’œuvre, le format envisagé, la pièce où l’accrocher…"
          required
        />
      </div>
      <div className="contact-actions">
        <button type="submit" className="btn btn-primary">
          <IcoWhatsapp size={18} /> Envoyer sur WhatsApp
        </button>
        <a className="btn btn-ghost" href={mailto}>
          <IcoMail size={17} /> Par e-mail
        </a>
      </div>
      <p className="tiny muted">
        Le message s’ouvre dans WhatsApp ou dans votre messagerie : vous le relisez avant
        de l’envoyer. Nous répondons du lundi au samedi, de 10 h à 19 h.
      </p>
    </form>
  );
}
