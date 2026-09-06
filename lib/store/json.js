/**
 * Store de secours sur fichier (.data/db.json).
 *
 * Utilisé quand MONGODB_URI n'est pas renseigné : le site tourne alors sans
 * aucune installation, ce qui rend la démo client immédiate. Même interface
 * que le driver Mongo, donc le passage à Atlas ne change aucune page.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const FICHIER = path.join(process.cwd(), '.data', 'db.json');
const VIDE = { produits: [], commandes: [], reglages: {}, admins: [] };

let cache = null;
let ecriture = Promise.resolve();

async function lire() {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(FICHIER, 'utf8'));
    for (const k of Object.keys(VIDE)) cache[k] ??= structuredClone(VIDE[k]);
  } catch {
    cache = structuredClone(VIDE);
  }
  return cache;
}

// Les écritures sont sérialisées : deux requêtes simultanées ne peuvent pas
// s'écraser l'une l'autre.
function ecrire() {
  ecriture = ecriture.then(async () => {
    await fs.mkdir(path.dirname(FICHIER), { recursive: true });
    await fs.writeFile(FICHIER, JSON.stringify(cache, null, 2));
  });
  return ecriture;
}

const clone = (x) => (x === undefined ? x : structuredClone(x));

export function creerStoreJson() {
  return {
    type: 'fichier',

    produits: {
      async tous() {
        const db = await lire();
        return clone(db.produits);
      },
      async parSlug(slug) {
        const db = await lire();
        return clone(db.produits.find((p) => p.slug === slug));
      },
      async creer(doc) {
        const db = await lire();
        db.produits.unshift(doc);
        await ecrire();
        return clone(doc);
      },
      async modifier(slug, patch) {
        const db = await lire();
        const i = db.produits.findIndex((p) => p.slug === slug);
        if (i < 0) return null;
        db.produits[i] = { ...db.produits[i], ...patch, slug: db.produits[i].slug };
        await ecrire();
        return clone(db.produits[i]);
      },
      async supprimer(slug) {
        const db = await lire();
        const n = db.produits.length;
        db.produits = db.produits.filter((p) => p.slug !== slug);
        await ecrire();
        return db.produits.length < n;
      },
      async remplacerTout(liste) {
        const db = await lire();
        db.produits = liste;
        await ecrire();
        return liste.length;
      },
    },

    commandes: {
      async toutes() {
        const db = await lire();
        return clone(db.commandes);
      },
      async creer(doc) {
        const db = await lire();
        db.commandes.unshift(doc);
        await ecrire();
        return clone(doc);
      },
      async modifierStatut(ref, statut) {
        const db = await lire();
        const c = db.commandes.find((x) => x.ref === ref);
        if (!c) return null;
        c.statut = statut;
        await ecrire();
        return clone(c);
      },
    },

    reglages: {
      async lire() {
        const db = await lire();
        return clone(db.reglages);
      },
      async ecrire(patch) {
        const db = await lire();
        db.reglages = { ...db.reglages, ...patch };
        await ecrire();
        return clone(db.reglages);
      },
    },

    admins: {
      async parEmail(email) {
        const db = await lire();
        return clone(db.admins.find((a) => a.email === String(email).toLowerCase()));
      },
      async creer(doc) {
        const db = await lire();
        db.admins = db.admins.filter((a) => a.email !== doc.email);
        db.admins.push(doc);
        await ecrire();
        return clone(doc);
      },
    },
  };
}
