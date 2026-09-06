import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { refuserSiNonAdmin } from '@/lib/auth';
import { normaliserProduit, slugifier } from '@/lib/produit';
import { rafraichirBoutique } from '@/lib/revalidation';

/** Catalogue complet, œuvres masquées comprises (réservé à l'admin). */
export async function GET() {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;
  return NextResponse.json({ produits: await store().produits.tous() });
}

export async function POST(req) {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;

  try {
    const corps = await req.json();
    const { erreur, produit } = normaliserProduit(corps, null);
    if (erreur) return NextResponse.json({ erreur }, { status: 400 });

    // Un slug déjà pris reçoit un suffixe : la saisie n'échoue jamais sur un doublon.
    const existants = await store().produits.tous();
    const pris = new Set(existants.map((p) => p.slug));
    let slug = slugifier(corps.slug || produit.titre) || 'oeuvre';
    if (pris.has(slug)) {
      let n = 2;
      while (pris.has(`${slug}-${n}`)) n += 1;
      slug = `${slug}-${n}`;
    }

    const cree = await store().produits.creer({
      ...produit,
      slug,
      createdAt: new Date().toISOString(),
    });
    rafraichirBoutique();
    return NextResponse.json({ ok: true, produit: cree }, { status: 201 });
  } catch (e) {
    console.error('[produits POST]', e);
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 });
  }
}

/** Remise appliquée d'un coup à une sélection, depuis l'écran Promotions. */
export async function PATCH(req) {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;

  try {
    const { slugs = [], promo = 0 } = await req.json();
    if (!Array.isArray(slugs) || !slugs.length) {
      return NextResponse.json({ erreur: 'Aucune œuvre sélectionnée.' }, { status: 400 });
    }
    const remise = Math.round(Math.min(90, Math.max(0, Number(promo) || 0)));
    let n = 0;
    for (const slug of slugs.slice(0, 500)) {
      if (await store().produits.modifier(slug, { promo: remise })) n += 1;
    }
    rafraichirBoutique();
    return NextResponse.json({ ok: true, modifiees: n, promo: remise });
  } catch (e) {
    console.error('[produits PATCH lot]', e);
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 });
  }
}
