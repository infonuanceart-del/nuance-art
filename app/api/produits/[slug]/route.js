import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { refuserSiNonAdmin } from '@/lib/auth';
import { normaliserProduit } from '@/lib/produit';
import { rafraichirBoutique } from '@/lib/revalidation';

export async function GET(req, { params }) {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;
  const { slug } = await params;
  const produit = await store().produits.parSlug(slug);
  if (!produit) return NextResponse.json({ erreur: 'Œuvre introuvable' }, { status: 404 });
  return NextResponse.json({ produit });
}

export async function PATCH(req, { params }) {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;

  try {
    const { slug } = await params;
    const base = await store().produits.parSlug(slug);
    if (!base) return NextResponse.json({ erreur: 'Œuvre introuvable' }, { status: 404 });

    const corps = await req.json();

    // Bascule rapide depuis la liste (afficher / masquer, mise en avant) :
    // on ne repasse pas par la validation complète d'une fiche.
    const bascules = ['actif', 'nouveaute', 'bestseller'];
    const clefs = Object.keys(corps);
    if (clefs.length && clefs.every((k) => bascules.includes(k))) {
      const patch = Object.fromEntries(clefs.map((k) => [k, Boolean(corps[k])]));
      const bascule = await store().produits.modifier(slug, patch);
      rafraichirBoutique();
      return NextResponse.json({ ok: true, produit: bascule });
    }

    const { erreur, produit } = normaliserProduit(corps, base);
    if (erreur) return NextResponse.json({ erreur }, { status: 400 });

    const maj = await store().produits.modifier(slug, {
      ...produit,
      updatedAt: new Date().toISOString(),
    });
    rafraichirBoutique();
    return NextResponse.json({ ok: true, produit: maj });
  } catch (e) {
    console.error('[produits PATCH]', e);
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const refus = await refuserSiNonAdmin();
  if (refus) return refus;
  const { slug } = await params;
  const fait = await store().produits.supprimer(slug);
  if (!fait) return NextResponse.json({ erreur: 'Œuvre introuvable' }, { status: 404 });
  rafraichirBoutique();
  return NextResponse.json({ ok: true });
}
