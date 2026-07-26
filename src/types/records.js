/**
 * Référentiels des casiers judiciaires.
 */

/** Nature de l'infraction. */
export const RECORD_TYPES = {
  FELONY: 'FELONY',
  MISDEMEANOR: 'MISDEMEANOR',
  INFRACTION: 'INFRACTION',
  CITATION: 'CITATION',
  WARRANT: 'WARRANT',
};

export const RECORD_TYPE_LABELS = {
  [RECORD_TYPES.FELONY]: 'Crime (felony)',
  [RECORD_TYPES.MISDEMEANOR]: 'Délit (misdemeanor)',
  [RECORD_TYPES.INFRACTION]: 'Contravention',
  [RECORD_TYPES.CITATION]: 'Citation à comparaître',
  [RECORD_TYPES.WARRANT]: "Mandat d'arrêt",
};

/** Issue de la procédure. */
export const DISPOSITIONS = {
  PENDING: 'PENDING',
  CONVICTED: 'CONVICTED',
  ACQUITTED: 'ACQUITTED',
  DISMISSED: 'DISMISSED',
  PLEA: 'PLEA',
  DIVERTED: 'DIVERTED',
};

export const DISPOSITION_LABELS = {
  [DISPOSITIONS.PENDING]: 'En instance',
  [DISPOSITIONS.CONVICTED]: 'Condamné',
  [DISPOSITIONS.ACQUITTED]: 'Relaxé',
  [DISPOSITIONS.DISMISSED]: 'Classé sans suite',
  [DISPOSITIONS.PLEA]: 'Plaider-coupable',
  [DISPOSITIONS.DIVERTED]: 'Mesure alternative',
};

/** Dispositions qui emportent une condamnation effective. */
export const CONVICTING_DISPOSITIONS = [DISPOSITIONS.CONVICTED, DISPOSITIONS.PLEA];

/** État du casier. */
export const RECORD_STATUS = {
  ACTIVE: 'ACTIVE',
  SERVED: 'SERVED',
  APPEALED: 'APPEALED',
  EXPUNGED: 'EXPUNGED',
};

export const RECORD_STATUS_LABELS = {
  [RECORD_STATUS.ACTIVE]: 'En cours',
  [RECORD_STATUS.SERVED]: 'Peine purgée',
  [RECORD_STATUS.APPEALED]: 'En appel',
  [RECORD_STATUS.EXPUNGED]: 'Effacé',
};

/** Juridictions du comté. */
export const COURTS = [
  'Los Santos Superior Court',
  'Los Santos Municipal Court',
  'Blaine County Superior Court',
  'Federal District Court',
];

/** Événements de la chronologie d'un casier. */
export const RECORD_EVENTS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  DISPOSITION_CHANGED: 'DISPOSITION_CHANGED',
  SENTENCE_UPDATED: 'SENTENCE_UPDATED',
  EXPUNGED: 'EXPUNGED',
};

export const RECORD_EVENT_LABELS = {
  [RECORD_EVENTS.CREATED]: 'Casier ouvert',
  [RECORD_EVENTS.UPDATED]: 'Casier modifié',
  [RECORD_EVENTS.ARCHIVED]: 'Casier archivé',
  [RECORD_EVENTS.RESTORED]: 'Casier restauré',
  [RECORD_EVENTS.DISPOSITION_CHANGED]: 'Changement de disposition',
  [RECORD_EVENTS.SENTENCE_UPDATED]: 'Peine modifiée',
  [RECORD_EVENTS.EXPUNGED]: 'Casier effacé',
};

/** Libellés des champs, pour la chronologie. */
export const RECORD_FIELD_LABELS = {
  number: 'Numéro de casier',
  citizenId: 'Citoyen',
  date: 'Date des faits',
  type: 'Nature',
  charges: "Chefs d'accusation",
  disposition: 'Disposition',
  sentence: 'Peine',
  court: 'Juridiction',
  judge: 'Magistrat',
  prosecutor: 'Ministère public',
  defenseAttorney: 'Défense',
  reportId: 'Rapport lié',
  status: 'État',
  mugshotUrl: 'Photographie anthropométrique',
  notes: 'Observations',
};

/**
 * Statut à appliquer au citoyen selon la peine prononcée.
 *
 * Une condamnation n'a de sens dans un RMS que si elle se reflète sur la fiche
 * de la personne : un agent qui contrôle quelqu'un doit voir « incarcéré » ou
 * « en probation » sans ouvrir le casier.
 *
 * @param {object} record
 * @returns {string|null} Statut citoyen, ou `null` si aucun changement
 */
export function citizenStatusFromRecord(record) {
  if (!CONVICTING_DISPOSITIONS.includes(record.disposition)) return null;
  if (record.status === RECORD_STATUS.EXPUNGED) return null;
  if (record.status === RECORD_STATUS.SERVED) return 'CLEAR';

  const sentence = record.sentence ?? {};
  if ((sentence.prisonDays ?? 0) > 0) return 'INCARCERATED';
  if ((sentence.probationDays ?? 0) > 0) return 'PROBATION';
  return null;
}
