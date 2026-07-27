/**
 * Rastérisation du fond de carte.
 *
 * Le SVG source de Los Santos pèse 62 Mo de tracés vectoriels : impossible à
 * charger tel quel dans un navigateur, et hors de question de le versionner —
 * il alourdirait chaque clone du dépôt pour toujours.
 *
 * Ce script le convertit une fois pour toutes en PNG, à une résolution
 * suffisante pour un zoom confortable. Seul le PNG est versionné ; le SVG
 * reste sur le poste de celui qui régénère la carte.
 *
 * Le SVG source vit dans `map-source/`, **hors de `public/`** : tout ce que
 * contient `public/` est recopié tel quel dans `dist/` par Vite, et se
 * retrouverait donc publié à chaque déploiement.
 *
 * Exécution : `npm run build:map`
 */

import sharp from 'sharp';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const source = path.join(root, 'map-source', 'MAP.svg');
const target = path.join(root, 'public', 'map', 'los-santos.png');

/** Emplacement historique, à l'intérieur du dossier publié. */
const legacySource = path.join(root, 'public', 'map', 'MAP.svg');

if (existsSync(legacySource)) {
  console.error(
    `Le SVG source se trouve dans public/map/ : il serait publié tel quel (63 Mo).\n` +
      `Déplacez-le :\n  mv public/map/MAP.svg map-source/MAP.svg`,
  );
  process.exit(1);
}

/** Largeur de rendu. 3000 px offre un zoom net sans dépasser ~6 Mo. */
const WIDTH = 3000;

if (!existsSync(source)) {
  console.error(
    `Fond de carte introuvable : ${source}\n` +
      "Déposez le SVG source dans map-source/ puis relancez la commande.",
  );
  process.exit(1);
}

const sourceSize = (statSync(source).size / 1024 / 1024).toFixed(1);
console.log(`Source : MAP.svg (${sourceSize} Mo)`);
console.log(`Rendu  : ${WIDTH} px de large…`);

try {
  // `density` pilote la finesse de rastérisation d'un SVG par libvips :
  // trop basse, les tracés fins disparaissent ; trop haute, la mémoire explose.
  const image = sharp(source, { density: 96, limitInputPixels: false });
  const metadata = await image.metadata();
  const ratio = (metadata.height ?? 6242) / (metadata.width ?? 5015);

  await image
    .resize({ width: WIDTH, height: Math.round(WIDTH * ratio), fit: 'fill' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(target);

  const outputSize = (statSync(target).size / 1024 / 1024).toFixed(1);
  console.log(
    `\nFond de carte généré : public/map/los-santos.png ` +
      `(${WIDTH} × ${Math.round(WIDTH * ratio)} px, ${outputSize} Mo)`,
  );
} catch (error) {
  console.error('\nRastérisation impossible :', error.message);
  console.error(
    "Le SVG est peut-être trop complexe pour librsvg. Exportez-le en PNG depuis " +
      "Inkscape ou Illustrator, nommez-le los-santos.png et placez-le dans public/map/.",
  );
  process.exit(1);
}
