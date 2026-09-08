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

const nextConfig = {
  reactStrictMode: true,

  // L'optimiseur d'images de Next demande un serveur. Le site n'utilise pas
  // next/image : les balises <img> servent les fichiers tels quels dans les
  // deux modes, autant garder un comportement identique de part et d'autre.
  images: { unoptimized: true },

  // Les adresses en ligne se terminent par une barre oblique. Ce reglage vaut
  // pour les deux cibles : le changer ferait bouger toutes les URL publiees.
  trailingSlash: true,

  ...(statique ? { output: 'export' } : {}),
};

export default nextConfig;
