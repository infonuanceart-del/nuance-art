/**
 * Construit le catalogue de démonstration de Nuance Art.
 *
 * Source : The Metropolitan Museum of Art Collection API (Open Access, CC0).
 *   -> https://metmuseum.github.io/
 * Le script télécharge les visuels, les optimise en webp (grand + vignette),
 * déduit le format d'accrochage et la couleur dominante, ajoute la grille de
 * tailles / prix en dirhams, puis écrit data/catalogue.json.
 *
 * Ce JSON est la source du `npm run seed` qui remplit MongoDB (ou le store
 * fichier de secours). Relancer le script ne casse rien : il réécrit tout.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd());
const OUT_IMG = path.join(ROOT, 'public', 'media', 'art');
const OUT_DATA = path.join(ROOT, 'data');
const API = 'https://collectionapi.metmuseum.org/public/collection/v1';

// Départements du Met utilisés (voir /departments)
const DEP = {
  asie: 6,
  dessins_estampes: 9,
  peinture_euro: 11,
  islam: 14,
  photo: 19,
  moderne: 21,
  americain: 1,
};

// Un thème = une ou plusieurs requêtes Met + son identité côté boutique.
const THEMES = [
  {
    slug: 'abstrait', nom: 'Abstrait & géométrique', n: 8,
    requetes: [
      { q: 'geometric ornament', departmentId: DEP.islam },
      { q: 'tile pattern', departmentId: DEP.islam },
      { q: 'ornament design', departmentId: DEP.dessins_estampes },
      { q: 'abstract', departmentId: DEP.dessins_estampes },
    ],
  },
  {
    slug: 'calligraphie', nom: 'Calligraphie', n: 7,
    requetes: [
      { q: 'calligraphy', departmentId: DEP.islam },
      { q: 'folio album', departmentId: DEP.islam },
      { q: 'quran manuscript', departmentId: DEP.islam },
    ],
  },
  {
    slug: 'orient-maroc', nom: 'Orient & Maroc', n: 8,
    requetes: [
      { q: 'morocco' },
      { q: 'north africa', departmentId: DEP.peinture_euro },
      { q: 'orientalist', departmentId: DEP.peinture_euro },
      { q: 'tangier' },
      { q: 'algiers' },
    ],
  },
  {
    slug: 'nature-botanique', nom: 'Nature & botanique', n: 9,
    requetes: [
      { q: 'flowers', departmentId: DEP.peinture_euro, medium: 'Paintings' },
      { q: 'botanical', departmentId: DEP.dessins_estampes },
      { q: 'still life fruit', departmentId: DEP.peinture_euro },
      { q: 'garden', departmentId: DEP.peinture_euro },
    ],
  },
  {
    slug: 'villes-voyages', nom: 'Villes & voyages', n: 8,
    requetes: [
      { q: 'view of venice', departmentId: DEP.peinture_euro },
      { q: 'harbor', departmentId: DEP.peinture_euro },
      { q: 'city street', departmentId: DEP.americain },
      { q: 'seascape', departmentId: DEP.peinture_euro },
    ],
  },
  {
    slug: 'portraits', nom: 'Portraits', n: 7,
    requetes: [
      { q: 'portrait of a woman', departmentId: DEP.peinture_euro, medium: 'Paintings' },
      { q: 'portrait of a young', departmentId: DEP.peinture_euro },
      { q: 'portrait', departmentId: DEP.americain, medium: 'Paintings' },
    ],
  },
  {
    slug: 'chefs-doeuvre', nom: 'Chefs-d oeuvre', n: 8,
    requetes: [
      { q: 'painting', departmentId: DEP.peinture_euro, isHighlight: true },
      { q: 'landscape', departmentId: DEP.peinture_euro, isHighlight: true },
      { q: 'masterpiece', departmentId: DEP.americain, isHighlight: true },
    ],
  },
  {
    slug: 'japandi', nom: 'Japandi & estampes', n: 8,
    requetes: [
      { q: 'hiroshige', departmentId: DEP.asie },
      { q: 'hokusai', departmentId: DEP.asie },
      { q: 'woodblock print landscape', departmentId: DEP.asie },
      { q: 'mount fuji', departmentId: DEP.asie },
    ],
  },
  {
    slug: 'affiches', nom: 'Affiches & lithographies', n: 7,
    requetes: [
      { q: 'poster' },
      { q: 'lithograph advertisement' },
      { q: 'toulouse-lautrec' },
      { q: 'art nouveau print', departmentId: DEP.dessins_estampes },
    ],
  },
  {
    slug: 'noir-et-blanc', nom: 'Noir & blanc', n: 7,
    requetes: [
      { q: 'city', departmentId: DEP.photo },
      { q: 'architecture', departmentId: DEP.photo },
      { q: 'landscape', departmentId: DEP.photo },
      { q: 'engraving view', departmentId: DEP.dessins_estampes },
    ],
  },
  {
    slug: 'animaux', nom: 'Animaux', n: 6,
    requetes: [
      { q: 'birds of america', departmentId: DEP.dessins_estampes },
      { q: 'audubon' },
      { q: 'horse', departmentId: DEP.peinture_euro, medium: 'Paintings' },
      { q: 'bird study', departmentId: DEP.asie },
    ],
  },
  {
    slug: 'boheme-berbere', nom: 'Bohème & berbère', n: 6,
    requetes: [
      { q: 'carpet', departmentId: DEP.islam },
      { q: 'textile pattern', departmentId: DEP.islam },
      { q: 'embroidery', departmentId: DEP.islam },
    ],
  },
];

// Palette des filtres « couleur » de la boutique.
const PALETTE = [
  { slug: 'noir', rgb: [26, 26, 26] },
  { slug: 'blanc', rgb: [244, 244, 240] },
  { slug: 'gris', rgb: [140, 140, 140] },
  { slug: 'beige', rgb: [214, 195, 165] },
  { slug: 'or', rgb: [198, 158, 74] },
  { slug: 'terracotta', rgb: [178, 92, 62] },
  { slug: 'rouge', rgb: [163, 45, 42] },
  { slug: 'rose', rgb: [214, 150, 150] },
  { slug: 'vert', rgb: [86, 112, 84] },
  { slug: 'bleu', rgb: [58, 88, 130] },
  { slug: 'violet', rgb: [104, 80, 130] },
  { slug: 'marron', rgb: [96, 70, 50] },
];

const PIECES = [
  'salon-moderne', 'salon-marocain', 'entree', 'salle-a-manger',
  'chambre', 'chambre-enfant', 'bureau', 'hotel-restaurant', 'cabinet',
];

// Grilles de tailles + prix (MAD). Le prix suit la surface, arrondi commercialement.
const GRILLES = {
  portrait: [[30, 40, 290], [40, 60, 420], [50, 70, 590], [60, 90, 850], [80, 120, 1290]],
  paysage: [[40, 30, 290], [60, 40, 420], [70, 50, 590], [90, 60, 850], [120, 80, 1290]],
  carre: [[30, 30, 260], [40, 40, 390], [60, 60, 640], [80, 80, 990], [100, 100, 1450]],
};

// Classifications du Met qui se transposent réellement en tableau mural.
const OK_CLASS = /painting|print|drawing|photograph|textile|watercolor|poster|codices|calligraph/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

// Les titres du Met sont parfois interminables (estampes japonaises) : on garde
// la partie utile avant le premier separateur et on coupe proprement.
function nettoyerTitre(t) {
  let s = String(t).replace(/\s+/g, ' ').trim();
  s = s.replace(/^["“]|["”]$/g, '');
  const coupe = s.split(/,\s*(?:from|Folio|Plate|no\.|No\.)\s/)[0];
  // on renettoie APRES la coupe : le guillemet fermant se retrouve souvent en fin
  s = (coupe || s).trim().replace(/[,;:]$/, '').replace(/^["“]|["”]$/g, '').trim();
  if (s.length > 62) {
    const mots = s.slice(0, 62).split(' ');
    mots.pop();
    s = mots.join(' ');
  }
  return s;
}

function pickColor(r, g, b) {
  let best = PALETTE[0], bestD = Infinity;
  for (const c of PALETTE) {
    const d = 2 * (r - c.rgb[0]) ** 2 + 4 * (g - c.rgb[1]) ** 2 + 3 * (b - c.rgb[2]) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best.slug;
}

async function jget(url, essais = 3) {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch { /* on retente */ }
    await sleep(400 * (i + 1));
  }
  return null;
}

