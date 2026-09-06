/**
 * Charge .env.local puis .env depuis la racine du depot, sans dependance.
 *
 * Sur Render les variables viennent du panneau du service : ce chargement ne
 * sert qu'au developpement local, et n'ecrase jamais une variable deja definie.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');

for (const nom of ['.env.local', '.env']) {
  try {
    const texte = fs.readFileSync(path.join(RACINE, nom), 'utf8');
    for (const ligne of texte.split('\n')) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // fichier absent : normal en production
  }
}
