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
//
// La boutique s'adresse à une clientèle marocaine : le catalogue est donc bâti
// sur l'art traditionnel du monde musulman et du Maghreb — département islamique
// du Met (14) pour l'essentiel, complété par les peintres voyageurs pour le volet
// orientaliste. Aucune requête ne vise plus la peinture européenne de salon.
const THEMES = [
  {
    slug: 'art-abstrait', nom: 'Art abstrait', n: 15,
    // Le seul « abstrait » libre de droits est l'abstraction geometrique de
    // l'art islamique : panneaux de carreaux, entrelacs, arabesques. Le Met
    // les classe « Ceramics-Tiles » ou « Woodwork », d'ou la classification
    // ouverte ; le motif exige en echange un decor, pas un objet.
    classes: /tile|ceramic|woodwork|panel|textile|ornament|painting|drawing|print/i,
    motif: /geometric|interlac|arabesque|star|polygon|ornament|pattern|lattice|mosaic|zellij|zillij|tile panel|strapwork|medallion|scroll/i,
    requetes: [
      { q: 'geometric tile panel', departmentId: DEP.islam },
      { q: 'star cross tile', departmentId: DEP.islam },
      { q: 'arabesque ornament panel', departmentId: DEP.islam },
      { q: 'interlace pattern design', departmentId: DEP.islam },
    ],
  },
  {
    slug: 'art-contemporain', nom: 'Art contemporain', n: 18,
    // La collection ouverte du Met s'arrete aux annees 1930 : les modernes du
    // domaine public (post-impressionnistes surtout) sont ce qu'elle offre de
    // plus proche d'un accrochage contemporain.
    motif: /gogh|monet|manet|degas|renoir|sisley|pissarro|cezanne|gauguin|morisot|caillebotte|seurat|signac|toulouse|bonnard|vuillard|redon|rousseau/i,
    requetes: [
      { q: 'Vincent van Gogh', medium: 'Paintings' },
      { q: 'Paul Gauguin Cezanne', medium: 'Paintings' },
      { q: 'Claude Monet', medium: 'Paintings' },
      { q: 'Edgar Degas Renoir', medium: 'Paintings' },
      { q: 'Seurat Signac Pissarro', medium: 'Paintings' },
    ],
  },
  {
    slug: 'heritage-marocain', nom: 'Héritage marocain', n: 20,
    // Delacroix et Gerome ont peint bien autre chose que le Maghreb : le motif
    // exige que le sujet soit vraiment oriental, sinon « L'Enlevement de
    // Rebecca » se retrouverait vendu comme un tableau marocain.
    motif: /arab|moor|morocc|algier|tangier|cairo|egypt|nubian|mosque|orient|bashi|turk|harem|odalisque|desert|caravan|sultan|constantine|sahara|almeh|fellah|dervish|damascus|jerusalem/i,
    requetes: [
      { q: 'Delacroix Arab Morocco', medium: 'Paintings' },
      { q: 'Orientalist Arab', departmentId: DEP.peinture_euro },
      { q: 'Gerome Egypt Cairo mosque', medium: 'Paintings' },
      { q: 'Morocco', departmentId: DEP.peinture_euro },
      { q: 'Fromentin Algeria', medium: 'Paintings' },
    ],
  },
  {
    slug: 'nature-paysage', nom: 'Nature & paysage', n: 23,
    // Paysages peints et estampes japonaises se rejoignent ici : Hiroshige
    // tient le mur aussi bien qu'un paysage a l'huile, et varie les formats.
    motif: /landscape|garden|flower|bouquet|tree|river|mountain|sea|coast|forest|field|meadow|valley|lake|orchard|olive|iris|rose|poppy|snow|rain|fuji|tokaido|hiroshige|hokusai/i,
    requetes: [
      { q: 'landscape', medium: 'Paintings' },
      { q: 'garden', medium: 'Paintings' },
      { q: 'flowers bouquet', medium: 'Paintings' },
      { q: 'Hiroshige landscape', departmentId: DEP.asie },
      { q: 'Hokusai Fuji wave', departmentId: DEP.asie },
    ],
  },
  {
    slug: 'art-islamique', nom: 'Art islamique', n: 15,
    // Le departement islamique classe ses peintures en « Codices » ou
    // « Manuscripts » : la regle murale par defaut les rejetterait toutes. On
    // ouvre donc la classification, et on exige en echange une miniature
    // figurative — pas une page de texte nu.
    classes: /codices|manuscript|folio|painting|calligraph|album|illustrat/i,
    motif: /shahnama|khamsa|miniature|prince|hunt|court|garden|falcon|horse|battle|majnun|layla|bahram|album leaf|illustrated|painting/i,
    requetes: [
      { q: 'Shahnama illustrated folio', departmentId: DEP.islam },
      { q: 'Mughal miniature painting', departmentId: DEP.islam },
      { q: 'Persian painting album leaf', departmentId: DEP.islam },
      { q: 'Khamsa Nizami illustrated', departmentId: DEP.islam },
    ],
  },
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
const OK_CLASS = /painting|print|drawing|photograph|textile|watercolor|codices|calligraph|manuscript|folio|tile/i;

// Le département islamique est surtout fait d'objets : une aiguière ou un
// astrolabe passent la classification (« Ceramics », « Metalwork ») mais ne
// font pas un tableau. On les écarte sur le nom de l'objet.
// La boutique s'adresse a des foyers marocains : on ecarte l'iconographie
// religieuse d'autres cultes, les divinites greco-romaines et les nus, qui
// n'ont pas leur place au mur d'un salon a Casablanca.
const HORS_SUJET = new RegExp(
  'shiva|vishnu|krishna|devi|ganesha|hindu|jain|lohan|buddha|bodhisattva|tantric'
  + '|christ|jesus|virgin mary|madonna|nativity|crucifix|apostle|evangelist|bishop'
  + '|cope|chasuble|altar|baptism|annunciation|pieta|hail mary|herodias|salome'
  + '|venus|diana|apollo|bacchus|jupiter|cupid|goddess|nymph|deity'
  + '|nude|naked|bather|odalisque',
  'i',
);

const HORS_MUR = new RegExp(
  'bowl|jar|dish|ewer|bottle|vase|cup|plate|jug|flask|lamp|censer|candlestick|casket'
  + '|beaker|basin|pitcher|incense|mirror|helmet|sword|dagger|coin|ring|pendant'
  + '|necklace|bracelet|earring|astrolabe|chess|hilt|spoon|key|lock|tray|bucket'
  + '|stand|jointed|fragment of a vessel|tombstone|capital|column',
  'i',
);

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

/**
 * L'API de recherche du Met est sensible a l'ORDRE des parametres : `q` doit
 * etre pose en dernier, sinon les filtres sont appliques a la place de la
 * recherche et le nombre de resultats s'effondre (9 au lieu de 587 pour
 * « carpet » dans le departement islamique). D'ou la construction en deux temps.
 */
async function chercher(req) {
  const url = new URL(API + '/search');
  url.searchParams.set('hasImages', 'true');
  for (const [k, v] of Object.entries(req)) if (k !== 'q') url.searchParams.set(k, String(v));
  url.searchParams.set('q', String(req.q));
  const j = await jget(url.toString());
  return j && Array.isArray(j.objectIDs) ? j.objectIDs : [];
}

/**
 * Execute `tache` sur chaque element, `largeur` en parallele.
 *
 * Le script passe son temps a attendre le Met — quelques centaines de
 * millisecondes par fiche, plusieurs secondes par image. En sequentiel il
 * consommait trois secondes de processeur pour dix minutes d'horloge : tout le
 * reste etait de l'attente. Les requetes sont donc menees de front, en nombre
 * modere pour ne pas se faire fermer la porte.
 */
async function enParallele(elements, largeur, tache) {
  const resultats = new Array(elements.length);
  let curseur = 0;
  const ouvriers = Array.from({ length: Math.min(largeur, elements.length) }, async () => {
    while (curseur < elements.length) {
      const i = curseur++;
      resultats[i] = await tache(elements[i], i);
    }
  });
  await Promise.all(ouvriers);
  return resultats;
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
    for (let i = 0; i < 220; i++) for (const l of listes) if (l[i] !== undefined) ids.push(l[i]);

    // --- 1. les fiches, menees de front : c'est de l'attente reseau pure ---
    // On en interroge un multiple de la cible, sachant qu'une bonne part sera
    // ecartee par les filtres, et on s'arrete des qu'on en a largement assez.
    const aTester = ids.filter((id) => !vusId.has(id)).slice(0, theme.n * 8);
    for (const id of aTester) vusId.add(id);

    const fiches = await enParallele(aTester, 8, (id) => jget(API + '/objects/' + id));

    // --- 2. le tri, en serie : titres et slugs se dedupliquent l'un l'autre ---
    const classes = theme.classes || OK_CLASS;
    const retenus = [];
    for (const o of fiches) {
      if (retenus.length >= theme.n) break;
      if (!o || !o.isPublicDomain || !o.primaryImage) continue;
      if (!classes.test(o.classification || '') && !classes.test(o.objectName || '')) continue;
      if (HORS_MUR.test(o.objectName || '')) continue;

      // Le sujet reel de l'oeuvre, tel qu'il sera lu par un client marocain.
      const sujet = [o.title, o.objectName, o.classification, o.medium, o.culture, o.period]
        .filter(Boolean).join(' ');
      if (HORS_SUJET.test(sujet)) continue;

      // Le nom de l'auteur n'entre que dans le test du theme, jamais dans les
      // exclusions : une categorie peut se definir par ses peintres (« Van Gogh,
      // Monet, Degas ») alors qu'un patronyme ne doit jamais faire ecarter une
      // oeuvre — un « Christian » n'est pas une scene de la Nativite.
      const sujetEtAuteur = sujet + ' ' + (o.artistDisplayName || '');
      // La recherche du Met reste approximative : on exige que l'oeuvre parle
      // vraiment du theme sous lequel on s'apprete a la vendre.
      if (theme.motif && !theme.motif.test(sujetEtAuteur)) continue;
      if (!o.title || o.title.length < 3) continue;
      let titre = nettoyerTitre(o.title);

      // Le Met nomme des centaines de pieces a l'identique — « Tile Panel »
      // huit fois, « Star-Shaped Tile » sept fois. Les ecarter comme doublons
      // affamait la categorie ; les vendre sous le meme nom serait pire. On
      // les distingue donc par leur origine, ce qui fait au passage un
      // meilleur intitule de fiche : « Panneau de carreaux — Iran, XIVe s. ».
      if (vusTitre.has(titre.toLowerCase())) {
        const precision = [o.culture, o.objectDate].filter(Boolean).join(', ').trim();
        if (!precision) continue;
        titre = `${titre} — ${precision}`;
        if (vusTitre.has(titre.toLowerCase())) continue;
      }
      vusTitre.add(titre.toLowerCase());

      let slug = slugify(titre + '-' + o.objectID);
      if (!slug || vusSlug.has(slug)) slug = slug + '-' + o.objectID;
      vusSlug.add(slug);

      retenus.push({ o, titre, slug });
    }

    // --- 3. les images, quatre de front : chacune pese plusieurs megaoctets ---
    const traites = await enParallele(retenus, 4, async ({ o, titre, slug }) => {
      try {
        // Les masters du Met pesent plusieurs megaoctets et leur serveur est
        // lent : « Arabs Crossing a Ford » demande 24 secondes. Sans delai
        // explicite ni reprise, la connexion est coupee (« terminated ») et
        // toute une categorie peut finir vide. On patiente, et on insiste.
        let buf = null;
        for (let essai = 0; essai < 3 && !buf; essai++) {
          try {
            const res = await fetch(o.primaryImage, { signal: AbortSignal.timeout(90000) });
            if (!res.ok) return null;
            buf = Buffer.from(await res.arrayBuffer());
          } catch (e) {
            if (essai === 2) throw e;
            await sleep(1500 * (essai + 1));
          }
        }
        if (!buf) return null;

        const img = sharp(buf);
        const meta = await img.metadata();
        if (!meta.width || !meta.height || meta.width < 640 || meta.height < 640) return null;

        const ratio = meta.width / meta.height;
        if (ratio > 2.4 || ratio < 0.42) return null; // formats inaccrochables

        await img.clone().resize({ width: 1400, withoutEnlargement: true })
          .webp({ quality: 82 }).toFile(path.join(OUT_IMG, slug + '.webp'));
        await img.clone().resize({ width: 520, withoutEnlargement: true })
          .webp({ quality: 74 }).toFile(path.join(OUT_IMG, slug + '-thumb.webp'));


        return { o, titre, slug, ratio };
      } catch (e) {
        console.warn('  x ' + slug + ' : ' + e.message);
        return null;
      }
    });

    let gardes = 0;
    for (const t of traites) {
      if (!t) continue;
        const { o, titre, slug, ratio } = t;
      gardes++;
      produits.push({
        slug,
        titre,
        artiste: (o.artistDisplayName || '').trim() || 'Artiste anonyme',
        epoque: (o.objectDate || '').trim(),
        technique: (o.medium || '').trim(),
        theme: theme.slug,
        format: ratio > 1.15 ? 'paysage' : ratio < 0.87 ? 'portrait' : 'carre',
        ratio: Number(ratio.toFixed(4)),
        image: '/media/art/' + slug + '.webp',
        thumb: '/media/art/' + slug + '-thumb.webp',
        source: o.objectURL || '',
      });
      console.log(theme.slug + '  ' + gardes + '/' + theme.n + '  ' + titre.slice(0, 46));
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
