'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IcoStats, IcoImage, IcoTiroir, IcoEtoile, IcoReglages, IcoSortie, IcoFleche,
} from '@/components/Icones';

const LIENS = [
  { href: '/admin', nom: 'Tableau de bord', Ico: IcoStats },
  { href: '/admin/produits', nom: 'Œuvres', Ico: IcoImage },
  { href: '/admin/commandes', nom: 'Commandes', Ico: IcoTiroir },
  { href: '/admin/promotions', nom: 'Promotions', Ico: IcoEtoile },
  { href: '/admin/reglages', nom: 'Réglages', Ico: IcoReglages },
];

export default function BarreLaterale({ nom, email }) {
  const chemin = usePathname();
  const router = useRouter();

  async function deconnecter() {
    await fetch('/api/admin/deconnexion', { method: 'POST' });
    router.replace('/admin/connexion');
    router.refresh();
  }

  return (
    <nav className="admin-side" aria-label="Navigation de l’administration">
      <p className="logo">Nuance<span>&nbsp;Art</span></p>

      {LIENS.map(({ href, nom: libelle, Ico }) => {
        // « actif » sur la section, mais /admin ne s'allume que sur lui-même.
        const actif = href === '/admin' ? chemin === href : chemin.startsWith(href);
        return (
          <Link key={href} href={href} className={actif ? 'on' : ''} aria-current={actif ? 'page' : undefined}>
            <Ico size={17} />
            {libelle}
          </Link>
        );
      })}

      <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
        <Link href="/" target="_blank" rel="noopener noreferrer">
          <IcoFleche size={17} />
          Voir la boutique
        </Link>
        <button type="button" onClick={deconnecter} className="admin-sortie">
          <IcoSortie size={17} />
          Déconnexion
        </button>
        <p className="tiny" style={{ padding: '0.9rem 0.8rem 0', opacity: 0.5 }}>
          {nom}
          <br />
          {email}
        </p>
      </div>
    </nav>
  );
}
