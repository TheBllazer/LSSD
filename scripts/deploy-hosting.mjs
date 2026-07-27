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
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { root, run, capture, fail, step, assertNoHugeAssets } from './lib/run.mjs';

const DIST = path.join(root, 'dist');

// ── 0. Cible ──────────────────────────────────────────────────────────────
const rc = capture('node', [
  '-e',
  "process.stdout.write(require('./.firebaserc').projects.default)",
]);
if (!rc.ok || !rc.out) {
  fail("Projet Firebase introuvable : renseignez `projects.default` dans .firebaserc.");
}
console.log(`Projet Firebase : ${rc.out}`);
console.log(`Cible           : https://${rc.out}.web.app/`);

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
step('Envoi vers Firebase Hosting');
console.log(
  "Si la commande réclame une authentification : `npx --yes firebase-tools login`.\n",
);
run('npx', ['--yes', 'firebase-tools', 'deploy', '--only', 'hosting']);

console.log(`\n✔ En ligne sur https://${rc.out}.web.app/`);
console.log(
  "\nLes domaines `*.web.app` et `*.firebaseapp.com` du projet sont autorisés\n" +
    "d'office par Firebase Authentication : aucune configuration supplémentaire.",
);
