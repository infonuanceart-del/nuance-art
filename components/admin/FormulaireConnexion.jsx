'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appeler, poserJeton } from '@/lib/api';

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
      const data = await appeler('/api/admin/connexion', {
        method: 'POST',
        corps: { email, motDePasse },
      });
      // L'API renvoie un jeton Bearer : c'est le navigateur qui le conserve.
      poserJeton(data.jeton);
      router.replace('/admin');
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
