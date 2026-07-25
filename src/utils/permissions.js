/**
 * Système de rôles et de permissions du LSSD RMS.
 *
 * Ce module est la **source unique de vérité** des droits applicatifs. Il est
 * volontairement sans dépendance (ni React, ni Firebase) : il sert autant à
 * l'interface qu'au calcul du document `/permissions/{uid}` lu par les règles
 * Firestore.
 *
 * Modèle :
 *   1. un agent possède un `role` ;
 *   2. le rôle donne un jeu de permissions par défaut (`ROLE_DEFAULTS`) ;
 *   3. un administrateur peut y ajouter (`grants`) ou en retirer (`revokes`) ;
 *   4. `compileAbilities()` produit la liste effective `abilities`, seule lue
 *      par les règles de sécurité — voir `docs/05-SECURITY-RULES.md`.
 */

/* -------------------------------------------------------------- permissions */

/** Codes de permission. Toute vérification passe par ces constantes. */
export const PERMISSIONS = {
  CITIZENS_READ: 'citizens.read',
  CITIZENS_CREATE: 'citizens.create',
  CITIZENS_UPDATE: 'citizens.update',
  CITIZENS_DELETE: 'citizens.delete',

  VEHICLES_READ: 'vehicles.read',
  VEHICLES_CREATE: 'vehicles.create',
  VEHICLES_UPDATE: 'vehicles.update',
  VEHICLES_DELETE: 'vehicles.delete',

  WEAPONS_READ: 'weapons.read',
  WEAPONS_CREATE: 'weapons.create',
  WEAPONS_UPDATE: 'weapons.update',
  WEAPONS_DELETE: 'weapons.delete',

  REPORTS_READ: 'reports.read',
  REPORTS_CREATE: 'reports.create',
  REPORTS_UPDATE_OWN: 'reports.update.own',
  REPORTS_UPDATE_ANY: 'reports.update.any',
  REPORTS_DELETE: 'reports.delete',
  REPORTS_VALIDATE: 'reports.validate',

  RECORDS_READ: 'records.read',
  RECORDS_CREATE: 'records.create',
  RECORDS_UPDATE: 'records.update',
  RECORDS_DELETE: 'records.delete',

  MAP_READ: 'map.read',
  MAP_CREATE: 'map.create',
  MAP_UPDATE: 'map.update',
  MAP_DELETE: 'map.delete',

  AGENTS_READ: 'agents.read',
  AGENTS_CREATE: 'agents.create',
  AGENTS_UPDATE: 'agents.update',
  AGENTS_DELETE: 'agents.delete',

  ADMIN_PERMISSIONS: 'admin.permissions',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_AUDIT: 'admin.audit',
  ADMIN_EXPORT: 'admin.export',
};

/** Toutes les permissions existantes, à plat. */
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Regroupement par module — utilisé par la matrice de permissions (phase 9)
 * et par les écrans d'aide.
 */
