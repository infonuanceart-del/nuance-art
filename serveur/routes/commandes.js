import { Router } from 'express';
import { store } from '../db.js';
import { exigerAdmin } from '../auth.js';
import { fraisLivraison } from '../partage/prix.js';
import { CADRE_PAR_SLUG } from '../partage/taxonomie.js';
import { STATUTS_COMMANDE } from '../partage/produit.js';

export const routesCommandes = Router();

/** Reference lisible au telephone : NA- puis six caracteres. */
function nouvelleRef() {
  const base = Date.now().toString(36).toUpperCase().slice(-4);
  const alea = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `NA-${base}${alea}`;
}

/**
 * Passage de commande, ouvert au public.
 *
 * Les prix sont entierement recalcules depuis la base : le montant envoye par
 * le navigateur n'est jamais une source de verite. C'est d'autant plus
 * important ici que la vitrine est un fichier statique, donc modifiable par
 * quiconque avant l'envoi.
 */
routesCommandes.post('/commandes', async (req, res) => {
  try {
    const { client = {}, articles = [], paiement = 'livraison' } = req.body || {};

    if (!Array.isArray(articles) || articles.length === 0) {
      res.status(400).json({ erreur: 'Panier vide' });
      return;
    }
    if (!client.nom || !client.tel || !client.adresse) {
      res.status(400).json({ erreur: 'Coordonnees incompletes' });
      return;
    }

    const catalogue = await store.produits.tous();
    const lignes = [];

    for (const a of articles) {
      const p = catalogue.find((x) => x.slug === a.slug);
      if (!p || p.actif === false) {
        res.status(400).json({ erreur: `Oeuvre indisponible : ${a.slug}` });
        return;
      }
      const taille = (p.tailles || []).find((t) => t.ref === a.taille?.ref);
      if (!taille) {
        res.status(400).json({ erreur: 'Format indisponible' });
        return;
      }

      const supp = CADRE_PAR_SLUG[a.cadre]?.supp ?? 0;
      const unitaire = Math.round((taille.prix + supp) * (1 - (p.promo || 0) / 100));
      const qte = Math.max(1, Math.min(20, Number(a.qte) || 1));

      lignes.push({
        slug: p.slug,
        titre: p.titre,
        image: p.thumb,
        taille,
        cadre: a.cadre || 'aucun',
        passe: !!a.passe,
        prixUnit: unitaire,
        qte,
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

    await store.commandes.creer(commande);
    res.json({ ok: true, ref: commande.ref, total: commande.total });
  } catch (e) {
    console.error('[commandes POST]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

routesCommandes.get('/commandes', exigerAdmin, async (req, res) => {
  try {
    res.json({ commandes: await store.commandes.toutes() });
  } catch (e) {
    console.error('[commandes GET]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

routesCommandes.patch('/commandes', exigerAdmin, async (req, res) => {
  try {
    const { ref, statut } = req.body || {};
    if (!STATUTS_COMMANDE.includes(statut)) {
      res.status(400).json({ erreur: 'Statut inconnu' });
      return;
    }
    const maj = await store.commandes.modifierStatut(ref, statut);
    if (!maj) {
      res.status(404).json({ erreur: 'Commande introuvable' });
      return;
    }
    res.json({ ok: true, commande: maj });
  } catch (e) {
    console.error('[commandes PATCH]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});
