import { Router } from 'express';
import { store, lireReglages } from '../db.js';
import { exigerAdmin } from '../auth.js';
import { normaliserProduit, slugifier } from '../partage/produit.js';
import { prevenirVitrine } from '../revalidation.js';

export const routesProduits = Router();

/**
 * Instantane public du catalogue. C'est cette route que lit le script de
 * pre-build de la vitrine : elle ne renvoie que les oeuvres actives, plus les
 * reglages, en une seule requete.
 */
routesProduits.get('/catalogue', async (req, res) => {
  try {
    const [tous, reglages] = await Promise.all([store.produits.tous(), lireReglages()]);
    const produits = (tous || []).filter((p) => p.actif !== false);
    res.json({ produits, reglages, genere: new Date().toISOString() });
  } catch (e) {
    console.error('[catalogue]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

/** Catalogue complet, oeuvres masquees comprises. */
routesProduits.get('/produits', exigerAdmin, async (req, res) => {
  try {
    res.json({ produits: await store.produits.tous() });
  } catch (e) {
    console.error('[produits GET]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

routesProduits.post('/produits', exigerAdmin, async (req, res) => {
  try {
    const corps = req.body || {};
    const { erreur, produit } = normaliserProduit(corps, null);
    if (erreur) {
      res.status(400).json({ erreur });
      return;
    }

    // Un slug deja pris recoit un suffixe : la saisie n'echoue jamais sur un doublon.
    const existants = await store.produits.tous();
    const pris = new Set(existants.map((p) => p.slug));
    let slug = slugifier(corps.slug || produit.titre) || 'oeuvre';
    if (pris.has(slug)) {
      let n = 2;
      while (pris.has(`${slug}-${n}`)) n += 1;
      slug = `${slug}-${n}`;
    }

    const cree = await store.produits.creer({
      ...produit,
      slug,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ ok: true, produit: cree });
    prevenirVitrine(`creation ${slug}`);
  } catch (e) {
    console.error('[produits POST]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

/** Remise appliquee d'un coup a une selection, depuis l'ecran Promotions. */
routesProduits.patch('/produits', exigerAdmin, async (req, res) => {
  try {
    const { slugs = [], promo = 0 } = req.body || {};
    if (!Array.isArray(slugs) || !slugs.length) {
      res.status(400).json({ erreur: 'Aucune oeuvre selectionnee.' });
      return;
    }
    const remise = Math.round(Math.min(90, Math.max(0, Number(promo) || 0)));
    let n = 0;
    for (const slug of slugs.slice(0, 500)) {
      if (await store.produits.modifier(slug, { promo: remise })) n += 1;
    }
    res.json({ ok: true, modifiees: n, promo: remise });
    prevenirVitrine(`remise sur ${n} oeuvre(s)`);
  } catch (e) {
    console.error('[produits PATCH lot]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

routesProduits.get('/produits/:slug', exigerAdmin, async (req, res) => {
  try {
    const produit = await store.produits.parSlug(req.params.slug);
    if (!produit) {
      res.status(404).json({ erreur: 'Oeuvre introuvable' });
      return;
    }
    res.json({ produit });
  } catch (e) {
    console.error('[produit GET]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

routesProduits.patch('/produits/:slug', exigerAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const base = await store.produits.parSlug(slug);
    if (!base) {
      res.status(404).json({ erreur: 'Oeuvre introuvable' });
      return;
    }

    const corps = req.body || {};

    // Bascule rapide depuis la liste (afficher / masquer, mise en avant) :
    // on ne repasse pas par la validation complete d'une fiche.
    const bascules = ['actif', 'nouveaute', 'bestseller'];
    const clefs = Object.keys(corps);
    if (clefs.length && clefs.every((k) => bascules.includes(k))) {
      const patch = Object.fromEntries(clefs.map((k) => [k, Boolean(corps[k])]));
      res.json({ ok: true, produit: await store.produits.modifier(slug, patch) });
      prevenirVitrine(`bascule ${slug}`);
      return;
    }

    const { erreur, produit } = normaliserProduit(corps, base);
    if (erreur) {
      res.status(400).json({ erreur });
      return;
    }

    const maj = await store.produits.modifier(slug, {
      ...produit,
      updatedAt: new Date().toISOString(),
    });
    res.json({ ok: true, produit: maj });
    prevenirVitrine(`edition ${slug}`);
  } catch (e) {
    console.error('[produit PATCH]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

routesProduits.delete('/produits/:slug', exigerAdmin, async (req, res) => {
  try {
    const fait = await store.produits.supprimer(req.params.slug);
    if (!fait) {
      res.status(404).json({ erreur: 'Oeuvre introuvable' });
      return;
    }
    res.json({ ok: true });
    prevenirVitrine(`suppression ${req.params.slug}`);
  } catch (e) {
    console.error('[produit DELETE]', e);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});
