/**
 * Publication sur Firebase Hosting.
 *
 * Voie de déploiement indépendante de GitHub : ni branche `gh-pages`, ni
 * GitHub Actions, ni facturation GitHub. Le projet Firebase existe déjà — il
 * porte Firestore et Authentication — et l'hébergement statique est compris
 * dans le forfait gratuit.
 *
 * Le site est servi à la racine du domaine (`https://<projet>.web.app/`), donc
 * le bundle doit être compilé avec `base = '/'`, et non `/LSSD/`. Le script
 * force cette valeur dans l'environnement du build : `.env.local` n'a pas à
 * être modifié entre deux cibles de déploiement.
 *
 * Prérequis : `npx firebase-tools login` une fois sur le poste.
 *
 * Exécution : `npm run deploy:hosting`
 *             `npm run deploy:hosting -- --dry-run`  (tout sauf la mise en ligne)
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { root, run, fail, step, assertNoHugeAssets } from './lib/run.mjs';

const DIST = path.join(root, 'dist');
const RC = path.join(root, '.firebaserc');

/** `--dry-run` : le bundle est construit et vérifié, mais rien n'est mis en ligne. */
const dryRun = process.argv.includes('--dry-run');

// ── 0. Cible ──────────────────────────────────────────────────────────────
/**
 * Identifiant du projet Firebase.
 *
 * `.firebaserc` est du JSON, mais sans extension : `require` ne saurait pas
 * quel analyseur lui appliquer. On le lit donc à la main.
 */
function readProjectId() {
  if (!existsSync(RC)) {
    fail(`.firebaserc est absent. Créez-le :\n\n  { "projects": { "default": "<id-du-projet>" } }`);
  }
  try {
    const id = JSON.parse(readFileSync(RC, 'utf8'))?.projects?.default;
    if (!id) fail('`projects.default` est absent de .firebaserc.');
    return id;
  } catch (error) {
    return fail(`.firebaserc est illisible : ${error.message}`);
  }
}

const projectId = readProjectId();
console.log(`Projet Firebase : ${projectId}`);
console.log(`Cible           : https://${projectId}.web.app/`);
if (dryRun) console.log('Mode            : simulation (aucune mise en ligne)');

// ── 1. Build à la racine ──────────────────────────────────────────────────
step("Construction du bundle (base « / »)");
run('npm', ['run', 'build'], {
  // Vite donne la priorité à `process.env` sur les fichiers `.env`, ce qui
  // permet de surcharger la base sans toucher à `.env.local`.
  env: { ...process.env, VITE_BASE_PATH: '/' },
});

if (!existsSync(path.join(DIST, 'index.html'))) {
  fail("dist/index.html est absent : le build n'a rien produit.");
}
assertNoHugeAssets(DIST);

// ── 2. Publication ────────────────────────────────────────────────────────
if (dryRun) {
  const base = readFileSync(path.join(DIST, 'index.html'), 'utf8').match(
    /<script[^>]+src="([^"]+)"/,
  );
  step('Simulation');
  console.log(`Bundle prêt dans dist/, point d'entrée : ${base?.[1] ?? '(introuvable)'}`);
  console.log('La mise en ligne est omise.\n');
  process.exit(0);
}

step('Envoi vers Firebase Hosting');
console.log(
  "Si la commande réclame une authentification : `npx --yes firebase-tools login`.\n",
);
run('npx', ['--yes', 'firebase-tools', 'deploy', '--only', 'hosting', '--project', projectId]);

console.log(`\n✔ En ligne sur https://${projectId}.web.app/`);
console.log(
  "\nLes domaines `*.web.app` et `*.firebaseapp.com` du projet sont autorisés\n" +
    "d'office par Firebase Authentication : aucune configuration supplémentaire.",
);
