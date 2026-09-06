import { redirect } from 'next/navigation';
import { sessionAdmin } from '@/lib/auth';
import FormulaireConnexion from '@/components/admin/FormulaireConnexion';

export const metadata = { title: 'Connexion' };

export default async function PageConnexion() {
  // Déjà identifié : inutile de redemander le mot de passe.
  if (await sessionAdmin()) redirect('/admin');

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="logo" style={{ fontSize: '1.5rem' }}>
          Nuance<span style={{ color: 'var(--clay)' }}>&nbsp;Art</span>
        </p>
        <p className="eyebrow" style={{ marginTop: '0.9rem' }}>Espace d’administration</p>
        <h1 className="d3" style={{ margin: '0.35rem 0 1.5rem' }}>Connexion</h1>
        <FormulaireConnexion />
      </div>
    </div>
  );
}
