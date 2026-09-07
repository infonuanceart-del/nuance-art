import { Suspense } from 'react';
import Link from 'next/link';
import Catalogue from '@/components/Catalogue';
import Compteur from '@/components/Compteur';
import { lireProduits, lireReglages } from '@/lib/catalogue';
import { dh } from '@/lib/prix';
import { IcoCamion, IcoFleche } from '@/components/Icones';

export const metadata = {
  title: 'Promotions & ventes flash — jusqu’à -40 %',
  description:
    'Ventes flash Nuance Art : jusqu’à -40 % sur une sélection de calligraphies, zelliges '
    + 'et tapis anciens. Cadre offert dès 900 DH d’achat, livraison 48 h au Maroc.',
  alternates: { canonical: '/promotions' },
};

export default async function PagePromotions() {
  const [tous, reglages] = await Promise.all([lireProduits(), lireReglages()]);
  const promos = tous.filter((p) => p.promo > 0);

  const remiseMax = promos.reduce((m, p) => Math.max(m, p.promo), 0);
  const economieMax = promos.reduce(
    (m, p) => Math.max(m, Math.round(p.tailles.at(-1).prix * (p.promo / 100))),
    0,
  );
  const prixPlancher = promos.length
    ? Math.min(...promos.map((p) => Math.round(p.prixMin * (1 - p.promo / 100))))
    : 0;

  return (
    <>
      <section className="promo-hero">
        <div className="wrap">
          <span className="eyebrow center" style={{ color: 'var(--gold)' }}>Ventes flash</span>
          <h1 className="d1" style={{ margin: '0.8rem 0' }}>{reglages.promoTitre}</h1>
          <p className="lede">{reglages.promoTexte}</p>
          {reglages.promoFin && <Compteur fin={reglages.promoFin} />}
          <p className="tiny" style={{ marginTop: '1.4rem', opacity: 0.66 }}>
            Offre valable dans la limite des stocks d’encadrement. Non cumulable avec
            une remise professionnelle.
          </p>
        </div>
      </section>

      <div className="wrap section-tight">
        <div className="promo-strip">
          <div>
            <b>-{remiseMax} %</b>
            <span className="small muted">La remise la plus forte du moment</span>
          </div>
          <div>
            <b>{dh(prixPlancher)}</b>
            <span className="small muted">Premier prix en promotion</span>
          </div>
          <div>
            <b>{dh(economieMax)}</b>
            <span className="small muted">Économie maximale sur un grand format</span>
          </div>
          <div>
            <b>{promos.length}</b>
            <span className="small muted">Œuvres concernées</span>
          </div>
        </div>

        <div className="cta-final mt-3">
          <div className="row" style={{ gap: '0.9rem' }}>
            <IcoCamion size={26} />
            <div>
              <strong>Code {reglages.promoCode} : -10 % supplémentaires dès 1 500 DH</strong>
              <p className="small muted">À saisir au moment de la commande. Livraison offerte dès 600 DH.</p>
            </div>
          </div>
          <Link href="/studio" className="btn btn-primary">
            Essayer avant d’acheter <IcoFleche size={16} />
          </Link>
        </div>
      </div>

      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">La sélection</span>
            <h2 className="d3">{promos.length} œuvres en promotion</h2>
          </div>
          <Link href="/tableaux" className="link-arrow">Voir tout le catalogue <IcoFleche size={16} /></Link>
        </div>

        <Suspense fallback={<div className="empty-state">Chargement…</div>}>
          <Catalogue produits={promos} titreVide="Aucune promotion ne correspond à ces filtres" />
        </Suspense>

        <div style={{ height: 'clamp(2rem, 5vw, 4rem)' }} />
      </div>
    </>
  );
}
