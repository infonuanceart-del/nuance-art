// Exige par l'export statique (BUILD_TARGET=static), sans effet sinon.
export const dynamic = 'force-static';

/* Manifeste web : nom et icones quand on ajoute le site a l'ecran d'accueil
   (Android, Chrome, Edge). Les couleurs reprennent le fond sombre de l'entete. */
export default function manifest() {
  return {
    name: 'Nuance Art — Art traditionnel encadré au Maroc',
    short_name: 'Nuance Art',
    description: 'Calligraphie, zellige, tapis anciens et enluminures, imprimés et encadrés à Casablanca.',
    lang: 'fr',
    start_url: '/',
    display: 'standalone',
    background_color: '#16120e',
    theme_color: '#16120e',
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
