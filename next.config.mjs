/** @type {import("next").NextConfig} */

/**
 * Deux cibles depuis un seul code.
 *
 * BUILD_TARGET=static produit un dossier out/ de fichiers simples, pour un
 * hebergeur qui ne sait que servir des fichiers. Ce mode abandonne l'ISR :
 * chaque page est gelee au moment de la construction, le catalogue publie
 * n'est donc a jour que depuis le dernier televersement, et une oeuvre creee
 * ensuite dans l'administration donne un 404 definitif tant qu'on n'a pas
 * reconstruit.
 *
 * Sans ce drapeau, c'est la construction serveur habituelle (Vercel) : les
 * pages se revalident toutes seules et une oeuvre inconnue a la construction
 * se rend a la premiere visite.
 */
const statique = process.env.BUILD_TARGET === 'static';

const DOUBLONS_RETIRES = {
  'prayer-in-the-mosque-by-1874-436482': 'prayer-in-the-mosque-436482',
  'arabs-crossing-a-ford-1873-436420': 'arabs-crossing-a-ford-436420',
  'scene-in-the-jewish-quarter-of-constantine-1851-437974': 'scene-in-the-jewish-quarter-of-constantine-437974',
  'the-arab-falconer-1864-436419': 'the-arab-falconer-436419',
  'sketch-for-reception-of-emperor-napoleon-iii-and-empress-ca-1862': 'sketch-for-reception-of-emperor-napoleon-iii-and-empress-441374',
  'akbar-with-lion-and-calf-verso-ca-1630-recto-ca-1530-50-451268': 'akbar-with-lion-and-calf-451268',
};

const nextConfig = {
  reactStrictMode: true,

  // L'optimiseur d'images de Next demande un serveur. Le site n'utilise pas
  // next/image : les balises <img> servent les fichiers tels quels dans les
  // deux modes, autant garder un comportement identique de part et d'autre.
  images: { unoptimized: true },

  // Les adresses en ligne se terminent par une barre oblique. Ce reglage vaut
  // pour les deux cibles : le changer ferait bouger toutes les URL publiees.
  trailingSlash: true,

  // Sur le VPS, scripts/redeployer-vps.sh construit dans un dossier a part
  // pendant que le site en ligne continue de servir .next, puis echange les
  // deux : un build rate ne coupe jamais le site. Partout ailleurs : .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  ...(statique ? { output: 'export' } : {}),

  // Six oeuvres importees deux fois du Met (meme objet, titre suffixe de sa
  // date) ont ete retirees le 18 sept. 2026 : leurs anciennes adresses menent
  // a la fiche conservee. Sans effet sur l'export statique (pas de serveur).
  ...(statique ? {} : {
    async redirects() {
      return Object.entries(DOUBLONS_RETIRES).map(([ancien, garde]) => ({
        source: `/tableaux/${ancien}/`,
        destination: `/tableaux/${garde}/`,
        permanent: true,
      }));
    },
  }),
};

export default nextConfig;
