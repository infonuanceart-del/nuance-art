/**
 * Client de l'API, cote navigateur.
 *
 * La vitrine est un export statique : elle n'a plus de routes serveur. Tout ce
 * qui lit ou ecrit en direct passe donc par le service Node deploye a part.
 */

export const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const CLE_JETON = 'na_jeton';

/* --------------------------------------------------------------- jeton */

/**
 * Le jeton vit dans localStorage : un export statique servi depuis un autre
 * domaine que l'API ne peut pas recevoir de cookie httpOnly. Il est donc
 * lisible par le JavaScript de la page — d'ou une duree de vie courte cote
 * serveur (12 h) et une deconnexion qui l'efface vraiment.
 */
export function lireJeton() {
  try {
    return localStorage.getItem(CLE_JETON) || '';
  } catch {
    return '';
  }
}

export function poserJeton(jeton) {
  try {
    localStorage.setItem(CLE_JETON, jeton);
  } catch {
    // navigation privee, stockage refuse : la session ne survivra pas au
    // rechargement, mais l'ecran courant reste utilisable.
  }
}

export function effacerJeton() {
  try {
    localStorage.removeItem(CLE_JETON);
  } catch {
    /* rien a faire */
  }
}

/* --------------------------------------------------------------- appels */

class ErreurApi extends Error {
  constructor(message, statut) {
    super(message);
    this.statut = statut;
  }
}

/**
 * @param {string} chemin  ex. '/api/produits'
 * @param {object} options  method, corps, avecJeton
 */
export async function appeler(chemin, { method = 'GET', corps, avecJeton = false, brut } = {}) {
  if (!API) {
    throw new ErreurApi('NEXT_PUBLIC_API_URL n’est pas configuré.', 0);
  }

  const entetes = {};
  if (corps !== undefined) entetes['Content-Type'] = 'application/json';
  if (avecJeton) {
    const jeton = lireJeton();
    if (!jeton) throw new ErreurApi('Session expirée.', 401);
    entetes.Authorization = `Bearer ${jeton}`;
  }

  let reponse;
  try {
    reponse = await fetch(API + chemin, {
      method,
      headers: entetes,
      body: brut !== undefined ? brut : corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  } catch {
    // Panne reseau, service endormi, CORS refuse : fetch ne donne aucun detail,
    // on evite donc de deviner et on dit ce qui est actionnable.
    throw new ErreurApi('Le serveur ne répond pas. Réessayez dans un instant.', 0);
  }

  let donnees = null;
  try {
    donnees = await reponse.json();
  } catch {
    donnees = null;
  }

  if (!reponse.ok) {
    throw new ErreurApi(donnees?.erreur || `Erreur ${reponse.status}`, reponse.status);
  }
  return donnees;
}

/** Envoi de fichier : pas d'en-tete Content-Type, le navigateur pose la frontiere. */
export async function envoyerFichier(chemin, formData) {
  return appeler(chemin, { method: 'POST', avecJeton: true, brut: formData });
}
