/**
 * Contrôles de non-régression des modules purs.
 *
 * Ne couvre que le code sans dépendance à React ni à Firebase — tokenisation
 * de recherche et système de permissions — mais ce sont précisément les deux
 * endroits où une régression serait silencieuse : une recherche qui ne trouve
 * plus rien, ou un rôle qui gagne un droit qu'il ne devrait pas avoir.
 *
 * Exécution : `npm run check`
 */

import * as tokens from '../src/utils/tokens.js';
import * as permissions from '../src/utils/permissions.js';

let failures = 0;

/**
 * Compare une valeur observée à la valeur attendue.
 * @param {string} label
 * @param {unknown} actual
 * @param {unknown} expected
 */
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? 'OK   ' : 'ECHEC'} ${label}` +
      (ok
        ? ''
        : `\n      attendu ${JSON.stringify(expected)}\n      obtenu  ${JSON.stringify(actual)}`),
  );
}

console.log('\n--- Tokenisation de recherche ---');

check('normalize retire les accents', tokens.normalize('DÉ SÀNTÁ'), 'de santa');
check('words decoupe sur la ponctuation', tokens.words('De Santa, Michael-J.'), [
  'de',
  'santa',
  'michael',
  'j',
]);

const built = tokens.buildSearchTokens(['Michael', 'De Santa']);
check('prefixes de "michael" presents', built.includes('mic') && built.includes('michael'), true);
check("pas de prefixe d'un seul caractere", built.includes('m'), false);
check("mot d'un caractere conserve tel quel", tokens.buildSearchTokens(['J']), ['j']);
check(
  'plafond de 60 tokens respecte',
  tokens.buildSearchTokens([
    Array.from({ length: 40 }, (_, index) => `mot${index}suite`).join(' '),
  ]).length <= 60,
  true,
);

check('toQueryToken tronque a 12 caracteres', tokens.toQueryToken('abcdefghijklmnopqrst'), 'abcdefghijkl');
check('toQueryToken sur saisie vide', tokens.toQueryToken('   '), null);

check('matchesQuery trouve un debut de mot', tokens.matchesQuery('san', ['Michael De Santa']), true);
check('matchesQuery refuse un milieu de mot', tokens.matchesQuery('anta', ['Michael De Santa']), false);
check('matchesQuery exige tous les mots', tokens.matchesQuery('mic san', ['Michael De Santa']), true);
check('matchesQuery accepte une requete vide', tokens.matchesQuery('', ['x']), true);

check(
  'highlightSegments isole la correspondance',
  tokens
    .highlightSegments('Michael De Santa', 'san')
    .map((segment) => (segment.match ? `[${segment.value}]` : segment.value))
    .join(''),
  'Michael De [San]ta',
);

console.log('\n--- Roles et permissions ---');

check('34 permissions declarees', permissions.ALL_PERMISSIONS.length, 34);
check(
  'administrateur : toutes les permissions',
  permissions.compileAbilities({ role: 'ADMINISTRATOR' }).length,
  34,
);
check(
  'cadet : lecture seule sur les citoyens',
  permissions.compileAbilities({ role: 'CADET' }).includes('citizens.update'),
  false,
);
check(
  'deputy : peut modifier un citoyen',
  permissions.compileAbilities({ role: 'DEPUTY' }).includes('citizens.update'),
  true,
);
check(
  'deputy : ne peut pas archiver',
  permissions.compileAbilities({ role: 'DEPUTY' }).includes('citizens.delete'),
  false,
);
check(
  'captain : peut archiver',
  permissions.compileAbilities({ role: 'CAPTAIN' }).includes('citizens.delete'),
  true,
);
check(
  'lieutenant : peut valider un rapport',
  permissions.compileAbilities({ role: 'LIEUTENANT' }).includes('reports.validate'),
  true,
);
check(
  'sergeant : ne peut pas valider',
  permissions.compileAbilities({ role: 'SERGEANT' }).includes('reports.validate'),
  false,
);
check(
  'gestion des permissions reservee a sheriff et administrateur',
  ['ADMINISTRATOR', 'SHERIFF'].every((role) =>
    permissions.compileAbilities({ role }).includes('admin.permissions'),
  ) && !permissions.compileAbilities({ role: 'UNDERSHERIFF' }).includes('admin.permissions'),
  true,
);

check(
  'une derogation ajoute une permission',
  permissions
    .compileAbilities({ role: 'SERGEANT', grants: ['reports.validate'] })
    .includes('reports.validate'),
  true,
);
check(
  'un retrait supprime une permission du role',
  permissions
    .compileAbilities({ role: 'SERGEANT', revokes: ['citizens.update'] })
    .includes('citizens.update'),
  false,
);
check(
  'le retrait prime sur la derogation',
  permissions
    .compileAbilities({
      role: 'CADET',
      grants: ['citizens.delete'],
      revokes: ['citizens.delete'],
    })
    .includes('citizens.delete'),
  false,
);
check(
  'une permission inconnue est ignoree',
  permissions
    .compileAbilities({ role: 'CADET', grants: ['nimporte.quoi'] })
    .includes('nimporte.quoi'),
  false,
);

const document = permissions.buildPermissionDocument({
  role: 'SERGEANT',
  grants: ['reports.validate'],
});
check('document de permissions : niveau hierarchique', document.level, 50);
check(
  'document de permissions : liste triee',
  document.abilities.join(',') === [...document.abilities].sort().join(','),
  true,
);

check('hierarchie : captain domine deputy', permissions.outranks('CAPTAIN', 'DEPUTY'), true);
check('hierarchie : rang egal ne domine pas', permissions.outranks('CAPTAIN', 'CAPTAIN'), false);

const difference = permissions.diffFromRole(
  'SERGEANT',
  permissions.compileAbilities({
    role: 'SERGEANT',
    grants: ['reports.validate'],
    revokes: ['citizens.update'],
  }),
);
check('ecart au role : permissions accordees', difference.granted, ['reports.validate']);
check('ecart au role : permissions retirees', difference.revoked, ['citizens.update']);

console.log(
  failures === 0
    ? '\nTOUS LES CONTROLES PASSENT\n'
    : `\n${failures} CONTROLE(S) EN ECHEC\n`,
);

process.exit(failures === 0 ? 0 : 1);
