/**
 * Référentiels des rapports d'incident.
 */

/** Nature du rapport. */
export const REPORT_TYPES = {
  INCIDENT: 'INCIDENT',
  ARREST: 'ARREST',
  TRAFFIC: 'TRAFFIC',
  USE_OF_FORCE: 'USE_OF_FORCE',
  FIELD_INTERVIEW: 'FIELD_INTERVIEW',
  SUPPLEMENTAL: 'SUPPLEMENTAL',
  WARRANT: 'WARRANT',
  MISSING_PERSON: 'MISSING_PERSON',
  PROPERTY: 'PROPERTY',
};

export const REPORT_TYPE_LABELS = {
  [REPORT_TYPES.INCIDENT]: "Rapport d'incident",
  [REPORT_TYPES.ARREST]: "Rapport d'arrestation",
  [REPORT_TYPES.TRAFFIC]: 'Contrôle routier',
  [REPORT_TYPES.USE_OF_FORCE]: 'Usage de la force',
  [REPORT_TYPES.FIELD_INTERVIEW]: 'Contrôle d\'identité',
  [REPORT_TYPES.SUPPLEMENTAL]: 'Rapport complémentaire',
  [REPORT_TYPES.WARRANT]: 'Exécution de mandat',
  [REPORT_TYPES.MISSING_PERSON]: 'Disparition',
  [REPORT_TYPES.PROPERTY]: 'Saisie de biens',
};

/**
 * Niveau de confidentialité.
 * Les règles Firestore s'appuient dessus : `CONFIDENTIAL` exige le niveau 50,
 * `SEALED` le niveau 70 — voir `firebase/firestore.rules`.
 */
export const REPORT_CLASSIFICATIONS = {
  PUBLIC: 'PUBLIC',
  RESTRICTED: 'RESTRICTED',
  CONFIDENTIAL: 'CONFIDENTIAL',
  SEALED: 'SEALED',
};

export const REPORT_CLASSIFICATION_LABELS = {
  [REPORT_CLASSIFICATIONS.PUBLIC]: 'Public',
  [REPORT_CLASSIFICATIONS.RESTRICTED]: 'Diffusion restreinte',
  [REPORT_CLASSIFICATIONS.CONFIDENTIAL]: 'Confidentiel',
  [REPORT_CLASSIFICATIONS.SEALED]: 'Scellé',
};

/** Niveau hiérarchique minimum requis pour lire chaque classification. */
export const CLASSIFICATION_MIN_LEVEL = {
  [REPORT_CLASSIFICATIONS.PUBLIC]: 0,
  [REPORT_CLASSIFICATIONS.RESTRICTED]: 0,
  [REPORT_CLASSIFICATIONS.CONFIDENTIAL]: 50,
  [REPORT_CLASSIFICATIONS.SEALED]: 70,
};

/**
 * Classifications qu'un agent peut lire à son niveau.
 *
 * Indispensable côté requête, pas seulement côté affichage : les règles
 * Firestore évaluent la classification document par document, et une requête
 * de liste est rejetée en bloc si l'un des documents candidats échoue. La
 * requête doit donc porter elle-même la contrainte — « les règles ne sont pas
 * des filtres ».
 *
 * @param {number} level Niveau hiérarchique de l'agent
 * @returns {string[]}
 */
export function visibleClassifications(level) {
  return Object.entries(CLASSIFICATION_MIN_LEVEL)
    .filter(([, minimum]) => level >= minimum)
    .map(([classification]) => classification);
}

/** Étapes du circuit de validation. */
export const REPORT_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
};

export const REPORT_STATUS_LABELS = {
  [REPORT_STATUS.DRAFT]: 'Brouillon',
  [REPORT_STATUS.SUBMITTED]: 'Soumis',
  [REPORT_STATUS.UNDER_REVIEW]: 'En cours de revue',
  [REPORT_STATUS.APPROVED]: 'Approuvé',
  [REPORT_STATUS.REJECTED]: 'Rejeté',
  [REPORT_STATUS.CLOSED]: 'Clos',
};

/**
 * Transitions autorisées du circuit de validation.
 *
 * Cette table est la référence unique du workflow : l'interface n'affiche que
 * les transitions possibles, et le service refuse les autres. Les règles
 * Firestore verrouillent en parallèle la modification du contenu après
 * approbation.
 */
export const REPORT_TRANSITIONS = {
  [REPORT_STATUS.DRAFT]: [REPORT_STATUS.SUBMITTED],
  [REPORT_STATUS.SUBMITTED]: [REPORT_STATUS.UNDER_REVIEW, REPORT_STATUS.DRAFT],
  [REPORT_STATUS.UNDER_REVIEW]: [REPORT_STATUS.APPROVED, REPORT_STATUS.REJECTED],
  [REPORT_STATUS.REJECTED]: [REPORT_STATUS.DRAFT],
  [REPORT_STATUS.APPROVED]: [REPORT_STATUS.CLOSED],
  [REPORT_STATUS.CLOSED]: [],
};

/** Statuts dans lesquels l'auteur peut encore modifier le contenu. */
export const EDITABLE_STATUSES = [
  REPORT_STATUS.DRAFT,
  REPORT_STATUS.SUBMITTED,
  REPORT_STATUS.REJECTED,
];

