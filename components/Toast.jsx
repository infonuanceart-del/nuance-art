'use client';

import Link from 'next/link';
import { useBoutique } from './Boutique';
import { IcoCheck } from './Icones';

/** Confirmation discrète après un ajout au panier ou aux favoris. */
export default function Toast() {
  const { toast } = useBoutique();
  if (!toast) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      {toast.image ? <img src={toast.image} alt="" /> : <span className="toast-ico"><IcoCheck size={18} /></span>}
      <div>
        <b>{toast.type === 'panier' ? 'Ajouté au panier' : toast.titre}</b>
        {toast.type === 'panier' && <span>{toast.titre}</span>}
      </div>
      {toast.type === 'panier' && (
        <Link href="/panier" className="btn btn-primary btn-sm">Voir</Link>
      )}
    </div>
  );
}
