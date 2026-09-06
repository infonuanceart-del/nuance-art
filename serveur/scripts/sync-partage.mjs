/**
 * Recopie dans serveur/partage/ les modules partages avec l'application Next.
 *
 * Pourquoi une copie plutot qu'un import « ../../lib » : le package.json de la
 * racine ne declare pas "type": "module", donc Node lirait ces fichiers .js
 * comme du CommonJS et refuserait leur syntaxe `export`. Les recopier sous ce
 * dossier, dont le package.json est en module, les rend importables tels quels
 * — et garantit qu'il n'existe qu'une seule source de verite : lib/.
 *
 * Lance automatiquement par `npm run build` et `npm run dev`.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(ICI, '..', '..', 'lib');
const CIBLE = path.resolve(ICI, '..', 'partage');

const FICHIERS = [
  'taxonomie.js',
  'prix.js',
  'produit.js',
  'cloudinary.js',
  path.join('store', 'mongo.js'),
];

const ENTETE = '// Fichier genere par scripts/sync-partage.mjs — ne pas modifier ici.\n'
  + '// La source est lib/%s a la racine du depot.\n\n';

await fs.rm(CIBLE, { recursive: true, force: true });

for (const fichier of FICHIERS) {
  const depuis = path.join(SOURCE, fichier);
  const vers = path.join(CIBLE, fichier);
  const contenu = await fs.readFile(depuis, 'utf8');
  await fs.mkdir(path.dirname(vers), { recursive: true });
  const affiche = fichier.split(path.sep).join('/');
  await fs.writeFile(vers, ENTETE.replace('%s', affiche) + contenu);
}

console.log(`partage/ regenere : ${FICHIERS.length} fichiers copies depuis lib/.`);
