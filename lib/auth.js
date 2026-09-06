/**
 * Authentification de l'espace d'administration.
 * Un JWT signé, posé dans un cookie httpOnly : pas de session en base,
 * rien de sensible côté navigateur.
 */
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export const COOKIE = 'na_admin';
const DUREE = 60 * 60 * 12; // 12 heures

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 8) {
    throw new Error('AUTH_SECRET manquant : renseignez-le dans .env.local');
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

/** Session courante, ou null. À n'appeler que côté serveur. */
export async function sessionAdmin() {
  const jar = await cookies();
  const jeton = jar.get(COOKIE)?.value;
  return jeton ? verifierJeton(jeton) : null;
}

export const optionsCookie = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: DUREE,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Garde des pages de l'espace admin : renvoie la session ou coupe le rendu
 * par une redirection vers la page de connexion.
 */
export async function exigerAdmin() {
  const session = await sessionAdmin();
  if (!session) redirect('/admin/connexion');
  return session;
}

/** Garde des routes d'API : renvoie une réponse 401 à retourner telle quelle, ou null. */
export async function refuserSiNonAdmin() {
  if (await sessionAdmin()) return null;
  return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 });
}
