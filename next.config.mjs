/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // La vitrine et l'administration sont publiees en fichiers statiques :
  // aucun serveur Next en production, tout ce qui ecrit passe par l'API du
  // dossier serveur/. `npm run build` produit out/.
  output: 'export',

  // L'optimiseur d'images de Next demande un serveur : sans lui, les balises
  // <img> servent les fichiers tels quels. Le site n'utilise pas next/image.
  images: { unoptimized: true },

  // Chaque page devient un dossier avec son index.html, ce que les
  // hebergeurs statiques servent sans regle de reecriture.
  trailingSlash: true,
};

export default nextConfig;
