/**
 * Publication sur GitHub Pages — sans le paquet `gh-pages`.
 *
 * Le paquet officiel entretient un clone du dépôt dans
 * `node_modules/.cache/gh-pages` et s'en sert d'un déploiement à l'autre. Ce
 * cache se désynchronise (branche renommée, dépôt re-créé, force-push), et le
 * paquet masque alors l'erreur réelle derrière des messages sans rapport —
 * « Failed to get remote.origin.url » étant le plus célèbre.
 *
 * Ce script fait la même chose avec du git ordinaire, dans un *worktree* jeté
 * après usage : aucun état ne survit à l'exécution, donc rien ne peut se
 * désynchroniser.
 *
 *   1. build            (base de l'URL lue depuis VITE_BASE_PATH)
 *   2. worktree gh-pages aligné sur origin/gh-pages
 *   3. vidage complet puis copie de dist/
 *   4. commit + push
 *   5. suppression du worktree
 *
 * Exécution : `npm run deploy:pages`
 *             `npm run deploy:pages -- --dry-run`  (tout sauf le push)
 *
 * ⚠️ Le contenu de la branche `gh-pages` est INTÉGRALEMENT REMPLACÉ, y compris
 * un éventuel fichier CNAME. Pour conserver un domaine personnalisé, placez le
 * CNAME dans `public/` : Vite le recopie alors dans `dist/` à chaque build.
 */

import { existsSync, rmSync, readdirSync, writeFileSync, cpSync } from 'node:fs';
import path from 'node:path';
import { root, run, capture, fail, step, assertNoHugeAssets } from './lib/run.mjs';

const BRANCH = 'gh-pages';
const WORKTREE = path.join(root, '.deploy-worktree');
const DIST = path.join(root, 'dist');

/** `--dry-run` : tout est exécuté localement, seul le push est omis. */
const dryRun = process.argv.includes('--dry-run');

/**
 * Exception `safe.directory` pour le worktree.
 *
 * Le dépôt vit sur un volume qui n'enregistre pas la propriété des fichiers
 * (exFAT, disque externe, partage réseau). Git refuse alors d'opérer sur un
 * chemin qu'il n'a pas déjà vu — et le worktree est un chemin neuf à chaque
 * exécution. L'exception est passée à la commande plutôt qu'écrite dans la
 * configuration globale : un script de déploiement n'a pas à laisser de trace
 * sur le poste.
 */
const SAFE = ['-c', `safe.directory=${WORKTREE.replace(/\\/g, '/')}`];

/** Commande git exécutée à l'intérieur du worktree. */
const git = (args) => run('git', [...SAFE, ...args], { cwd: WORKTREE });

/** Retire le worktree, qu'il soit enregistré par git ou simplement resté sur le disque. */
function cleanWorktree() {
  capture('git', [...SAFE, 'worktree', 'remove', '--force', WORKTREE]);
  // Le retrait échoue si le worktree est resté dans un état inattendu : on
  // supprime alors le dossier à la main, puis `prune` retire la fiche que git
  // gardait dans .git/worktrees. L'ordre compte — `prune` ne nettoie que les
  // fiches dont le dossier a déjà disparu.
  if (existsSync(WORKTREE)) rmSync(WORKTREE, { recursive: true, force: true });
  capture('git', ['worktree', 'prune']);
}

// ── 0. Garde-fous ─────────────────────────────────────────────────────────
if (!capture('git', ['rev-parse', '--git-dir']).ok) {
  fail("Ce dossier n'est pas un dépôt git.");
}

const remote = capture('git', ['remote', 'get-url', 'origin']);
if (!remote.ok) {
  fail("Aucun dépôt distant « origin ». Ajoutez-le avec :\n  git remote add origin <url>");
}
console.log(`Dépôt distant : ${remote.out}`);
console.log(`Branche cible : ${BRANCH}`);
if (dryRun) console.log('Mode          : simulation (aucun push)');

// ── 1. Build ──────────────────────────────────────────────────────────────
step('Construction du bundle');
run('npm', ['run', 'build']);

if (!existsSync(path.join(DIST, 'index.html'))) {
  fail("dist/index.html est absent : le build n'a rien produit.");
}
assertNoHugeAssets(DIST);

// ── 2. Worktree aligné sur la branche distante ────────────────────────────
step(`Préparation du worktree ${path.basename(WORKTREE)}`);
cleanWorktree();

const hasRemoteBranch = capture('git', [
  'ls-remote', '--exit-code', '--heads', 'origin', BRANCH,
]).ok;

if (hasRemoteBranch) {
  run('git', ['fetch', 'origin', BRANCH]);
  // `-B` réaligne la branche locale sur la distante : le contenu précédent est
  // remplacé, mais l'historique de la branche est conservé.
  run('git', ['worktree', 'add', '-B', BRANCH, WORKTREE, `origin/${BRANCH}`]);
} else {
  console.log(`La branche ${BRANCH} n'existe pas encore sur origin : création.`);
  run('git', ['worktree', 'add', '--detach', WORKTREE]);
  git(['checkout', '--orphan', BRANCH]);
  git(['rm', '-rf', '--quiet', '.']);
}

// ── 3. Remplacement du contenu ────────────────────────────────────────────
step('Copie de dist/');
for (const entry of readdirSync(WORKTREE)) {
  if (entry === '.git') continue;
  rmSync(path.join(WORKTREE, entry), { recursive: true, force: true });
}
cpSync(DIST, WORKTREE, { recursive: true });

// Sans ce fichier, GitHub Pages passe le site à Jekyll, qui ignore tout
// répertoire ou fichier commençant par un tiret bas.
writeFileSync(path.join(WORKTREE, '.nojekyll'), '');

// ── 4. Commit et publication ──────────────────────────────────────────────
step('Publication');
git(['add', '--all']);

const pending = capture('git', [...SAFE, '-C', WORKTREE, 'status', '--porcelain']);
if (!pending.out) {
  console.log('Aucun changement par rapport à la version publiée : rien à pousser.');
} else {
  const sha = capture('git', ['rev-parse', '--short', 'HEAD']).out;
  git(['commit', '--message', `Deploiement LSSD RMS (${sha})`]);

  if (dryRun) {
    const summary = capture('git', [...SAFE, '-C', WORKTREE, 'show', '--stat', '--oneline', 'HEAD']);
    console.log(summary.out.split('\n').slice(0, 6).join('\n'));
    console.log('  …');
    console.log('\nSimulation : le commit est prêt, le push est omis.');
  } else {
    git(['push', 'origin', BRANCH]);
  }
}

// ── 5. Nettoyage ──────────────────────────────────────────────────────────
cleanWorktree();

console.log(dryRun ? '\n✔ Simulation terminée.' : `\n✔ Branche ${BRANCH} publiée.`);
console.log(
  '\nRappel : GitHub Pages doit être activé sur le dépôt\n' +
    `  Settings → Pages → Source : Deploy from a branch → ${BRANCH} / (root)\n` +
    "Sans cela, la branche est bien poussée mais rien n'est mis en ligne.",
);
