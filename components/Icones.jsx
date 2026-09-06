/** Petites icônes SVG inline (aucune librairie, aucun poids réseau). */

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Svg = ({ children, size = 20, ...rest }) => (
  <svg {...base} width={size} height={size} aria-hidden="true" {...rest}>{children}</svg>
);

export const IcoChevron = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const IcoFleche = (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IcoLoupe = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></Svg>;
export const IcoPanier = (p) => (
  <Svg {...p}><path d="M6 7h12l-1 12H7L6 7Z" /><path d="M9.5 7V5.8a2.5 2.5 0 0 1 5 0V7" /></Svg>
);
export const IcoCoeur = (p) => (
  <Svg {...p}><path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9Z" /></Svg>
);
export const IcoMenu = (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const IcoCroix = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const IcoPlus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IcoMoins = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const IcoPoubelle = (p) => (
  <Svg {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></Svg>
);
export const IcoCamera = (p) => (
  <Svg {...p}><path d="M3 8.5h3.2l1.4-2h7.8l1.4 2H20v10H3v-10Z" /><circle cx="11.5" cy="13" r="3.2" /></Svg>
);
export const IcoImage = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 17 5-4.5 4 3.2 3-2.4 4 3.7" /></Svg>
);
export const IcoTelecharger = (p) => (
  <Svg {...p}><path d="M12 4v10m0 0-3.5-3.5M12 14l3.5-3.5" /><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /></Svg>
);
export const IcoWhatsapp = ({ size = 20, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.9 9.9 0 0 0 12.04 2Zm0 18.16h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.09.81.83-3.01-.2-.31a8.17 8.17 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.55-3.7 8.2-8.27 8.2Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.71-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.24-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.62 4.15 3.67.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
  </svg>
);
export const IcoInstagram = ({ size = 18, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" {...rest}>
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IcoFacebook = ({ size = 18, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5h1.65V3.6c-.29-.04-1.27-.13-2.41-.13-2.38 0-4.01 1.45-4.01 4.13V9.9H7.6V13h2.68v8h3.22Z" />
  </svg>
);
export const IcoCamion = (p) => (
  <Svg {...p}><path d="M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6Z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" /></Svg>
);
export const IcoBouclier = (p) => (
  <Svg {...p}><path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6l7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const IcoRetour = (p) => (
  <Svg {...p}><path d="M4 9h11a4.5 4.5 0 0 1 0 9H9" /><path d="m8 5-4 4 4 4" /></Svg>
);
export const IcoPinceau = (p) => (
  <Svg {...p}><path d="M14 4.5 19.5 10 11 18.5H5.5V13L14 4.5Z" /><path d="M12.5 6 18 11.5" /></Svg>
);
export const IcoRegle = (p) => (
  <Svg {...p}><rect x="2.5" y="8.5" width="19" height="7" rx="1.5" /><path d="M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v4" /></Svg>
);
export const IcoEtoile = ({ size = 12, plein = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={plein ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.5Z" />
  </svg>
);
export const IcoRotation = (p) => (
  <Svg {...p}><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v4h-4" /></Svg>
);
export const IcoTiroir = (p) => (
  <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 14h6" /></Svg>
);
export const IcoStats = (p) => (
  <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>
);
export const IcoReglages = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></Svg>
);
export const IcoSortie = (p) => (
  <Svg {...p}><path d="M10 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" /><path d="M16 15l4-3-4-3M20 12H9" /></Svg>
);
export const IcoCheck = (p) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>;
export const IcoTelephone = (p) => (
  <Svg {...p}><path d="M4.5 4.5h3.6l1.4 3.6-2 1.4a12 12 0 0 0 5 5l1.4-2 3.6 1.4v3.6a1.5 1.5 0 0 1-1.6 1.5C9.5 18.4 5.6 14.5 4.5 6.1A1.5 1.5 0 0 1 4.5 4.5Z" /></Svg>
);
export const IcoMail = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.6 6.5 8.4 6 8.4-6" /></Svg>
);
export const IcoLieu = (p) => (
  <Svg {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></Svg>
);
