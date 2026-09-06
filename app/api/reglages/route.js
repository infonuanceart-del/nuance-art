import { NextResponse } from 'next/server';
import { store, REGLAGES_DEFAUT } from '@/lib/store';
import { refuserSiNonAdmin } from '@/lib/auth';
import { rafraichirBoutique } from '@/lib/revalidation';

// Seules ces clés sont acceptées : un champ inconnu envoyé par erreur ne peut
// pas polluer les réglages lus par toutes les pages du site.
const CLES = Object.keys(REGLAGES_DEFAUT);

export async function GET() {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;
  const enregistres = await store().reglages.lire();
  return NextResponse.json({ reglages: { ...REGLAGES_DEFAUT, ...(enregistres || {}) } });
}

export async function PUT(req) {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;

  try {
    const corps = await req.json();
    const patch = {};
    for (const cle of CLES) {
      if (!(cle in corps)) continue;
      const v = corps[cle];
      patch[cle] = typeof v === 'boolean' ? v : String(v ?? '').trim().slice(0, 400);
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ erreur: 'Rien à enregistrer.' }, { status: 400 });
    }
    const maj = await store().reglages.ecrire(patch);
    rafraichirBoutique();
    return NextResponse.json({ ok: true, reglages: { ...REGLAGES_DEFAUT, ...maj } });
  } catch (e) {
    console.error('[reglages PUT]', e);
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 });
  }
}
