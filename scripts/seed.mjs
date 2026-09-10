/**
 * Injecte data/catalogue.json dans la base + crée le compte admin.
 *
 *   npm run seed
 *
 * Cible MongoDB si MONGODB_URI est renseigné, sinon écrit .data/db.json.
 * Le script est idempotent : il remplace le catalogue et réécrit l'admin.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const ROOT = process.cwd();

// charge .env.local puis .env sans dépendance externe
for (const f of ['.env.local', '.env']) {
  try {
    const txt = await fs.readFile(path.join(ROOT, f), 'utf8');
    for (const ligne of txt.split('\n')) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* fichier absent : on continue */ }
}

const AMBIANCES = {
  calligraphie: 'Le geste de la plume, l’encre et l’or : une présence calme, qui se lit autant qu’elle se regarde.',
  abstrait: 'La géométrie du zellige, transposée au mur : elle structure une pièce sans jamais l’alourdir.',
  'orient-maroc': 'La lumière du Sud, les murs ocre et les patios : une pièce qui réchauffe immédiatement un intérieur.',
  'boheme-berbere': 'Les motifs du tissage traditionnel, transposés au mur : chaleur, matière et artisanat.',
  enluminure: 'L’or bruni et le lapis des manuscrits anciens, à hauteur de regard dans une entrée ou un salon.',
  andalou: 'De Grenade à Fès : la mémoire andalouse, ses lustres et ses entrelacs, dans un intérieur contemporain.',
  'nature-botanique': 'Le végétal apaise une pièce. Cette planche apporte de la fraîcheur sans surcharger la décoration.',
  'villes-voyages': 'Une fenêtre ouverte sur la médina, qui donne de la profondeur à un mur trop plat.',
  'chefs-doeuvre': 'Une pièce majeure des collections islamiques, imprimée en très haute définition pour retrouver la matière de l’original.',
  animaux: 'Une planche animalière au dessin précis, valeur sûre en chambre d’enfant comme en bureau.',
  portraits: 'Un regard qui tient le mur à lui seul et donne du caractère à une entrée ou un bureau.',
  'noir-et-blanc': 'Le graphisme du noir et blanc s’accorde avec tout : bois clair, métal noir, murs colorés.',
};

const FINITION =
  'Impression pigmentaire douze couleurs sur toile premium ou papier mat 250 g, encres résistantes ' +
  'à la lumière, châssis en bois massif monté à la main dans notre atelier de Casablanca. ' +
  'Système d’accroche posé et niveau à bulle fournis.';

function description(p) {
  const ambiance = AMBIANCES[p.theme] || '';
  const signature =
    p.artiste && p.artiste !== 'Artiste anonyme'
      ? `D’après ${p.artiste}${p.epoque ? ` (${p.epoque})` : ''}.`
      : p.epoque
        ? `Œuvre anonyme, ${p.epoque}.`
        : '';
  const original =
    p.titreOriginal && p.titreOriginal !== p.titre
      ? `Titre original : « ${p.titreOriginal} ».`
      : '';
  return [`${p.titre}. ${signature} ${original}`.replace(/\s+/g, ' ').trim(), ambiance, FINITION]
    .filter(Boolean)
    .join('\n\n');
}

const REGLAGES = {
  promoActive: true,
  promoTitre: 'Ventes flash — jusqu’à -60 %',
  promoTexte: 'Sur une sélection d’œuvres signées. Cadre offert dès 900 DH d’achat.',
  // la vente se termine dans 6 jours : la page promotions affiche le compte à rebours
  promoFin: new Date(Date.now() + 6 * 864e5).toISOString(),
  promoCode: 'NUANCE10',
  telephone: '05 22 00 00 00',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '212600000000',
  email: 'contact@nuanceart.ma',
  adresse: '12, rue des Arts — Quartier Gauthier, Casablanca',
};

async function main() {
  const brut = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'catalogue.json'), 'utf8'));

  // Titres français relus à la main (data/titres_fr.json) : les musées publient
  // en anglais, la boutique s'adresse à des clients francophones.
  let titresFr = {};
  try {
    titresFr = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'titres_fr.json'), 'utf8'));
  } catch { console.warn('titres_fr.json absent : on garde les titres d’origine.'); }

  const produits = brut.produits.map((p, i) => {
    const enrichi = { ...p, titreOriginal: p.titre, titre: titresFr[p.slug] || p.titre };
    return { ...enrichi, description: description(enrichi), actif: true, ordre: i };
  });

  const email = (process.env.ADMIN_EMAIL || 'admin@nuanceart.ma').toLowerCase();

  // Pas de mot de passe par defaut en dur : ce depot est public, une valeur
  // ecrite ici serait connue de tous ceux qui deploieraient sans y toucher.
  // Sans ADMIN_PASSWORD, on en tire un au hasard et on l'affiche une fois.
  const motDePasse = process.env.ADMIN_PASSWORD
    || randomBytes(9).toString('base64url');

  const admin = {
    email,
    nom: 'Administrateur',
    hash: bcrypt.hashSync(motDePasse, 10),
  };

  const uri = (process.env.MONGODB_URI || '').trim();

  if (uri) {
    const { default: mongoose } = await import('mongoose');
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'nuanceart' });
    const db = mongoose.connection.db;
    await db.collection('produits').deleteMany({});
    await db.collection('produits').insertMany(produits);
    await db.collection('admins').updateOne({ email }, { $set: admin }, { upsert: true });
    for (const [cle, valeur] of Object.entries(REGLAGES)) {
      await db.collection('reglages').updateOne({ cle }, { $set: { cle, valeur } }, { upsert: true });
    }
    await mongoose.disconnect();
    console.log(`MongoDB : ${produits.length} œuvres, 1 admin, ${Object.keys(REGLAGES).length} réglages.`);
  } else {
    const fichier = path.join(ROOT, '.data', 'db.json');
    let db = { produits: [], commandes: [], reglages: {}, admins: [] };
    try { db = { ...db, ...JSON.parse(await fs.readFile(fichier, 'utf8')) }; } catch { /* première fois */ }
    db.produits = produits;
    db.reglages = { ...db.reglages, ...REGLAGES };
    db.admins = [...(db.admins || []).filter((a) => a.email !== email), admin];
    await fs.mkdir(path.dirname(fichier), { recursive: true });
    await fs.writeFile(fichier, JSON.stringify(db, null, 2));
    console.log(`Fichier .data/db.json : ${produits.length} œuvres, 1 admin.`);
  }
  // On n'affiche le mot de passe que lorsqu'il vient d'etre tire au hasard :
  // sinon il finirait dans un journal de build ou un copier-coller.
  if (process.env.ADMIN_PASSWORD) {
    console.log(`Compte admin : ${email} (mot de passe repris de ADMIN_PASSWORD).`);
  } else {
    console.log(`Compte admin : ${email} / ${motDePasse}`);
    console.log('Mot de passe tire au hasard : notez-le, ou fixez ADMIN_PASSWORD dans .env.local.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