async function chercher(req) {
  const url = new URL(API + '/search');
  url.searchParams.set('hasImages', 'true');
  for (const [k, v] of Object.entries(req)) url.searchParams.set(k, String(v));
  const j = await jget(url.toString());
  return j && Array.isArray(j.objectIDs) ? j.objectIDs : [];
}

async function main() {
  await fs.mkdir(OUT_IMG, { recursive: true });
  await fs.mkdir(OUT_DATA, { recursive: true });

  const produits = [];
  const vusId = new Set();
  const vusSlug = new Set();
  const vusTitre = new Set();

  for (const theme of THEMES) {
    // on entrelace les résultats des différentes requêtes du thème pour varier
    const listes = [];
    for (const req of theme.requetes) listes.push(await chercher(req));
    const ids = [];
    for (let i = 0; i < 80; i++) for (const l of listes) if (l[i] !== undefined) ids.push(l[i]);

    let gardes = 0;
    for (const id of ids) {
      if (gardes >= theme.n) break;
      if (vusId.has(id)) continue;
      vusId.add(id);

      const o = await jget(API + '/objects/' + id);
      if (!o || !o.isPublicDomain || !o.primaryImage) continue;
      if (!OK_CLASS.test(o.classification || '') && !OK_CLASS.test(o.objectName || '')) continue;
      if (!o.title || o.title.length < 3) continue;
      const titre = nettoyerTitre(o.title);
      if (vusTitre.has(titre.toLowerCase())) continue;

      let slug = slugify(titre + '-' + id);
      if (!slug || vusSlug.has(slug)) slug = slug + '-' + id;

      try {
        const res = await fetch(o.primaryImage);
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());

        const img = sharp(buf);
        const meta = await img.metadata();
        if (!meta.width || !meta.height || meta.width < 640 || meta.height < 640) continue;

        const ratio = meta.width / meta.height;
        if (ratio > 2.4 || ratio < 0.42) continue; // formats inaccrochables

        await img.clone().resize({ width: 1400, withoutEnlargement: true })
          .webp({ quality: 82 }).toFile(path.join(OUT_IMG, slug + '.webp'));
        await img.clone().resize({ width: 520, withoutEnlargement: true })
          .webp({ quality: 74 }).toFile(path.join(OUT_IMG, slug + '-thumb.webp'));

        // La couleur dominante renvoie trop souvent le noir des fonds anciens :
        // on melange dominante et moyenne generale pour coller a l'ambiance percue.
        const st = await img.clone().stats();
        const moy = st.channels.slice(0, 3).map((c) => c.mean);
        const mix = (a, b) => Math.round(a * 0.45 + b * 0.55);
        const teinte = {
          r: mix(st.dominant.r, moy[0]),
          g: mix(st.dominant.g, moy[1]),
          b: mix(st.dominant.b, moy[2]),
        };
        vusSlug.add(slug);
        gardes++;
        produits.push({
          slug,
          titre,
          artiste: (o.artistDisplayName || '').trim() || 'Artiste anonyme',
          epoque: (o.objectDate || '').trim(),
          technique: (o.medium || '').trim(),
          theme: theme.slug,
          format: ratio > 1.15 ? 'paysage' : ratio < 0.87 ? 'portrait' : 'carre',
          couleur: pickColor(teinte.r, teinte.g, teinte.b),
          ratio: Number(ratio.toFixed(4)),
          image: '/media/art/' + slug + '.webp',
          thumb: '/media/art/' + slug + '-thumb.webp',
          source: o.objectURL || '',
        });
        vusTitre.add(titre.toLowerCase());
        console.log(theme.slug + '  ' + gardes + '/' + theme.n + '  ' + titre.slice(0, 46));
      } catch (e) {
        console.warn('  x ' + slug + ' : ' + e.message);
      }
      await sleep(60);
    }
    if (gardes < theme.n) console.warn('  ! ' + theme.slug + ' : ' + gardes + '/' + theme.n);
  }

  // enrichissement commercial : tailles, prix, badges, pièces conseillées
  const catalogue = produits.map((p, i) => {
    const tailles = GRILLES[p.format].map(([l, h, prix]) => ({ l, h, prix, ref: l + 'x' + h }));
    return {
      ...p,
      tailles,
      prixMin: tailles[0].prix,
      pieces: [...new Set([PIECES[i % PIECES.length], PIECES[(i * 3 + 2) % PIECES.length]])],
      nouveaute: i % 9 === 0,
      bestseller: i % 7 === 3,
      promo: i % 5 === 0 ? (i % 10 === 0 ? 40 : 25) : 0,
      note: 4.4 + ((i * 7) % 6) / 10,
      avis: 6 + ((i * 13) % 40),
    };
  });

  await fs.writeFile(
    path.join(OUT_DATA, 'catalogue.json'),
    JSON.stringify({ genere: new Date().toISOString(), produits: catalogue }, null, 2),
  );
  console.log('\n' + catalogue.length + ' oeuvres ecrites dans data/catalogue.json');
}

main();
