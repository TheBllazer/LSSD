/**
 * Exécution de commandes externes pour les scripts de déploiement.
 *
 * Volontairement minimaliste : les scripts de publication doivent pouvoir être
 * lus en entier en une minute. Aucune dépendance, aucun cache, aucun état
 * conservé entre deux exécutions — c'est précisément ce qui rendait le paquet
 * `gh-pages` imprévisible.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Racine du dépôt, déduite de l'emplacement de ce fichier. */
export const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

/**
 * Lance une commande et interrompt le script si elle échoue.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv }} [options]
 */
export function run(command, args, options = {}) {
  const shell = needsShell(command);
  // Avec `shell`, Node déconseille de passer un tableau d'arguments : il les
  // concatène sans les échapper. On construit donc nous-mêmes la ligne de
  // commande — les seuls cas concernés sont `npm`/`npx`, dont les arguments
  // sont écrits en dur dans ces scripts.
  const result = spawnSync(shell ? [command, ...args].join(' ') : command, shell ? [] : args, {
    cwd: options.cwd ?? root,
    env: options.env ?? process.env,
    stdio: 'inherit',
    shell,
  });

  if (result.error) fail(`${command} introuvable : ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${args.join(' ')} a échoué (code ${result.status}).`);
}

/**
 * Détermine s'il faut passer par un interpréteur de commandes.
 *
 * Sous Windows, `npm` et `npx` sont des scripts `.cmd` que `spawn` ne sait pas
 * lancer directement. Mais l'interpréteur ré-analyse la ligne de commande :
 * un argument contenant des espaces — un message de commit, typiquement — s'y
 * retrouve découpé en plusieurs arguments. Le shell est donc réservé aux seuls
 * cas qui l'exigent ; tout le reste est lancé directement, arguments intacts.
 *
 * @param {string} command
 */
function needsShell(command) {
  return process.platform === 'win32' && /^(npm|npx|yarn|pnpm)$/.test(command);
}

/**
 * Lance une commande et retourne sa sortie, sans interrompre le script.
 *
 * @param {string} command
 * @param {string[]} args
 * @returns {{ ok: boolean, out: string }}
 */
export function capture(command, args) {
  const shell = needsShell(command);
  const result = spawnSync(shell ? [command, ...args].join(' ') : command, shell ? [] : args, {
    cwd: root,
    encoding: 'utf8',
    shell,
  });
  return { ok: result.status === 0, out: (result.stdout ?? '').trim() };
}

/** Interrompt le script sur un message lisible, sans trace de pile. */
export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

/** Titre de section. */
export function step(message) {
  console.log(`\n── ${message}`);
}

/** Au-delà de cette taille, un fichier n'a rien à faire dans un site statique. */
const MAX_ASSET_MB = 20;

/**
 * Refuse de publier un build contenant un fichier démesuré.
 *
 * Tout ce que contient `public/` est recopié dans `dist/` par Vite, sans
 * qu'aucun `git status` ne le signale — un fichier de travail oublié là est
 * publié à chaque déploiement, et rien ne le dit. Le cas s'est produit avec le
 * SVG source du fond de carte : 63 Mo poussés à chaque tentative.
 *
 * @param {string} dist
 */
export function assertNoHugeAssets(dist) {
  /** @type {{ file: string, mb: string }[]} */
  const oversized = [];

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const mb = statSync(full).size / 1024 / 1024;
      if (mb > MAX_ASSET_MB) {
        oversized.push({ file: path.relative(dist, full), mb: mb.toFixed(1) });
      }
    }
  };
  walk(dist);

  if (oversized.length > 0) {
    fail(
      `Le build contient ${oversized.length} fichier(s) de plus de ${MAX_ASSET_MB} Mo :\n` +
        oversized.map((item) => `    ${item.file}  (${item.mb} Mo)`).join('\n') +
        "\n\n  Ces fichiers viennent presque toujours de `public/`, dont Vite recopie\n" +
        '  intégralement le contenu. Déplacez le fichier source hors de `public/`\n' +
        '  puis relancez le déploiement.',
    );
  }
}
