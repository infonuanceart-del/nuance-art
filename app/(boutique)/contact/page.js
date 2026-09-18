import Link from 'next/link';
import FormulaireContact from '@/components/FormulaireContact';
import { IcoLieu, IcoMail, IcoTelephone, IcoWhatsapp } from '@/components/Icones';
import { lireReglages } from '@/lib/catalogue';

/* Les coordonnees viennent des reglages de l'administration : les modifier
   la-bas met cette page a jour, au meme rythme que le reste du catalogue. */
export const revalidate = 120;

export const metadata = {
  title: 'Contact — atelier Nuance Art à Casablanca',
  description:
    'Une question sur une œuvre, un format ou une commande ? Écrivez-nous sur WhatsApp, '
    + 'par e-mail ou par téléphone, du lundi au samedi de 10 h à 19 h.',
  alternates: { canonical: '/contact' },
};

export default async function PageContact() {
  const reglages = await lireReglages();
  const wa = reglages.whatsapp || '212645448824';
  const tel = (reglages.telephone || '').replace(/\s/g, '');
  const carte = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Nuance Art, ${reglages.adresse}`)}`;

  return (
    <div className="wrap section-tight">
      <nav className="breadcrumb" aria-label="Fil d’Ariane">
        <Link href="/">Accueil</Link> <span>/</span> <span>Contact</span>
      </nav>

      <header className="page-head">
        <span className="eyebrow">Nous joindre</span>
        <h1 className="d2">Parlons de votre mur</h1>
        <p className="lede">
          Un doute sur un format, une œuvre à trouver pour une pièce précise, une commande à
          suivre ? L’atelier vous répond directement, sans standard ni robot.
        </p>
      </header>

      <div className="contact-grid">
        <FormulaireContact whatsapp={wa} email={reglages.email} />

        <aside className="contact-liste" aria-label="Coordonnées">
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
            <IcoWhatsapp size={20} />
            <span><strong>WhatsApp</strong>Le plus rapide pour nous joindre</span>
          </a>
          {tel && (
            <a href={`tel:${tel}`}>
              <IcoTelephone size={20} />
              <span><strong>{reglages.telephone}</strong>Du lundi au samedi, 10 h – 19 h</span>
            </a>
          )}
          {reglages.email && (
            <a href={`mailto:${reglages.email}`}>
              <IcoMail size={20} />
              <span><strong>{reglages.email}</strong>Pour les devis et les projets professionnels</span>
            </a>
          )}
          {reglages.adresse && (
            <a href={carte} target="_blank" rel="noopener noreferrer">
              <IcoLieu size={20} />
              <span><strong>{reglages.adresse}</strong>L’atelier, à Casablanca — voir sur la carte</span>
            </a>
          )}

          <div className="contact-note">
            <strong>Avant d’écrire</strong>
            <p>
              Beaucoup de réponses sont déjà en ligne : les délais et le paiement dans la{' '}
              <Link href="/#faq">foire aux questions</Link>, le bon format dans le{' '}
              <Link href="/studio">studio d’essayage</Link>, qui montre l’œuvre sur la photo de
              votre mur.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
