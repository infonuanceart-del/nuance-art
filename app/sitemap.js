import { lireProduits } from '@/lib/catalogue';
import { THEMES } from '@/lib/taxonomie';

/* Meme fraicheur que les pages : une oeuvre ajoutee dans l'administration
   entre dans le plan du site sans redeploiement, et la purge de l'etiquette
   catalogue le rafraichit avec le reste. */
export const revalidate = 120;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';

/* Les pages panier, commande et favoris sont en noindex : elles n'ont rien a
   faire ici. Les oeuvres ne portent pas de date de modification, d'ou
   l'absence de lastModified plutot qu'une date inventee. */
export default async function sitemap() {
  const produits = await lireProduits();
  const url = (chemin) => `${SITE}${chemin}`;

  return [
    { url: url('/'), changeFrequency: 'daily', priority: 1 },
    { url: url('/tableaux/'), changeFrequency: 'daily', priority: 0.9 },
    { url: url('/bestsellers/'), changeFrequency: 'weekly', priority: 0.7 },
    { url: url('/promotions/'), changeFrequency: 'daily', priority: 0.7 },
    { url: url('/personnaliser/'), changeFrequency: 'monthly', priority: 0.6 },
    { url: url('/studio/'), changeFrequency: 'monthly', priority: 0.5 },
    { url: url('/a-propos/'), changeFrequency: 'yearly', priority: 0.4 },
    { url: url('/contact/'), changeFrequency: 'yearly', priority: 0.4 },
    ...THEMES.map((t) => ({
      url: url(`/collections/${t.slug}/`), changeFrequency: 'weekly', priority: 0.8,
    })),
    ...produits.map((p) => ({
      url: url(`/tableaux/${p.slug}/`), changeFrequency: 'weekly', priority: 0.6,
    })),
  ];
}
