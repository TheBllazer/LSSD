/**
 * Référentiels du registre des citoyens.
 *
 * Les valeurs stockées sont les clés (stables, indépendantes de la langue) ;
 * les libellés ne servent qu'à l'affichage et aux documents PDF.
 */

/** Sexe déclaré à l'état civil. */
export const SEX = { M: 'M', F: 'F', X: 'X' };

export const SEX_LABELS = {
  [SEX.M]: 'Masculin',
  [SEX.F]: 'Féminin',
  [SEX.X]: 'Non précisé',
};

/** Abréviation portée sur les listes et les fiches. */
export const SEX_ABBR = { [SEX.M]: 'H', [SEX.F]: 'F', [SEX.X]: 'X' };

/** Statut judiciaire courant. */
export const CITIZEN_STATUS = {
  CLEAR: 'CLEAR',
  WANTED: 'WANTED',
  INCARCERATED: 'INCARCERATED',
  PROBATION: 'PROBATION',
  DECEASED: 'DECEASED',
  MISSING: 'MISSING',
};

export const CITIZEN_STATUS_LABELS = {
  [CITIZEN_STATUS.CLEAR]: 'Aucun signalement',
  [CITIZEN_STATUS.WANTED]: 'Recherché',
  [CITIZEN_STATUS.INCARCERATED]: 'Incarcéré',
  [CITIZEN_STATUS.PROBATION]: 'En probation',
  [CITIZEN_STATUS.DECEASED]: 'Décédé',
  [CITIZEN_STATUS.MISSING]: 'Porté disparu',
};

/**
 * Signalements opérationnels.
 * Ils s'affichent en rouge sur la fiche : ce sont les informations qu'un agent
 * doit voir avant d'engager un contact.
 */
export const CITIZEN_FLAGS = {
  ARMED_DANGEROUS: 'ARMED_DANGEROUS',
  GANG_MEMBER: 'GANG_MEMBER',
  MENTAL_HEALTH: 'MENTAL_HEALTH',
  FLIGHT_RISK: 'FLIGHT_RISK',
  VIOLENT: 'VIOLENT',
  INFORMANT: 'INFORMANT',
  MEDICAL: 'MEDICAL',
};

export const CITIZEN_FLAG_LABELS = {
  [CITIZEN_FLAGS.ARMED_DANGEROUS]: 'Armé et dangereux',
  [CITIZEN_FLAGS.GANG_MEMBER]: 'Membre de gang',
  [CITIZEN_FLAGS.MENTAL_HEALTH]: 'Trouble psychiatrique',
  [CITIZEN_FLAGS.FLIGHT_RISK]: 'Risque de fuite',
  [CITIZEN_FLAGS.VIOLENT]: 'Antécédents violents',
  [CITIZEN_FLAGS.INFORMANT]: 'Informateur',
  [CITIZEN_FLAGS.MEDICAL]: 'Condition médicale',
};

/** Types de permis délivrés dans le comté. */
export const LICENSE_TYPES = {
  DRIVER: 'DRIVER',
  FIREARM: 'FIREARM',
  HUNTING: 'HUNTING',
  FISHING: 'FISHING',
  PILOT: 'PILOT',
  BOATING: 'BOATING',
  COMMERCIAL: 'COMMERCIAL',
};

export const LICENSE_TYPE_LABELS = {
  [LICENSE_TYPES.DRIVER]: 'Permis de conduire',
  [LICENSE_TYPES.FIREARM]: "Port d'arme",
  [LICENSE_TYPES.HUNTING]: 'Permis de chasse',
  [LICENSE_TYPES.FISHING]: 'Permis de pêche',
  [LICENSE_TYPES.PILOT]: 'Licence de pilote',
  [LICENSE_TYPES.BOATING]: 'Permis bateau',
  [LICENSE_TYPES.COMMERCIAL]: 'Licence professionnelle',
};

/** Validité d'un permis. */
export const LICENSE_STATUS = {
  VALID: 'VALID',
  SUSPENDED: 'SUSPENDED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
  NONE: 'NONE',
};

export const LICENSE_STATUS_LABELS = {
  [LICENSE_STATUS.VALID]: 'Valide',
  [LICENSE_STATUS.SUSPENDED]: 'Suspendu',
  [LICENSE_STATUS.REVOKED]: 'Révoqué',
  [LICENSE_STATUS.EXPIRED]: 'Expiré',
  [LICENSE_STATUS.NONE]: 'Non délivré',
};

/** Nature d'une affiliation. */
export const AFFILIATION_TYPES = {
  GANG: 'GANG',
  ORGANIZATION: 'ORGANIZATION',
  BUSINESS: 'BUSINESS',
  FAMILY: 'FAMILY',
};

