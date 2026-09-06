'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FormulaireConnexion() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const r = await fetch('/api/admin/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.erreur || 'Connexion impossible.');
      // refresh() force le rendu serveur à relire le cookie qui vient d'être posé.
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setErreur(err.message);
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="stack">
      {erreur && <p className="alert err" role="alert">{erreur}</p>}

      <div>
        <label className="lab" htmlFor="email">Adresse e-mail</label>
        <input
          id="email"
          type="email"
          className="inp"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="lab" htmlFor="mdp">Mot de passe</label>
        <input
          id="mdp"
          type="password"
          className="inp"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block mt-1" disabled={envoi}>
        {envoi ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className="tiny tc" style={{ color: 'var(--muted)', marginTop: '0.4rem' }}>
        Espace réservé à l’équipe Nuance Art.
      </p>
    </form>
  );
}
