/**
 * Construit la vitrine en fichiers statiques, pour un hebergeur qui ne sait
 * que les servir (le resultat est dans out/).
 *
 * Passer par un script plutot que par `BUILD_TARGET=static next build` dans
 * package.json : cette syntaxe de prefixe n'existe pas sous Windows, ou se
 * lance le projet.
 *
 * Le script ecarte aussi la route de purge du cache le temps de l'export :
 * l'export statique ne sait pas produire une route POST, et elle n'aurait rien
 * a purger dans un site fige. On deplace le fichier, pas le dossier — sous
 * OneDrive, renommer un dossier echoue en EPERM.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const RACINE = process.cwd();
const ROUTE = path.join(RACINE, 'app', 'api', 'revalidation', 'route.js');
const RANGE = `${ROUTE}.hors-export`;

const aDeplacer = fs.existsSync(ROUTE);

if (fs.existsSync(RANGE)) {
  console.error(
    `${RANGE} existe deja : une construction precedente s'est interrompue.
`
    + 'Renommez-le en route.js avant de relancer.',
  );
  process.exit(1);
}

try {
  if (aDeplacer) fs.renameSync(ROUTE, RANGE);

  const r = spawnSync('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BUILD_TARGET: 'static' },
  });

  process.exitCode = r.status ?? 1;
} finally {
  if (aDeplacer && fs.existsSync(RANGE)) fs.renameSync(RANGE, ROUTE);
}
