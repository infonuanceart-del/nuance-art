import Favoris from '@/components/Favoris';
import { lireProduits } from '@/lib/catalogue';

/* En construction serveur, la page se refait au plus toutes les deux minutes :
   une oeuvre ajoutee dans l'administration apparait donc sans redeploiement.
   Valeur litterale exigee par Next, elle double FRAICHEUR de lib/catalogue.js.
   Sans effet sur l'export statique, qui ignore la revalidation. */
export const revalidate = 120;


export const metadata = {
  title: 'Mes favoris',
  robots: { index: false, follow: true },
};

export default async function PageFavoris() {
  const produits = await lireProduits();
  return (
    <div className="wrap section-tight">
      <header className="page-head" style={{ paddingTop: 0 }}>
        <span className="eyebrow">Favoris</span>
        <h1 className="d2">Les œuvres que vous avez mises de côté</h1>
      </header>
      <Favoris produits={produits} />
    </div>
  );
}
