'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { IcoCheck } from './Icones';

export default function Merci() {
  const ref = useSearchParams().get('ref');

  return (
    <div className="wrap section">
      <div className="merci">
        <div className="rond"><IcoCheck size={26} /></div>
        <h1 className="d3">Commande enregistrée</h1>
        <p className="lede" style={{ margin: '0.9rem auto 1.5rem' }}>
          Merci ! Nous vous appelons dans les deux heures ouvrées pour confirmer
          l’adresse et le format. Votre commande part ensuite en impression.
        </p>
        {ref && (
          <p className="small">
            Référence : <b style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>{ref}</b>
          </p>
        )}
        <div className="row mt-3" style={{ justifyContent: 'center' }}>
          <Link href="/tableaux" className="btn btn-primary">Continuer à explorer</Link>
          <Link href="/studio" className="btn btn-ghost">Essayer une autre œuvre</Link>
        </div>
      </div>
    </div>
  );
}
