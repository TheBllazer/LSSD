/**
 * Constantes applicatives non métier (le métier vit dans `src/types/`).
 * Toute valeur « magique » utilisée à plus d'un endroit atterrit ici.
 */

/** Chemins de routes — jamais d'URL en dur dans les composants. */
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',

  CITIZENS: '/citizens',
  CITIZEN: (id = ':id') => `/citizens/${id}`,

  VEHICLES: '/vehicles',
  VEHICLE: (id = ':id') => `/vehicles/${id}`,

  WEAPONS: '/weapons',
  WEAPON: (id = ':id') => `/weapons/${id}`,

  REPORTS: '/reports',
  REPORT: (id = ':id') => `/reports/${id}`,
  REPORT_EDIT: (id = ':id') => `/reports/${id}/edit`,
  REPORT_NEW: '/reports/new',

  RECORDS: '/records',
  RECORD: (id = ':id') => `/records/${id}`,

  MAP: '/map',

  AGENTS: '/agents',
  AGENT: (id = ':id') => `/agents/${id}`,

  ADMIN: '/admin',
  ADMIN_AUDIT: '/admin/audit',

  FORBIDDEN: '/forbidden',
  NOT_FOUND: '*',
};

/** Types d'entités ouvrables en onglet interne (WorkspaceContext). */
export const ENTITY_TYPES = {
  CITIZEN: 'citizen',
  VEHICLE: 'vehicle',
  WEAPON: 'weapon',
  REPORT: 'report',
  RECORD: 'record',
  AGENT: 'agent',
  MAP_FEATURE: 'mapFeature',
};

/** Chemins de détail par type d'entité (navigation croisée générique). */
export const ENTITY_ROUTE = {
  [ENTITY_TYPES.CITIZEN]: (id) => ROUTES.CITIZEN(id),
  [ENTITY_TYPES.VEHICLE]: (id) => ROUTES.VEHICLE(id),
  [ENTITY_TYPES.WEAPON]: (id) => ROUTES.WEAPON(id),
  [ENTITY_TYPES.REPORT]: (id) => ROUTES.REPORT(id),
  [ENTITY_TYPES.RECORD]: (id) => ROUTES.RECORD(id),
  [ENTITY_TYPES.AGENT]: (id) => ROUTES.AGENT(id),
};

/** Clés `localStorage` — préfixées pour éviter toute collision. */
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'lssd.ui.sidebarCollapsed',
  WORKSPACE_TABS: 'lssd.ui.workspaceTabs',
  COLUMN_PREFS: 'lssd.ui.columns',
  SPLIT_SIZES: 'lssd.ui.splitSizes',
  DENSITY: 'lssd.ui.density',
  QUERY_CACHE: 'lssd.cache.query',
  LAST_EMAIL: 'lssd.auth.lastEmail',
};

/** Réglages temporels de l'interface (millisecondes). */
export const TIMING = {
  SEARCH_DEBOUNCE: 120,
  AUTOSAVE_DELAY: 1200,
  AUTOSAVE_INTERVAL: 20000,
  PRESENCE_HEARTBEAT: 60000,
  TOAST_DURATION: 4000,
  TOOLTIP_DELAY: 400,
  CONFIRM_UNLOCK: 1500,
};

/** Pagination des registres. */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [25, 50, 100],
  SEARCH_RESULT_LIMIT: 8,
};

/** Durées de fraîcheur du cache TanStack Query. */
export const CACHE = {
  STALE_TIME: 60_000,
  GC_TIME: 30 * 60_000,
  SEARCH_INDEX_STALE: 5 * 60_000,
};

/** Hôtes autorisés pour les photos (les URL sont uniquement des liens). */
export const ALLOWED_IMAGE_HOSTS = [
  'i.postimg.cc',
  'postimg.cc',
  'i.postimage.org',
];

export default {
  ROUTES,
  ENTITY_TYPES,
  ENTITY_ROUTE,
  STORAGE_KEYS,
  TIMING,
  PAGINATION,
  CACHE,
  ALLOWED_IMAGE_HOSTS,
};