export const PERMISSION_GROUPS = [
  {
    id: 'citizens',
    label: 'Citoyens',
    permissions: [
      { code: PERMISSIONS.CITIZENS_READ, label: 'Consulter le registre' },
      { code: PERMISSIONS.CITIZENS_CREATE, label: 'Créer une fiche' },
      { code: PERMISSIONS.CITIZENS_UPDATE, label: 'Modifier une fiche' },
      { code: PERMISSIONS.CITIZENS_DELETE, label: 'Archiver une fiche' },
    ],
  },
  {
    id: 'vehicles',
    label: 'Véhicules',
    permissions: [
      { code: PERMISSIONS.VEHICLES_READ, label: 'Consulter le registre' },
      { code: PERMISSIONS.VEHICLES_CREATE, label: 'Enregistrer un véhicule' },
      { code: PERMISSIONS.VEHICLES_UPDATE, label: 'Modifier un véhicule' },
      { code: PERMISSIONS.VEHICLES_DELETE, label: 'Archiver un véhicule' },
    ],
  },
  {
    id: 'weapons',
    label: 'Armes',
    permissions: [
      { code: PERMISSIONS.WEAPONS_READ, label: 'Consulter le registre' },
      { code: PERMISSIONS.WEAPONS_CREATE, label: 'Enregistrer une arme' },
      { code: PERMISSIONS.WEAPONS_UPDATE, label: 'Modifier une arme' },
      { code: PERMISSIONS.WEAPONS_DELETE, label: 'Archiver une arme' },
    ],
  },
  {
    id: 'reports',
    label: 'Rapports',
    permissions: [
      { code: PERMISSIONS.REPORTS_READ, label: 'Consulter les rapports' },
      { code: PERMISSIONS.REPORTS_CREATE, label: 'Rédiger un rapport' },
      { code: PERMISSIONS.REPORTS_UPDATE_OWN, label: 'Modifier ses rapports' },
      { code: PERMISSIONS.REPORTS_UPDATE_ANY, label: 'Modifier tout rapport' },
      { code: PERMISSIONS.REPORTS_VALIDATE, label: 'Valider ou rejeter' },
      { code: PERMISSIONS.REPORTS_DELETE, label: 'Archiver un rapport' },
    ],
  },
  {
    id: 'records',
    label: 'Casiers judiciaires',
    permissions: [
      { code: PERMISSIONS.RECORDS_READ, label: 'Consulter les casiers' },
      { code: PERMISSIONS.RECORDS_CREATE, label: 'Créer un casier' },
      { code: PERMISSIONS.RECORDS_UPDATE, label: 'Modifier un casier' },
      { code: PERMISSIONS.RECORDS_DELETE, label: 'Archiver un casier' },
    ],
  },
  {
    id: 'map',
    label: 'Carte',
    permissions: [
      { code: PERMISSIONS.MAP_READ, label: 'Consulter la carte' },
      { code: PERMISSIONS.MAP_CREATE, label: 'Créer une entité' },
      { code: PERMISSIONS.MAP_UPDATE, label: 'Modifier une entité' },
      { code: PERMISSIONS.MAP_DELETE, label: 'Supprimer une entité' },
    ],
  },
  {
    id: 'agents',
    label: 'Personnel',
    permissions: [
      { code: PERMISSIONS.AGENTS_READ, label: "Consulter l'annuaire" },
      { code: PERMISSIONS.AGENTS_CREATE, label: 'Créer un compte' },
      { code: PERMISSIONS.AGENTS_UPDATE, label: 'Modifier une fiche agent' },
      { code: PERMISSIONS.AGENTS_DELETE, label: 'Désactiver un compte' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    permissions: [
      { code: PERMISSIONS.ADMIN_PERMISSIONS, label: 'Gérer les permissions' },
      { code: PERMISSIONS.ADMIN_SETTINGS, label: 'Modifier les référentiels' },
      { code: PERMISSIONS.ADMIN_AUDIT, label: "Consulter le journal d'audit" },
      { code: PERMISSIONS.ADMIN_EXPORT, label: 'Exporter en masse' },
    ],
  },
];

/* --------------------------------------------------------------------- rôles */

/** Identifiants de rôle. */
export const ROLES = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  SHERIFF: 'SHERIFF',
  UNDERSHERIFF: 'UNDERSHERIFF',
  CAPTAIN: 'CAPTAIN',
  LIEUTENANT: 'LIEUTENANT',
  SERGEANT: 'SERGEANT',
  DEPUTY: 'DEPUTY',
  CADET: 'CADET',
};

/**
 * Hiérarchie numérique. Utilisée par les règles Firestore pour les décisions
 * qui ne se résument pas à une permission : lecture d'un rapport confidentiel,
 * modification de la note d'un autre agent, purge des révisions.
 */
export const ROLE_LEVELS = {
  [ROLES.ADMINISTRATOR]: 100,
  [ROLES.SHERIFF]: 90,
  [ROLES.UNDERSHERIFF]: 80,
  [ROLES.CAPTAIN]: 70,
  [ROLES.LIEUTENANT]: 60,
  [ROLES.SERGEANT]: 50,
  [ROLES.DEPUTY]: 30,
  [ROLES.CADET]: 10,
};

/** Libellés d'affichage, du plus élevé au plus bas. */
export const ROLE_LABELS = {
  [ROLES.ADMINISTRATOR]: 'Administrateur',
  [ROLES.SHERIFF]: 'Sheriff',
  [ROLES.UNDERSHERIFF]: 'Undersheriff',
  [ROLES.CAPTAIN]: 'Captain',
  [ROLES.LIEUTENANT]: 'Lieutenant',
  [ROLES.SERGEANT]: 'Sergeant',
  [ROLES.DEPUTY]: 'Deputy',
  [ROLES.CADET]: 'Cadet',
};

/** Abréviations affichées sur les listes et les badges. */
export const ROLE_ABBR = {
  [ROLES.ADMINISTRATOR]: 'ADM',
  [ROLES.SHERIFF]: 'SHF',
  [ROLES.UNDERSHERIFF]: 'USH',
  [ROLES.CAPTAIN]: 'CPT',
  [ROLES.LIEUTENANT]: 'LT',
  [ROLES.SERGEANT]: 'SGT',
  [ROLES.DEPUTY]: 'DEP',
  [ROLES.CADET]: 'CDT',
};

/** Liste ordonnée des rôles (hiérarchie décroissante). */
export const ROLE_ORDER = Object.keys(ROLE_LEVELS).sort(
  (a, b) => ROLE_LEVELS[b] - ROLE_LEVELS[a],
);

/* --------------------------------------------------- permissions par défaut */

const CADET_DEFAULTS = [
  PERMISSIONS.CITIZENS_READ,
  PERMISSIONS.VEHICLES_READ,
  PERMISSIONS.WEAPONS_READ,
  PERMISSIONS.REPORTS_READ,
  PERMISSIONS.REPORTS_CREATE,
  PERMISSIONS.REPORTS_UPDATE_OWN,
  PERMISSIONS.RECORDS_READ,
  PERMISSIONS.MAP_READ,
  PERMISSIONS.AGENTS_READ,
];

const DEPUTY_DEFAULTS = [
  ...CADET_DEFAULTS,
  PERMISSIONS.CITIZENS_CREATE,
  PERMISSIONS.CITIZENS_UPDATE,
  PERMISSIONS.VEHICLES_CREATE,
  PERMISSIONS.VEHICLES_UPDATE,
  PERMISSIONS.WEAPONS_CREATE,
  PERMISSIONS.WEAPONS_UPDATE,
  PERMISSIONS.RECORDS_CREATE,
  PERMISSIONS.MAP_CREATE,
  PERMISSIONS.MAP_UPDATE,
];

const SERGEANT_DEFAULTS = [...DEPUTY_DEFAULTS, PERMISSIONS.RECORDS_UPDATE];

const LIEUTENANT_DEFAULTS = [
  ...SERGEANT_DEFAULTS,
  PERMISSIONS.REPORTS_UPDATE_ANY,
  PERMISSIONS.REPORTS_VALIDATE,
  PERMISSIONS.ADMIN_AUDIT,
];

const CAPTAIN_DEFAULTS = [
  ...LIEUTENANT_DEFAULTS,
  PERMISSIONS.CITIZENS_DELETE,
  PERMISSIONS.VEHICLES_DELETE,
  PERMISSIONS.WEAPONS_DELETE,
  PERMISSIONS.RECORDS_DELETE,
  PERMISSIONS.MAP_DELETE,
  PERMISSIONS.AGENTS_UPDATE,
];

const UNDERSHERIFF_DEFAULTS = [
  ...CAPTAIN_DEFAULTS,
  PERMISSIONS.REPORTS_DELETE,
  PERMISSIONS.AGENTS_CREATE,
  PERMISSIONS.ADMIN_EXPORT,
];

const SHERIFF_DEFAULTS = [
  ...UNDERSHERIFF_DEFAULTS,
  PERMISSIONS.AGENTS_DELETE,
  PERMISSIONS.ADMIN_PERMISSIONS,
  PERMISSIONS.ADMIN_SETTINGS,
];

/**
 * Permissions accordées par défaut à chaque rôle.
 * L'administrateur reçoit tout, par construction.
 */
export const ROLE_DEFAULTS = {
  [ROLES.CADET]: CADET_DEFAULTS,
  [ROLES.DEPUTY]: DEPUTY_DEFAULTS,
  [ROLES.SERGEANT]: SERGEANT_DEFAULTS,
  [ROLES.LIEUTENANT]: LIEUTENANT_DEFAULTS,
  [ROLES.CAPTAIN]: CAPTAIN_DEFAULTS,
  [ROLES.UNDERSHERIFF]: UNDERSHERIFF_DEFAULTS,
  [ROLES.SHERIFF]: SHERIFF_DEFAULTS,
  [ROLES.ADMINISTRATOR]: ALL_PERMISSIONS,
};

/* ------------------------------------------------------------------ calculs */

/**
 * Compile la liste effective des permissions d'un agent.
 *
 * C'est cette liste — et elle seule — que lisent les règles Firestore. Elle est
 * recalculée à chaque enregistrement des droits d'un agent (phase 9).
 *
 * @param {object} input
 * @param {string} input.role       Rôle de l'agent
 * @param {string[]} [input.grants] Permissions ajoutées hors rôle
 * @param {string[]} [input.revokes]Permissions retirées
 * @returns {string[]} Permissions effectives, dédoublonnées et triées
 */
export function compileAbilities({ role, grants = [], revokes = [] }) {
  const base = ROLE_DEFAULTS[role] ?? [];
  const revoked = new Set(revokes);
  const effective = new Set();

  for (const permission of [...base, ...grants]) {
    if (!revoked.has(permission) && ALL_PERMISSIONS.includes(permission)) {
      effective.add(permission);
    }
  }

  return [...effective].sort();
}

/**
 * Construit le document `/permissions/{uid}` complet.
 *
 * @param {object} input
 * @param {string} input.role
 * @param {string[]} [input.grants]
 * @param {string[]} [input.revokes]
 * @param {boolean} [input.disabled]
 * @returns {{role: string, level: number, grants: string[], revokes: string[], abilities: string[], disabled: boolean}}
 */
export function buildPermissionDocument({
  role,
  grants = [],
  revokes = [],
  disabled = false,
}) {
  return {
    role,
    level: ROLE_LEVELS[role] ?? 0,
    grants: [...new Set(grants)].sort(),
    revokes: [...new Set(revokes)].sort(),
    abilities: compileAbilities({ role, grants, revokes }),
    disabled,
  };
}

/**
 * Teste une permission dans une liste effective.
 *
 * @param {string[]|null|undefined} abilities
 * @param {string} permission
 * @returns {boolean}
 */
export function hasAbility(abilities, permission) {
  if (!abilities || !permission) return false;
  return abilities.includes(permission);
}

/**
 * Teste si **au moins une** des permissions est accordée.
 * @param {string[]|null|undefined} abilities
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAnyAbility(abilities, permissions = []) {
  if (!abilities) return false;
  return permissions.some((permission) => abilities.includes(permission));
}

/**
 * Teste si **toutes** les permissions sont accordées.
 * @param {string[]|null|undefined} abilities
 * @param {string[]} permissions
 * @returns {boolean}
 */
export function hasAllAbilities(abilities, permissions = []) {
  if (!abilities) return false;
  return permissions.every((permission) => abilities.includes(permission));
}

/**
 * Niveau hiérarchique d'un rôle.
 * @param {string} role
 * @returns {number}
 */
export function levelOf(role) {
  return ROLE_LEVELS[role] ?? 0;
}

/**
 * Un rôle peut-il agir sur un autre ? Un agent ne modifie jamais quelqu'un
 * de rang supérieur ou égal (sauf administrateur sur un rang inférieur).
 *
 * @param {string} actorRole
 * @param {string} targetRole
 * @returns {boolean}
 */
export function outranks(actorRole, targetRole) {
  return levelOf(actorRole) > levelOf(targetRole);
}

/**
 * Écarts entre les permissions d'un agent et celles de son rôle.
 * Alimente l'affichage « hérité / accordé / retiré » de la matrice.
 *
 * @param {string} role
 * @param {string[]} abilities Liste effective
 * @returns {{ granted: string[], revoked: string[] }}
 */
export function diffFromRole(role, abilities = []) {
  const base = new Set(ROLE_DEFAULTS[role] ?? []);
  const effective = new Set(abilities);

  return {
    granted: [...effective].filter((permission) => !base.has(permission)).sort(),
    revoked: [...base].filter((permission) => !effective.has(permission)).sort(),
  };
}
