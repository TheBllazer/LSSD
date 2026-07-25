/**
 * Référentiels du personnel.
 *
 * Ces valeurs sont les valeurs par défaut compilées dans l'application. À
 * partir de la phase 9, elles peuvent être surchargées par le document
 * `/settings/app` sans redéploiement — la forme reste identique.
 */

/** Grades affichés (distincts du rôle, qui porte les permissions). */
export const RANKS = {
  SHERIFF: 'SHERIFF',
  UNDERSHERIFF: 'UNDERSHERIFF',
  CAPTAIN: 'CAPTAIN',
  LIEUTENANT: 'LIEUTENANT',
  SERGEANT: 'SERGEANT',
  CORPORAL: 'CORPORAL',
  DEPUTY: 'DEPUTY',
  CADET: 'CADET',
};

export const RANK_LABELS = {
  [RANKS.SHERIFF]: 'Sheriff',
  [RANKS.UNDERSHERIFF]: 'Undersheriff',
  [RANKS.CAPTAIN]: 'Captain',
  [RANKS.LIEUTENANT]: 'Lieutenant',
  [RANKS.SERGEANT]: 'Sergeant',
  [RANKS.CORPORAL]: 'Corporal',
  [RANKS.DEPUTY]: 'Deputy',
  [RANKS.CADET]: 'Cadet',
};

/** Abréviation portée sur les listes, les rapports et les PDF. */
export const RANK_ABBR = {
  [RANKS.SHERIFF]: 'SHF',
  [RANKS.UNDERSHERIFF]: 'USH',
  [RANKS.CAPTAIN]: 'CPT',
  [RANKS.LIEUTENANT]: 'LT',
  [RANKS.SERGEANT]: 'SGT',
  [RANKS.CORPORAL]: 'CPL',
  [RANKS.DEPUTY]: 'DEP',
  [RANKS.CADET]: 'CDT',
};

/** Divisions du service. */
export const DIVISIONS = {
  PATROL: 'PATROL',
  INVESTIGATIONS: 'INVESTIGATIONS',
  SWAT: 'SWAT',
  AIR: 'AIR',
  TRAFFIC: 'TRAFFIC',
  CUSTODY: 'CUSTODY',
  ADMIN: 'ADMIN',
};

export const DIVISION_LABELS = {
  [DIVISIONS.PATROL]: 'Patrouille',
  [DIVISIONS.INVESTIGATIONS]: 'Investigations',
  [DIVISIONS.SWAT]: 'SWAT',
  [DIVISIONS.AIR]: 'Unité aérienne',
  [DIVISIONS.TRAFFIC]: 'Circulation',
  [DIVISIONS.CUSTODY]: 'Détention',
  [DIVISIONS.ADMIN]: 'Administration',
};

/** Statut administratif d'un agent. */
export const AGENT_STATUS = {
  ACTIVE: 'ACTIVE',
  LEAVE: 'LEAVE',
  SUSPENDED: 'SUSPENDED',
  INACTIVE: 'INACTIVE',
};

export const AGENT_STATUS_LABELS = {
  [AGENT_STATUS.ACTIVE]: 'En service',
  [AGENT_STATUS.LEAVE]: 'En congé',
  [AGENT_STATUS.SUSPENDED]: 'Suspendu',
  [AGENT_STATUS.INACTIVE]: 'Inactif',
};

/** Présence temps réel (document `/presence/{uid}`). */
export const PRESENCE_STATUS = {
  ONLINE: 'ONLINE',
  AWAY: 'AWAY',
  BUSY: 'BUSY',
  OFFLINE: 'OFFLINE',
};

export const PRESENCE_LABELS = {
  [PRESENCE_STATUS.ONLINE]: 'En ligne',
  [PRESENCE_STATUS.AWAY]: 'Absent',
  [PRESENCE_STATUS.BUSY]: 'Occupé',
  [PRESENCE_STATUS.OFFLINE]: 'Hors ligne',
};

/** Actions journalisées dans `/auditLogs`. */
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  SEARCH: 'SEARCH',
  EXPORT: 'EXPORT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  ACCESS_DENIED: 'ACCESS_DENIED',
};

export const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.CREATE]: 'Création',
  [AUDIT_ACTIONS.UPDATE]: 'Modification',
  [AUDIT_ACTIONS.DELETE]: 'Archivage',
  [AUDIT_ACTIONS.VIEW]: 'Consultation',
  [AUDIT_ACTIONS.SEARCH]: 'Recherche',
  [AUDIT_ACTIONS.EXPORT]: 'Export',
  [AUDIT_ACTIONS.LOGIN]: 'Connexion',
  [AUDIT_ACTIONS.LOGOUT]: 'Déconnexion',
  [AUDIT_ACTIONS.LOGIN_FAILED]: 'Échec de connexion',
  [AUDIT_ACTIONS.PERMISSION_CHANGE]: 'Modification des droits',
  [AUDIT_ACTIONS.ACCESS_DENIED]: 'Accès refusé',
};
