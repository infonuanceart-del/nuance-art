/**
 * Construit la vitrine en fichiers statiques, pour un hebergeur qui ne sait
 * que les servir (le resultat est dans out/).
 *
 * Passer par un script plutot que par `BUILD_TARGET=static next build` dans
 * package.json : cette syntaxe de prefixe n'existe pas sous Windows, ou se
 * lance le projet.
 */
import { spawnSync } from 'node:child_process';

const r = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, BUILD_TARGET: 'static' },
});

process.exit(r.status ?? 1);
