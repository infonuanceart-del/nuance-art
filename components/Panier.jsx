'use client';

import Link from 'next/link';
import { useBoutique } from './Boutique';
import { dh, fraisLivraison, SEUIL_LIVRAISON } from '@/lib/prix';
import { nomCadre } from '@/lib/taxonomie';
import { IcoMoins, IcoPanier, IcoPlus, IcoPoubelle } from './Icones';

export default function Panier() {
  const { articles, changerQte, retirer, sousTotal, pret } = useBoutique();

  if (!pret) return <div className="empty-state">Chargement du panier…</div>;

  if (articles.length === 0) {
    return (
      <div className="vide">
        <IcoPanier size={44} />
        <h2 className="d3">Votre panier est vide</h2>
        <p className="lede" style={{ margin: '0.75rem auto 1.75rem' }}>
          Parcourez le catalogue, ou passez d’abord par le studio pour trouver
          le bon format sans vous tromper.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link href="/tableaux" className="btn btn-primary">Voir les œuvres</Link>
          <Link href="/studio" className="btn btn-ghost">Ouvrir le studio</Link>
        </div>
      </div>
    );
  }

  const port = fraisLivraison(sousTotal);

  return (
    <div className="cart-layout">
      <div>
        {articles.map((a) => (
          <div className="cart-row" key={a.id}>
            <img className="thumb" src={a.thumb || a.image} alt="" />
            <div>
              {a.perso
                ? <b>{a.titre}</b>
                : <Link href={`/tableaux/${a.slug}`}><b>{a.titre}</b></Link>}
              <p className="tiny muted">
                {a.taille.l} × {a.taille.h} cm · {nomCadre(a.cadre)}
                {a.passe ? ' · passe-partout' : ''}
                {a.perso ? ' · votre photo' : ''}
              </p>
              <div className="row mt-1">
                <div className="qty">
                  <button onClick={() => changerQte(a.id, a.qte - 1)} aria-label="Retirer un exemplaire"><IcoMoins size={15} /></button>
                  <span>{a.qte}</span>
                  <button onClick={() => changerQte(a.id, a.qte + 1)} aria-label="Ajouter un exemplaire"><IcoPlus size={15} /></button>
                </div>
                <button className="tiny muted row" style={{ gap: '0.3rem' }} onClick={() => retirer(a.id)}>
                  <IcoPoubelle size={14} /> Retirer
                </button>
              </div>
            </div>
            <b style={{ whiteSpace: 'nowrap' }}>{dh(a.prixUnit * a.qte)}</b>
          </div>
        ))}

        <Link href="/tableaux" className="link-arrow mt-3" style={{ display: 'inline-flex' }}>
          Continuer mes achats
        </Link>
      </div>

      <aside className="summary">
        <h2 className="d4">Récapitulatif</h2>
        <div className="sum-row"><span>Sous-total</span><span>{dh(sousTotal)}</span></div>
        <div className="sum-row">
          <span>Livraison</span>
          <span>{port === 0 ? 'Offerte' : dh(port)}</span>
        </div>
        {port > 0 && (
          <p className="tiny muted">
            Plus que {dh(SEUIL_LIVRAISON - sousTotal)} pour la livraison offerte.
          </p>
        )}
        <div className="sum-row total"><span>Total</span><span>{dh(sousTotal + port)}</span></div>
        <Link href="/commande" className="btn btn-primary btn-block mt-1">Passer la commande</Link>
        <p className="tiny muted tc">Paiement à la livraison disponible partout au Maroc.</p>
      </aside>
    </div>
  );
}
