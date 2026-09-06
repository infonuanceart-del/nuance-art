/**
 * Instantane du catalogue, pris avant la construction de la vitrine.
 *
 * La vitrine est exportee en statique : elle n'interroge plus la base au
 * moment du rendu. Ce script va donc chercher une fois le catalogue et les
 * reglages sur l'API, et les depose dans data/snapshot.json, que les pages
 * lisent a la construction.
 *
 * Consequence a assumer : le site en ligne ne change QUE lorsqu'on le
 * reconstruit et le redeploie. Une modification faite dans l'admin n'apparait
 * pas toute seule.
 *
 * Lance automatiquement par `npm run build` (script prebuild).
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const RACINE = process.cwd();

for (const f of ['.env.local', '.env']) {
  try {
    const txt = await fs.readFile(path.join(RACINE, f), 'utf8');
    for (const ligne of txt.split('\n')) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* fichier absent */ }
}

const API = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const CIBLE = path.join(RACINE, 'data', 'snapshot.json');

if (!API) {
  console.error('NEXT_PUBLIC_API_URL est absent : impossible de prendre l instantane.');
  process.exit(1);
}

async function ancien() {
  try {
    const brut = JSON.parse(await fs.readFile(CIBLE, 'utf8'));
    return brut?.produits?.length ? brut : null;
  } catch {
    return null;
  }
}

try {
  console.log(`Instantane depuis ${API}/api/catalogue …`);

  // Le plan gratuit de Render s'endort : le premier appel peut demander une
  // minute. Un delai court ferait echouer la construction sans raison.
  const stop = AbortSignal.timeout(120_000);
  const reponse = await fetch(`${API}/api/catalogue`, { signal: stop });
  if (!reponse.ok) throw new Error(`l API a repondu ${reponse.status}`);

  const donnees = await reponse.json();
  if (!Array.isArray(donnees.produits) || donnees.produits.length === 0) {
    throw new Error('catalogue vide : construction interrompue plutot que publier une boutique sans oeuvre');
  }

  await fs.mkdir(path.dirname(CIBLE), { recursive: true });
  await fs.writeFile(CIBLE, JSON.stringify(donnees, null, 2));
  console.log(`data/snapshot.json ecrit : ${donnees.produits.length} oeuvres.`);
} catch (e) {
  const secours = await ancien();
  if (!secours) {
    console.error(`\nEchec de l instantane : ${e.message}`);
    console.error('Aucun instantane precedent : la construction s arrete.');
    console.error(`Verifiez que ${API}/api/catalogue repond.`);
    process.exit(1);
  }
  console.warn(`\nAvertissement : ${e.message}`);
  console.warn(`On reutilise l instantane precedent (${secours.produits.length} oeuvres, pris le ${secours.genere || 'date inconnue'}).`);
  console.warn('La boutique publiee ne refletera donc PAS les dernieres modifications.\n');
}
