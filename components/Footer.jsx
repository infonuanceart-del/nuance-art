import Link from 'next/link';
import { THEMES, PIECES } from '@/lib/taxonomie';
import { IcoFacebook, IcoInstagram, IcoLieu, IcoMail, IcoTelephone, IcoWhatsapp } from './Icones';

export default function Footer({ reglages }) {
  const annee = new Date().getFullYear();
  const wa = reglages?.whatsapp || '212600000000';

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <span className="logo"><img src="/logo.png" alt="Nuance Art" className="logo-mark" width="384" height="384" /></span>
            <p>
              Atelier d’édition d’art à Casablanca. Nous imprimons, encadrons et livrons
              partout au Maroc des œuvres choisies pour vivre chez vous — pas seulement
              pour être belles en photo.
            </p>
            <div className="socials">
              <a href="https://instagram.com" aria-label="Instagram" rel="noopener noreferrer" target="_blank"><IcoInstagram /></a>
              <a href="https://facebook.com" aria-label="Facebook" rel="noopener noreferrer" target="_blank"><IcoFacebook /></a>
              <a href={`https://wa.me/${wa}`} aria-label="WhatsApp" rel="noopener noreferrer" target="_blank"><IcoWhatsapp size={18} /></a>
            </div>
          </div>

          <div>
            <h4>Collections</h4>
            {THEMES.slice(0, 7).map((t) => (
              <Link key={t.slug} href={`/collections/${t.slug}`} style={{ display: 'block' }}>{t.nom}</Link>
            ))}
            <Link href="/tableaux" style={{ display: 'block' }}>Toutes les œuvres</Link>
          </div>

          <div>
            <h4>Par pièce</h4>
            {PIECES.slice(0, 6).map((p) => (
              <Link key={p.slug} href={`/tableaux?piece=${p.slug}`} style={{ display: 'block' }}>{p.nom}</Link>
            ))}
            <Link href="/promotions" style={{ display: 'block' }}>Promotions</Link>
            <Link href="/studio" style={{ display: 'block' }}>Studio d’essayage</Link>
          </div>

          <div>
            <h4>Nous joindre</h4>
            <p style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <IcoLieu size={17} /> {reglages?.adresse}
            </p>
            <a href={`tel:${(reglages?.telephone || '').replace(/\s/g, '')}`} style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
              <IcoTelephone size={17} /> {reglages?.telephone}
            </a>
            <a href={`mailto:${reglages?.email}`} style={{ display: 'flex', gap: '0.55rem', alignItems: 'center' }}>
              <IcoMail size={17} /> {reglages?.email}
            </a>
            <p className="tiny" style={{ marginTop: '0.9rem', opacity: 0.7 }}>
              Showroom ouvert du lundi au samedi, 10 h – 19 h.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              <Link href="/livraison-retours">Livraison & retours</Link>
              <Link href="/cgv">CGV</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {annee} Nuance Art — Tous droits réservés.</span>
          <span className="pay">
            Paiement <span>À la livraison</span><span>Virement</span><span>Carte (bientôt)</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