export const AFFILIATION_TYPE_LABELS = {
  [AFFILIATION_TYPES.GANG]: 'Gang',
  [AFFILIATION_TYPES.ORGANIZATION]: 'Organisation',
  [AFFILIATION_TYPES.BUSINESS]: 'Entreprise',
  [AFFILIATION_TYPES.FAMILY]: 'Famille',
};

/** Couleurs d'yeux relevées au signalement. */
export const EYE_COLORS = {
  BROWN: 'BROWN',
  BLUE: 'BLUE',
  GREEN: 'GREEN',
  HAZEL: 'HAZEL',
  GRAY: 'GRAY',
  BLACK: 'BLACK',
  OTHER: 'OTHER',
};

export const EYE_COLOR_LABELS = {
  [EYE_COLORS.BROWN]: 'Marron',
  [EYE_COLORS.BLUE]: 'Bleu',
  [EYE_COLORS.GREEN]: 'Vert',
  [EYE_COLORS.HAZEL]: 'Noisette',
  [EYE_COLORS.GRAY]: 'Gris',
  [EYE_COLORS.BLACK]: 'Noir',
  [EYE_COLORS.OTHER]: 'Autre',
};

/** Couleurs de cheveux relevées au signalement. */
export const HAIR_COLORS = {
  BLACK: 'BLACK',
  BROWN: 'BROWN',
  BLOND: 'BLOND',
  RED: 'RED',
  GRAY: 'GRAY',
  WHITE: 'WHITE',
  BALD: 'BALD',
  OTHER: 'OTHER',
};

export const HAIR_COLOR_LABELS = {
  [HAIR_COLORS.BLACK]: 'Noirs',
  [HAIR_COLORS.BROWN]: 'Châtains',
  [HAIR_COLORS.BLOND]: 'Blonds',
  [HAIR_COLORS.RED]: 'Roux',
  [HAIR_COLORS.GRAY]: 'Grisonnants',
  [HAIR_COLORS.WHITE]: 'Blancs',
  [HAIR_COLORS.BALD]: 'Chauve',
  [HAIR_COLORS.OTHER]: 'Autre',
};

/** Catégories de photographies d'une fiche. */
export const PHOTO_CATEGORIES = {
  MUGSHOT: 'MUGSHOT',
  SCENE: 'SCENE',
  TATTOO: 'TATTOO',
  EVIDENCE: 'EVIDENCE',
  OTHER: 'OTHER',
};

export const PHOTO_CATEGORY_LABELS = {
  [PHOTO_CATEGORIES.MUGSHOT]: 'Photo anthropométrique',
  [PHOTO_CATEGORIES.SCENE]: 'Scène',
  [PHOTO_CATEGORIES.TATTOO]: 'Tatouage',
  [PHOTO_CATEGORIES.EVIDENCE]: 'Pièce à conviction',
  [PHOTO_CATEGORIES.OTHER]: 'Autre',
};

/** Types d'événements de la chronologie d'un citoyen. */
export const CITIZEN_EVENTS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  ARREST: 'ARREST',
  CITATION: 'CITATION',
  REPORT_LINKED: 'REPORT_LINKED',
  VEHICLE_ADDED: 'VEHICLE_ADDED',
  VEHICLE_REMOVED: 'VEHICLE_REMOVED',
  WEAPON_ADDED: 'WEAPON_ADDED',
  WEAPON_REMOVED: 'WEAPON_REMOVED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  NOTE_ADDED: 'NOTE_ADDED',
};

export const CITIZEN_EVENT_LABELS = {
  [CITIZEN_EVENTS.CREATED]: 'Fiche créée',
  [CITIZEN_EVENTS.UPDATED]: 'Fiche modifiée',
  [CITIZEN_EVENTS.ARCHIVED]: 'Fiche archivée',
  [CITIZEN_EVENTS.RESTORED]: 'Fiche restaurée',
  [CITIZEN_EVENTS.ARREST]: 'Arrestation',
  [CITIZEN_EVENTS.CITATION]: 'Citation',
  [CITIZEN_EVENTS.REPORT_LINKED]: 'Rapport lié',
  [CITIZEN_EVENTS.VEHICLE_ADDED]: 'Véhicule enregistré',
  [CITIZEN_EVENTS.VEHICLE_REMOVED]: 'Véhicule retiré',
  [CITIZEN_EVENTS.WEAPON_ADDED]: 'Arme enregistrée',
  [CITIZEN_EVENTS.WEAPON_REMOVED]: 'Arme retirée',
  [CITIZEN_EVENTS.STATUS_CHANGED]: 'Changement de statut',
  [CITIZEN_EVENTS.NOTE_ADDED]: 'Note ajoutée',
};

/**
 * Transforme un dictionnaire de libellés en options de liste déroulante.
 * @param {Record<string, string>} labels
 * @returns {{value: string, label: string}[]}
 */
export function toOptions(labels) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}
