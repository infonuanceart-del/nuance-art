/**
 * Agregation des chiffres du tableau de bord.
 *
 * La vitrine et l'administration sont un export statique : aucun serveur ne
 * prepare ces totaux. Tout se calcule donc dans le navigateur, a partir des
 * deux seules ressources que l'API ouvre a l'admin — le catalogue et les
 * commandes.
 *
 * Ces fonctions sont pures : elles ne lisent ni l'horloge ni le reseau. On
 * leur passe l'instant de reference, ce qui les rend previsibles et evite de
 * faire dependre un rendu React d'un Date.now() implicite.
 */

import { STATUTS_COMMANDE } from './produit';

const JOUR = 86400000;

/**
 * Une commande annulee ne compte ni dans le chiffre d'affaires ni dans le
 * panier moyen, mais reste comptee dans le nombre de commandes recues.
 */
export const estValide = (c) => c.statut !== 'annulee';

export const PERIODES = [
  { cle: '7j', nom: '7 jours', jours: 7 },
  { cle: '30j', nom: '30 jours', jours: 30 },
  { cle: '90j', nom: '90 jours', jours: 90 },
  { cle: 'tout', nom: 'Tout', jours: null },
];

/** Minuit local : les series se comptent par journee entiere, pas par 24 h glissantes. */
export function debutJour(date) {
  const j = new Date(date);
  j.setHours(0, 0, 0, 0);
  return j;
}

/**
 * Decoupe les commandes en deux fenetres de meme duree : la periode demandee
 * et celle qui la precede immediatement. Comparer a duree egale est la seule
 * base honnete pour une evolution — sans quoi un mois de 31 jours battrait
 * toujours un mois de 28.
 */
export function decouper(commandes, jours, maintenant = Date.now()) {
  if (!jours) return { courante: commandes, precedente: [], debut: null };

  const debut = debutJour(maintenant).getTime() - (jours - 1) * JOUR;
  const debutPrecedent = debut - jours * JOUR;
  const quand = (c) => new Date(c.createdAt).getTime();

  return {
    debut,
    courante: commandes.filter((c) => quand(c) >= debut),
    precedente: commandes.filter((c) => quand(c) >= debutPrecedent && quand(c) < debut),
  };
}

/** Totaux d'un lot de commandes deja filtre sur la periode voulue. */
export function totaux(commandes) {
  const valides = commandes.filter(estValide);
  const ca = valides.reduce((s, c) => s + (c.total || 0), 0);
  const articles = valides.reduce(
    (s, c) => s + (c.articles || []).reduce((n, a) => n + (a.qte || 0), 0),
    0,
  );

  return {
    ca,
    nb: commandes.length,
    nbValides: valides.length,
    panier: valides.length ? ca / valides.length : 0,
    articles,
    aTraiter: commandes.filter((c) => c.statut === 'nouvelle').length,
    annulees: commandes.length - valides.length,
  };
}

/**
 * Evolution en pourcentage entre deux periodes.
 *
 * Renvoie null quand la periode precedente est vide : « +100 % » a partir de
 * zero ne veut rien dire et gonflerait la lecture d'un demarrage.
 */
export function evolution(actuel, precedent) {
  if (!precedent) return null;
  return ((actuel - precedent) / precedent) * 100;
}

/**
 * Une entree par journee, journees vides comprises — sans elles la courbe
 * mentirait en reliant deux ventes distantes comme si rien ne s'etait passe
 * entre les deux.
 *
 * Sur « Tout », l'etendue se deduit de la commande la plus ancienne, bornee a
 * un an pour que le graphique reste lisible.
 */
export function serie(commandes, jours, maintenant = Date.now()) {
  const fin = debutJour(maintenant).getTime();
  let n = jours;

  if (!n) {
    const dates = commandes
      .map((c) => debutJour(c.createdAt).getTime())
      .filter((t) => Number.isFinite(t));
    const plusAncienne = dates.length ? Math.min(...dates) : fin;
    n = Math.min(365, Math.max(7, Math.round((fin - plusAncienne) / JOUR) + 1));
  }

  const cases = new Map();
  for (let i = 0; i < n; i += 1) {
    const t = fin - (n - 1 - i) * JOUR;
    cases.set(t, { t, ca: 0, nb: 0 });
  }

  for (const c of commandes) {
    const e = cases.get(debutJour(c.createdAt).getTime());
    if (!e) continue;
    e.nb += 1;
    if (estValide(c)) e.ca += c.total || 0;
  }

  return [...cases.values()];
}

