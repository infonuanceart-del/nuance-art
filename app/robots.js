const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3210';

// Exige par l'export statique (BUILD_TARGET=static), sans effet sinon.
export const dynamic = 'force-static';

/* Seuls l'administration et l'API sont fermes aux robots. Panier, commande et
   favoris restent ouverts : ils portent deja noindex, et un robot doit pouvoir
   les lire pour voir cette consigne. */
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
