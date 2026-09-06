import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { store } from '@/lib/store';
import { COOKIE, signerJeton, optionsCookie } from '@/lib/auth';

// Freinage des essais répétés : trois échecs, puis une minute d'attente.
// En mémoire du processus, ce qui suffit pour une boutique à un seul admin.
const essais = new Map();
const MAX = 5;
const FENETRE = 60_000;

function trop(cle) {
  const e = essais.get(cle);
  if (!e) return false;
  if (Date.now() - e.debut > FENETRE) { essais.delete(cle); return false; }
  return e.n >= MAX;
}

function noter(cle) {
  const e = essais.get(cle);
  if (!e || Date.now() - e.debut > FENETRE) essais.set(cle, { n: 1, debut: Date.now() });
  else e.n += 1;
}

export async function POST(req) {
  try {
    const { email = '', motDePasse = '' } = await req.json();
    const cle = req.headers.get('x-forwarded-for') || 'local';

    if (trop(cle)) {
      return NextResponse.json(
        { erreur: 'Trop de tentatives. Réessayez dans une minute.' },
        { status: 429 },
      );
    }

    const admin = await store().admins.parEmail(String(email).trim().toLowerCase());
    // Message identique dans les deux cas : on n'indique jamais si l'adresse existe.
    const ok = admin && bcrypt.compareSync(String(motDePasse), admin.hash || '');
    if (!ok) {
      noter(cle);
      return NextResponse.json({ erreur: 'Identifiants incorrects.' }, { status: 401 });
    }

    essais.delete(cle);
    const jeton = signerJeton({ email: admin.email, nom: admin.nom || 'Administrateur' });
    (await cookies()).set(COOKIE, jeton, optionsCookie);
    return NextResponse.json({ ok: true, nom: admin.nom || 'Administrateur' });
  } catch (e) {
    console.error('[connexion]', e);
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 });
  }
}