/** Repartition par statut, dans l'ordre du cycle de vie d'une commande. */
export function parStatut(commandes) {
  return STATUTS_COMMANDE.map((statut) => ({
    statut,
    nb: commandes.filter((c) => c.statut === statut).length,
  }));
}

/**
 * Ventes par oeuvre, reconstituees depuis les lignes de commande.
 *
 * Le titre et l'image sont figes dans la ligne au moment de l'achat. On leur
 * prefere ceux du catalogue quand l'oeuvre y figure encore, et on garde la
 * ligne sinon : une oeuvre retiree du catalogue a tout de meme ete vendue, et
 * l'oublier fausserait le total.
 */
export function ventesParOeuvre(commandes, produits) {
  const parSlug = new Map(produits.map((p) => [p.slug, p]));
  const cumul = new Map();

  for (const c of commandes.filter(estValide)) {
    for (const a of c.articles || []) {
      const e = cumul.get(a.slug) || {
        slug: a.slug, titre: a.titre, image: a.image, qte: 0, ca: 0, present: false,
      };
      e.qte += a.qte || 0;
      e.ca += (a.prixUnit || 0) * (a.qte || 0);

      const p = parSlug.get(a.slug);
      if (p) {
        e.present = true;
        e.titre = p.titre;
        e.image = p.thumb || e.image;
        e.theme = p.theme;
      }
      cumul.set(a.slug, e);
    }
  }

  return [...cumul.values()].sort((x, y) => y.ca - x.ca);
}

/** Chiffre d'affaires par theme, en joignant chaque ligne au catalogue. */
export function ventesParTheme(commandes, produits) {
  const parSlug = new Map(produits.map((p) => [p.slug, p]));
  const cumul = new Map();

  for (const c of commandes.filter(estValide)) {
    for (const a of c.articles || []) {
      const theme = parSlug.get(a.slug)?.theme || 'inconnu';
      cumul.set(theme, (cumul.get(theme) || 0) + (a.prixUnit || 0) * (a.qte || 0));
    }
  }

  return [...cumul.entries()]
    .map(([theme, ca]) => ({ theme, ca }))
    .sort((x, y) => y.ca - x.ca);
}

/** Ou vont les colis : utile pour negocier les tournees du transporteur. */
export function parVille(commandes) {
  const cumul = new Map();

  for (const c of commandes.filter(estValide)) {
    const ville = (c.client?.ville || '').trim() || 'Non precisee';
    const e = cumul.get(ville) || { ville, nb: 0, ca: 0 };
    e.nb += 1;
    e.ca += c.total || 0;
    cumul.set(ville, e);
  }

  return [...cumul.values()].sort((x, y) => y.ca - x.ca);
}

/**
 * Oeuvres en ligne qui n'ont jamais ete commandees : le fond de catalogue qui
 * dort. On regarde toutes les commandes, pas seulement la periode affichee —
 * une oeuvre vendue l'an dernier n'est pas « jamais vendue ».
 */
export function jamaisVendues(produits, toutesCommandes) {
  const vendus = new Set();
  for (const c of toutesCommandes.filter(estValide)) {
    for (const a of c.articles || []) vendus.add(a.slug);
  }
  return produits.filter((p) => p.actif !== false && !vendus.has(p.slug));
}

/** Etat du catalogue, independant de la periode choisie. */
export function etatCatalogue(produits) {
  return {
    total: produits.length,
    enLigne: produits.filter((p) => p.actif !== false).length,
    horsLigne: produits.filter((p) => p.actif === false).length,
    enPromo: produits.filter((p) => (p.promo || 0) > 0).length,
    bestsellers: produits.filter((p) => p.bestseller).length,
    nouveautes: produits.filter((p) => p.nouveaute).length,
  };
}
