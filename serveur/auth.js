/**
 * Authentification de l'API.
 *
 * Difference avec l'application Next : le jeton voyage ici dans l'en-tete
 * `Authorization: Bearer …`, pas dans un cookie httpOnly. C'est impose par
 * l'architecture separee — la vitrine est un export statique servi par un autre
 * domaine, elle ne peut pas poser de cookie sur celui de l'API.
 *
 * Consequence a assumer : le jeton est lisible par le JavaScript de la page
 * (localStorage). On compense par une duree de vie courte et un secret long.
 */
import jwt from 'jsonwebtoken';

const DUREE = 60 * 60 * 12; // 12 heures

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET manquant ou trop court (16 caracteres minimum).');
  }
  return s;
}

export function signerJeton(charge) {
  return jwt.sign(charge, secret(), { expiresIn: DUREE });
}

export function verifierJeton(jeton) {
  try {
    return jwt.verify(jeton, secret());
  } catch {
    return null;
  }
}

/** Middleware : refuse la requete si l'en-tete Authorization ne porte pas un jeton valide. */
export function exigerAdmin(req, res, suite) {
  const entete = req.get('authorization') || '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7).trim() : '';
  const session = jeton ? verifierJeton(jeton) : null;

  if (!session) {
    res.status(401).json({ erreur: 'Non autorise' });
    return;
  }
  req.session = session;
  suite();
}
