/**
 * Passage des 12 themes d'origine aux 5 categories demandees par le client.
 *
 * La table ci-dessous est la seule source de verite du reclassement : elle
 * sert au fichier de semence (data/catalogue.json) comme a la base de
 * production, pour qu'aucune oeuvre ne soit rangee differemment selon
 * l'endroit ou on la regarde.
 *
 *   node scripts/migrer-themes.mjs            -> simulation, n'ecrit rien
 *   node scripts/migrer-themes.mjs --semence  -> reecrit data/catalogue.json
 *   node scripts/migrer-themes.mjs --base     -> reecrit MongoDB
 */
import fs from 'node:fs/promises';
import path from 'node:path';

export const RECLASSEMENT = {
  // Art islamique : la lettre, l'or et les pieces majeures.
  calligraphie: 'art-islamique',
  enluminure: 'art-islamique',
  'chefs-doeuvre': 'art-islamique',

  // Heritage marocain : le Maroc, son artisanat et son aire andalouse.
  'boheme-berbere': 'heritage-marocain',
  'orient-maroc': 'heritage-marocain',
  'villes-voyages': 'heritage-marocain',
  andalou: 'heritage-marocain',

  // Nature & paysage : le vegetal et le vivant.
  'nature-botanique': 'nature-paysage',
  animaux: 'nature-paysage',

  // Art abstrait : la geometrie sans sujet.
  abstrait: 'art-abstrait',

  // Art contemporain : les pieces graphiques. Reserve exprimee dans le README
  // de la migration — ces oeuvres sont historiques, pas contemporaines.
  'noir-et-blanc': 'art-contemporain',
  portraits: 'art-contemporain',
};

export const nouveauTheme = (ancien) => RECLASSEMENT[ancien] || ancien;

function compter(produits, champ = 'theme') {
  const c = {};
  for (const p of produits) c[p[champ]] = (c[p[champ]] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}

function rapport(produits) {
  const avant = compter(produits);
  const apres = compter(produits.map((p) => ({ theme: nouveauTheme(p.theme) })));
  const inconnus = produits.filter((p) => !RECLASSEMENT[p.theme]);

  console.log('\nAvant :');
  for (const [t, n] of avant) console.log('  ' + String(n).padStart(3) + '  ' + t);
  console.log('\nApres :');
  for (const [t, n] of apres) console.log('  ' + String(n).padStart(3) + '  ' + t);
  console.log('\nTotal : ' + produits.length + ' oeuvres');
  if (inconnus.length) {
    console.log('\n! ' + inconnus.length + ' oeuvre(s) sans regle de reclassement, laissees telles quelles :');
    for (const p of inconnus.slice(0, 10)) console.log('    ' + p.theme + '  ' + p.slug);
  }
  return inconnus;
}

const RACINE = process.cwd();
const SEMENCE = path.join(RACINE, 'data', 'catalogue.json');

async function chargerEnv() {
  for (const f of ['.env.local', '.env']) {
    try {
      const txt = await fs.readFile(path.join(RACINE, f), 'utf8');
      for (const ligne of txt.split('\n')) {
        const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    } catch { /* fichier absent */ }
  }
}

async function semence(ecrire) {
  const brut = JSON.parse(await fs.readFile(SEMENCE, 'utf8'));
  const produits = brut.produits || [];
  console.log('=== data/catalogue.json ===');
  rapport(produits);

  if (!ecrire) return;
  for (const p of produits) p.theme = nouveauTheme(p.theme);
  brut.genere = new Date().toISOString();
  await fs.writeFile(SEMENCE, JSON.stringify(brut, null, 2) + '\n', 'utf8');
  console.log('\ndata/catalogue.json reecrit.');
}

async function base(ecrire) {
  await chargerEnv();
  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) {
    console.error('MONGODB_URI absent : impossible de toucher la base.');
    process.exitCode = 1;
    return;
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'nuanceart',
    serverSelectionTimeoutMS: 15000,
  });
  const Produit = mongoose.connection.collection('produits');

  const produits = await Produit.find({}, { projection: { slug: 1, theme: 1 } }).toArray();
  console.log('=== MongoDB (' + (process.env.MONGODB_DB || 'nuanceart') + ') ===');
  rapport(produits);

  if (ecrire) {
    // Le reclassement fusionne plusieurs themes en un seul : une fois ecrit,
    // la base ne permet plus de savoir si une oeuvre « art-islamique » venait
    // de la calligraphie ou de l'enluminure. On garde donc la photographie de
    // l'etat d'avant, seul chemin de retour possible.
    const avant = Object.fromEntries(produits.map((p) => [p.slug, p.theme]));
    await fs.writeFile(
      path.join(RACINE, 'data', 'themes-avant-migration.json'),
      JSON.stringify({ pris: new Date().toISOString(), themes: avant }, null, 2) + '\n',
      'utf8',
    );
    console.log('\nEtat d avant sauvegarde dans data/themes-avant-migration.json');

    let n = 0;
    for (const [ancien, nouveau] of Object.entries(RECLASSEMENT)) {
      const r = await Produit.updateMany({ theme: ancien }, { $set: { theme: nouveau } });
      if (r.modifiedCount) {
        console.log('  ' + String(r.modifiedCount).padStart(3) + '  ' + ancien + ' -> ' + nouveau);
        n += r.modifiedCount;
      }
    }
    console.log('\n' + n + ' oeuvre(s) reclassee(s) en base.');
  }

  await mongoose.disconnect();
}

/** Retour en arriere, oeuvre par oeuvre, depuis la sauvegarde. */
async function retour() {
  await chargerEnv();
  const uri = (process.env.MONGODB_URI || '').trim();
  const brut = JSON.parse(
    await fs.readFile(path.join(RACINE, 'data', 'themes-avant-migration.json'), 'utf8'),
  );

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'nuanceart',
    serverSelectionTimeoutMS: 15000,
  });
  const Produit = mongoose.connection.collection('produits');

  let n = 0;
  for (const [slug, theme] of Object.entries(brut.themes)) {
    const r = await Produit.updateOne({ slug }, { $set: { theme } });
    n += r.modifiedCount;
  }
  console.log(n + ' oeuvre(s) remises dans leur theme du ' + brut.pris + '.');
  await mongoose.disconnect();
}

const args = process.argv.slice(2);
const versSemence = args.includes('--semence');
const versBase = args.includes('--base');

if (!versSemence && !versBase) console.log('SIMULATION — aucune ecriture. Ajoutez --semence ou --base.');
if (args.includes('--retour')) {
  await retour();
} else {
  await semence(versSemence);
  if (versBase || args.includes('--voir-base')) await base(versBase);
}
