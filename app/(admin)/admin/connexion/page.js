'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { lireJeton } from '@/lib/api';
import FormulaireConnexion from '@/components/admin/FormulaireConnexion';

export default function PageConnexion() {
  const router = useRouter();

  // Deja identifie : inutile de redemander le mot de passe.
  useEffect(() => {
    if (lireJeton()) router.replace('/admin');
  }, [router]);

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="logo" style={{ fontSize: '1.5rem' }}>
          <img src="/logo.png" alt="" className="logo-mark logo-mark-lg" width="384" height="384" />
          Nuance<span style={{ color: 'var(--clay)' }}>&nbsp;Art</span>
        </p>
        <p className="eyebrow" style={{ marginTop: '0.9rem' }}>Espace d’administration</p>
        <h1 className="d3" style={{ margin: '0.35rem 0 1.5rem' }}>Connexion</h1>
        <FormulaireConnexion />
      </div>
    </div>
  );
}
