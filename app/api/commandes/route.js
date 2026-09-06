import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { sessionAdmin } from '@/lib/auth';
import { fraisLivraison } from '@/lib/prix';

/** Référence lisible au téléphone : NA-6 caractères. */
function nouvelleRef() {
  const base = Date.now().toString(36).toUpperCase().slice(-4);
  const alea = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `NA-${base}${alea}`;
}

export async function POST(req) {
  try {
    const corps = await req.json();
    const { client = {}, articles = [], paiement = 'livraison' } = corps;

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ erreur: 'Panier vide' }, { status: 400 });
    }
    if (!client.nom || !client.tel || !client.adresse) {
      return NextResponse.json({ erreur: 'Coordonnées incomplètes' }, { status: 400 });
    }

    // Les prix sont recalculés depuis la base : le montant envoyé par le
    // navigateur n'est jamais une source de vérité.
    const catalogue = await store().produits.tous();
    const lignes = [];
    for (const a of articles) {
      const p = catalogue.find((x) => x.slug === a.slug);
      if (!p) return NextResponse.json({ erreur: `Œuvre inconnue : ${a.slug}` }, { status: 400 });
      const taille = (p.tailles || []).find((t) => t.ref === a.taille?.ref);
      if (!taille) return NextResponse.json({ erreur: 'Format indisponible' }, { status: 400 });

      const supp = { aucun: 0, noir: 120, chene: 150, blanc: 120, dore: 220 }[a.cadre] ?? 0;
      const unitaire = Math.round((taille.prix + supp) * (1 - (p.promo || 0) / 100));
      const qte = Math.max(1, Math.min(20, Number(a.qte) || 1));
      lignes.push({
        slug: p.slug, titre: p.titre, image: p.thumb,
        taille, cadre: a.cadre || 'aucun', passe: !!a.passe,
        prixUnit: unitaire, qte,
      });
    }

    const sousTotal = lignes.reduce((s, l) => s + l.prixUnit * l.qte, 0);
    const livraison = fraisLivraison(sousTotal);

    const commande = {
      ref: nouvelleRef(),
      client: {
        nom: String(client.nom).slice(0, 90),
        tel: String(client.tel).slice(0, 20),
        email: String(client.email || '').slice(0, 120),
        ville: String(client.ville || '').slice(0, 60),
        adresse: String(client.adresse).slice(0, 300),
        note: String(client.note || '').slice(0, 300),
      },
      articles: lignes,
      sousTotal,
      livraison,
      total: sousTotal + livraison,
      paiement: paiement === 'virement' ? 'virement' : 'livraison',
      statut: 'nouvelle',
      createdAt: new Date().toISOString(),
    };

    await store().commandes.creer(commande);
    return NextResponse.json({ ok: true, ref: commande.ref, total: commande.total });
  } catch (e) {
    console.error('[commandes]', e);
    return NextResponse.json({ erreur: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET() {
  if (!(await sessionAdmin())) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 });
  }
  return NextResponse.json({ commandes: await store().commandes.toutes() });
}

export async function PATCH(req) {
  if (!(await sessionAdmin())) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 });
  }
  const { ref, statut } = await req.json();
  const permis = ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'];
  if (!permis.includes(statut)) {
    return NextResponse.json({ erreur: 'Statut inconnu' }, { status: 400 });
  }
  const maj = await store().commandes.modifierStatut(ref, statut);
  if (!maj) return NextResponse.json({ erreur: 'Commande introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true, commande: maj });
}