/** Transitions relevant du pouvoir de validation (permission dédiée). */
export const REVIEW_TRANSITIONS = [
  REPORT_STATUS.UNDER_REVIEW,
  REPORT_STATUS.APPROVED,
  REPORT_STATUS.REJECTED,
];

/** Priorité opérationnelle. */
export const REPORT_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const REPORT_PRIORITY_LABELS = {
  [REPORT_PRIORITIES.LOW]: 'Basse',
  [REPORT_PRIORITIES.MEDIUM]: 'Normale',
  [REPORT_PRIORITIES.HIGH]: 'Haute',
  [REPORT_PRIORITIES.CRITICAL]: 'Critique',
};

/** Rôle tenu par un citoyen dans l'affaire. */
export const CITIZEN_ROLES = {
  SUSPECT: 'SUSPECT',
  VICTIM: 'VICTIM',
  WITNESS: 'WITNESS',
  COMPLAINANT: 'COMPLAINANT',
  MISSING: 'MISSING',
  OTHER: 'OTHER',
};

export const CITIZEN_ROLE_LABELS = {
  [CITIZEN_ROLES.SUSPECT]: 'Suspect',
  [CITIZEN_ROLES.VICTIM]: 'Victime',
  [CITIZEN_ROLES.WITNESS]: 'Témoin',
  [CITIZEN_ROLES.COMPLAINANT]: 'Plaignant',
  [CITIZEN_ROLES.MISSING]: 'Personne disparue',
  [CITIZEN_ROLES.OTHER]: 'Autre',
};

/** Rôle tenu par un agent. */
export const AGENT_ROLES = {
  PRIMARY: 'PRIMARY',
  ASSIST: 'ASSIST',
  SUPERVISOR: 'SUPERVISOR',
  WITNESS: 'WITNESS',
};

export const AGENT_ROLE_LABELS = {
  [AGENT_ROLES.PRIMARY]: 'Agent principal',
  [AGENT_ROLES.ASSIST]: 'Renfort',
  [AGENT_ROLES.SUPERVISOR]: 'Superviseur',
  [AGENT_ROLES.WITNESS]: 'Témoin',
};

/** Rôle tenu par un véhicule. */
export const VEHICLE_ROLES = {
  SUSPECT: 'SUSPECT',
  VICTIM: 'VICTIM',
  IMPOUNDED: 'IMPOUNDED',
  WITNESS: 'WITNESS',
};

export const VEHICLE_ROLE_LABELS = {
  [VEHICLE_ROLES.SUSPECT]: 'Véhicule suspect',
  [VEHICLE_ROLES.VICTIM]: 'Véhicule victime',
  [VEHICLE_ROLES.IMPOUNDED]: 'Mis en fourrière',
  [VEHICLE_ROLES.WITNESS]: 'Véhicule témoin',
};

/** Rôle tenu par une arme. */
export const WEAPON_ROLES = {
  USED: 'USED',
  SEIZED: 'SEIZED',
  FOUND: 'FOUND',
};

export const WEAPON_ROLE_LABELS = {
  [WEAPON_ROLES.USED]: 'Arme utilisée',
  [WEAPON_ROLES.SEIZED]: 'Arme saisie',
  [WEAPON_ROLES.FOUND]: 'Arme découverte',
};

/** Événements de la chronologie d'un rapport. */
export const REPORT_EVENTS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  SIGNED: 'SIGNED',
  PARTY_ADDED: 'PARTY_ADDED',
  PARTY_REMOVED: 'PARTY_REMOVED',
  REVISION_RESTORED: 'REVISION_RESTORED',
};

export const REPORT_EVENT_LABELS = {
  [REPORT_EVENTS.CREATED]: 'Rapport créé',
  [REPORT_EVENTS.UPDATED]: 'Rapport modifié',
  [REPORT_EVENTS.ARCHIVED]: 'Rapport archivé',
  [REPORT_EVENTS.RESTORED]: 'Rapport restauré',
  [REPORT_EVENTS.STATUS_CHANGED]: 'Changement de statut',
  [REPORT_EVENTS.SIGNED]: 'Rapport signé',
  [REPORT_EVENTS.PARTY_ADDED]: 'Partie ajoutée',
  [REPORT_EVENTS.PARTY_REMOVED]: 'Partie retirée',
  [REPORT_EVENTS.REVISION_RESTORED]: 'Version restaurée',
};

/** Libellés des champs, pour la chronologie. */
export const REPORT_FIELD_LABELS = {
  title: 'Titre',
  type: 'Type',
  classification: 'Classification',
  status: 'Statut',
  priority: 'Priorité',
  occurredAt: 'Date des faits',
  location: 'Lieu',
  summary: 'Résumé',
  content: 'Corps du rapport',
  charges: "Chefs d'accusation",
  involvedCitizens: 'Citoyens impliqués',
  involvedAgents: 'Agents impliqués',
  involvedVehicles: 'Véhicules impliqués',
  involvedWeapons: 'Armes impliquées',
  photos: 'Photographies',
};

/** Nombre de révisions conservées par rapport. */
export const MAX_REVISIONS = 30;
