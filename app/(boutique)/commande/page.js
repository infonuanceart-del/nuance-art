import Link from 'next/link';
import Commande from '@/components/Commande';
import { lireReglages } from '@/lib/catalogue';

/* En construction serveur, la page se refait au plus toutes les deux minutes :
   une oeuvre ajoutee dans l'administration apparait donc sans redeploiement.
   Valeur litterale exigee par Next, elle double FRAICHEUR de lib/catalogue.js.
   Sans effet sur l'export statique, qui ignore la revalidation. */
export const revalidate = 120;


export const metadata = {
  title: 'Commande',
  description: 'Finalisez votre commande Nuance Art : livraison 48 h, paiement à la livraison.',
  robots: { index: false, follow: false },
};

export default async function PageCommande() {
  const reglages = await lireReglages();
  return (
    <div className="wrap section-tight">
      <header className="page-head" style={{ paddingTop: 0, textAlign: 'center' }}>
        <div className="fil">
          <Link href="/panier">Panier</Link> <i>—</i> <b>Coordonnées</b> <i>—</i> <span>Confirmation</span>
        </div>
        <h1 className="d2">Finaliser la commande</h1>
      </header>
      <Commande whatsapp={reglages.whatsapp} />
    </div>
  );
}
