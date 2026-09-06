/**
 * Récupère des photos d'intérieur libres (Wikimedia Commons, licence CC0)
 * pour servir de « pièces d'exemple » dans le studio d'essayage.
 *
 * Une bonne pièce d'exemple doit avoir un vrai pan de mur vide : on note donc
 * chaque candidate (uniformité + clarté de la bande haute de l'image) et on
 * garde les meilleures, au lieu de prendre la première trouvée.
 *
 *   node scripts/build_pieces.mjs
 *   -> public/media/pieces/*.webp + data/pieces.json
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.join(process.cwd(), 'public', 'media', 'pieces');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'NuanceArtDemo/1.0 (contact@nuanceart.ma)';
const GARDE = 12;

// Les fichiers « (Unsplash) » de Commons sont en CC0 et montrent de vrais
// intérieurs contemporains.
// La recherche Commons est très littérale : deux mots ramènent des dizaines de
// résultats là où une phrase complète n'en ramène qu'un seul.
const REQUETES = [
  'interior Unsplash',
  'room Unsplash',
  'living room Unsplash',
  'bedroom Unsplash',
  'apartment Unsplash',
  'sofa Unsplash',
];

const NOMS = [
  'Salon clair', 'Séjour contemporain', 'Coin canapé', 'Chambre',
  'Salle à manger', 'Bureau', 'Entrée', 'Studio',
];

async function chercher(q) {
  const u = new URL(API);
  u.searchParams.set('action', 'query');
  u.searchParams.set('format', 'json');
  u.searchParams.set('generator', 'search');
  u.searchParams.set('gsrsearch', `filetype:bitmap ${q}`);
  u.searchParams.set('gsrnamespace', '6');
  u.searchParams.set('gsrlimit', '50');
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'url|extmetadata|size');
  u.searchParams.set('iiurlwidth', '1800');
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('commons ' + r.status);
  const j = await r.json();
  return Object.values(j?.query?.pages || {});
}

/**
 * Note « accrochabilité » : on regarde la bande horizontale du haut, là où se
 * trouve normalement le mur. Un mur = clair et peu texturé.
 */
async function noterMur(buf) {
  const img = sharp(buf);
  const m = await img.metadata();
  const bande = await img
    .extract({
      left: Math.round(m.width * 0.15),
      top: Math.round(m.height * 0.05),
      width: Math.round(m.width * 0.7),
      height: Math.round(m.height * 0.4),
    })
    .stats();
  const canaux = bande.channels.slice(0, 3);
  const clarte = canaux.reduce((s, c) => s + c.mean, 0) / 3;
  const bruit = canaux.reduce((s, c) => s + c.stdev, 0) / 3;
  // Un mur est clair, peu texturé et peu saturé : un canapé rose ou un mur de
  // bois brut remontent sinon en tête du classement.
  const mx = Math.max(...canaux.map((c) => c.mean));
  const mn = Math.min(...canaux.map((c) => c.mean));
  const saturation = mx > 0 ? ((mx - mn) / mx) * 255 : 0;
  const note = clarte - bruit * 2.1 - saturation * 2.4;
  return { note, clarte, bruit, saturation, largeur: m.width, hauteur: m.height };
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });

  const vus = new Set();
  const candidats = [];

  for (const q of REQUETES) {
    let pages = [];
    try { pages = await chercher(q); } catch (e) { console.warn('!', q, e.message); continue; }

    let pris = 0;
    for (const p of pages) {
      if (pris >= 14) break;
      const info = p.imageinfo?.[0];
      if (!info || vus.has(p.title)) continue;
      vus.add(p.title);
      const licence = info.extmetadata?.LicenseShortName?.value || '';
      if (!/cc0/i.test(licence)) continue;
      if (!info.thumburl || info.width < 1200) continue;
      if (info.width / info.height < 1.2) continue; // on veut du paysage
      pris++;

      try {
        const res = await fetch(info.thumburl, { headers: { 'User-Agent': UA } });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const score = await noterMur(buf);
        if (score.largeur < 1100) continue;
        candidats.push({ titre: p.title, buf, score, licence, source: info.descriptionurl || '' });
        console.log(`  ${Math.round(score.note).toString().padStart(4)}  ${p.title.slice(6, 56)}`);
      } catch (e) {
        console.warn('  x', e.message);
      }
    }
  }

  candidats.sort((a, b) => b.score.note - a.score.note);
  const retenus = candidats.slice(0, GARDE);
  const pieces = [];

  for (const [i, c] of retenus.entries()) {
    const cle = 'piece-' + (i + 1);
    const img = sharp(c.buf);
    const m = await img.metadata();
    await img.resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 })
      .toFile(path.join(OUT, cle + '.webp'));
    pieces.push({
      cle,
      nom: NOMS[i] || 'Pièce ' + (i + 1),
      image: '/media/pieces/' + cle + '.webp',
      ratio: Number((m.width / m.height).toFixed(4)),
      licence: c.licence,
      source: c.source,
    });
    console.log('GARDE', cle, '<-', c.titre.slice(6, 60));
  }

  await fs.writeFile(
    path.join(process.cwd(), 'data', 'pieces.json'),
    JSON.stringify({ pieces }, null, 2),
  );
  console.log('\n' + pieces.length + ' pieces ecrites');
}

main();
