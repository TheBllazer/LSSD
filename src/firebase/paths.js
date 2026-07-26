/**
 * Chemins Firestore centralisés.
 *
 * Aucune chaîne de collection ne doit apparaître ailleurs dans le code :
 * un renommage se fait ici et nulle part ailleurs.
 * Voir `docs/02-FIRESTORE-SCHEMA.md` pour la description des documents.
 */

export const COLLECTIONS = {
  AGENTS: 'agents',
  PERMISSIONS: 'permissions',
  CITIZENS: 'citizens',
  VEHICLES: 'vehicles',
  WEAPONS: 'weapons',
  REPORTS: 'reports',
  CRIMINAL_RECORDS: 'criminalRecords',
  MAP_FEATURES: 'mapFeatures',
  SEARCH_INDEX: 'searchIndex',
  AUDIT_LOGS: 'auditLogs',
  NOTIFICATIONS: 'notifications',
  PRESENCE: 'presence',
  COUNTERS: 'counters',
  STATS: 'stats',
  SETTINGS: 'settings',
};

/** Sous-collections, par entité parente. */
export const SUBCOLLECTIONS = {
  HISTORY: 'history',
  PHOTOS: 'photos',
  NOTES: 'notes',
  REVISIONS: 'revisions',
  ATTACHMENTS: 'attachments',
  COMMENTS: 'comments',
  ACTIVITY: 'activity',
  FAVORITES: 'favorites',
  RECENT_SEARCHES: 'recentSearches',
};

/** Identifiants de documents uniques. */
export const DOC_IDS = {
  DASHBOARD_STATS: 'dashboard',
  APP_SETTINGS: 'app',
  COUNTER_REPORTS: 'reports',
  COUNTER_RECORDS: 'criminalRecords',
  COUNTER_CITIZENS: 'citizens',
};

/**
 * Construit la clé d'un document de l'index de recherche global.
 * @param {string} type Type d'entité (`citizen`, `vehicle`, …)
 * @param {string} id   Identifiant du document source
 * @returns {string}
 */
export const searchIndexKey = (type, id) => `${type}_${id}`;

/** Chemins de sous-collections (helpers typés côté JSDoc). */
export const paths = {
  citizenHistory: (citizenId) =>
    [COLLECTIONS.CITIZENS, citizenId, SUBCOLLECTIONS.HISTORY],
  citizenPhotos: (citizenId) =>
    [COLLECTIONS.CITIZENS, citizenId, SUBCOLLECTIONS.PHOTOS],
  citizenNotes: (citizenId) =>
    [COLLECTIONS.CITIZENS, citizenId, SUBCOLLECTIONS.NOTES],

  vehicleHistory: (vehicleId) =>
    [COLLECTIONS.VEHICLES, vehicleId, SUBCOLLECTIONS.HISTORY],
  weaponHistory: (weaponId) =>
    [COLLECTIONS.WEAPONS, weaponId, SUBCOLLECTIONS.HISTORY],

  reportHistory: (reportId) =>
    [COLLECTIONS.REPORTS, reportId, SUBCOLLECTIONS.HISTORY],
  reportRevisions: (reportId) =>
    [COLLECTIONS.REPORTS, reportId, SUBCOLLECTIONS.REVISIONS],
  reportAttachments: (reportId) =>
    [COLLECTIONS.REPORTS, reportId, SUBCOLLECTIONS.ATTACHMENTS],
  reportComments: (reportId) =>
    [COLLECTIONS.REPORTS, reportId, SUBCOLLECTIONS.COMMENTS],

  recordComments: (recordId) =>
    [COLLECTIONS.CRIMINAL_RECORDS, recordId, SUBCOLLECTIONS.COMMENTS],

  agentActivity: (uid) => [COLLECTIONS.AGENTS, uid, SUBCOLLECTIONS.ACTIVITY],
  agentFavorites: (uid) => [COLLECTIONS.AGENTS, uid, SUBCOLLECTIONS.FAVORITES],
  agentRecentSearches: (uid) =>
    [COLLECTIONS.AGENTS, uid, SUBCOLLECTIONS.RECENT_SEARCHES],
};

export default { COLLECTIONS, SUBCOLLECTIONS, DOC_IDS, paths, searchIndexKey };
