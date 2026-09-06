'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { lireJeton } from '@/lib/api';
import BarreLaterale from './BarreLaterale';

export default function Garde({ children }) {
  const router = useRouter();
  const [etat, setEtat] = useState('verification');

  useEffect(() => {
    if (lireJeton()) setEtat('ouvert');
    else router.replace('/admin/connexion');
  }, [router]);

  // Tant qu'on ne sait pas, on n'affiche rien : sans cela l'interface
  // apparaitrait une fraction de seconde avant la redirection.
  if (etat !== 'ouvert') return null;

  return (
    <div className="admin-shell">
      <BarreLaterale />
      <div className="admin-main">{children}</div>
    </div>
  );
}
