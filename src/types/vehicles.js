/**
 * Référentiels du registre des véhicules.
 */

/** Catégorie de véhicule. */
export const VEHICLE_TYPES = {
  SEDAN: 'SEDAN',
  COUPE: 'COUPE',
  SUV: 'SUV',
  TRUCK: 'TRUCK',
  VAN: 'VAN',
  MOTORCYCLE: 'MOTORCYCLE',
  SPORTS: 'SPORTS',
  MUSCLE: 'MUSCLE',
  OFFROAD: 'OFFROAD',
  EMERGENCY: 'EMERGENCY',
  INDUSTRIAL: 'INDUSTRIAL',
  BOAT: 'BOAT',
  AIRCRAFT: 'AIRCRAFT',
};

export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.SEDAN]: 'Berline',
  [VEHICLE_TYPES.COUPE]: 'Coupé',
  [VEHICLE_TYPES.SUV]: 'SUV',
  [VEHICLE_TYPES.TRUCK]: 'Camion',
  [VEHICLE_TYPES.VAN]: 'Utilitaire',
  [VEHICLE_TYPES.MOTORCYCLE]: 'Moto',
  [VEHICLE_TYPES.SPORTS]: 'Sportive',
  [VEHICLE_TYPES.MUSCLE]: 'Muscle car',
  [VEHICLE_TYPES.OFFROAD]: 'Tout-terrain',
  [VEHICLE_TYPES.EMERGENCY]: 'Véhicule de secours',
  [VEHICLE_TYPES.INDUSTRIAL]: 'Engin industriel',
  [VEHICLE_TYPES.BOAT]: 'Bateau',
  [VEHICLE_TYPES.AIRCRAFT]: 'Aéronef',
};

/** État administratif de l'immatriculation. */
export const REGISTRATION_STATUS = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  SUSPENDED: 'SUSPENDED',
  STOLEN: 'STOLEN',
  IMPOUNDED: 'IMPOUNDED',
  DESTROYED: 'DESTROYED',
  UNREGISTERED: 'UNREGISTERED',
};

export const REGISTRATION_STATUS_LABELS = {
  [REGISTRATION_STATUS.VALID]: 'Immatriculation valide',
  [REGISTRATION_STATUS.EXPIRED]: 'Immatriculation expirée',
  [REGISTRATION_STATUS.SUSPENDED]: 'Immatriculation suspendue',
  [REGISTRATION_STATUS.STOLEN]: 'Déclaré volé',
  [REGISTRATION_STATUS.IMPOUNDED]: 'En fourrière',
  [REGISTRATION_STATUS.DESTROYED]: 'Détruit',
  [REGISTRATION_STATUS.UNREGISTERED]: 'Non immatriculé',
};

/** Couverture d'assurance. */
export const INSURANCE_STATUS = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  NONE: 'NONE',
};

export const INSURANCE_STATUS_LABELS = {
  [INSURANCE_STATUS.VALID]: 'Assuré',
  [INSURANCE_STATUS.EXPIRED]: 'Assurance expirée',
  [INSURANCE_STATUS.NONE]: 'Non assuré',
};

/** Signalements opérationnels portés sur un véhicule. */
export const VEHICLE_FLAGS = {
  STOLEN: 'STOLEN',
  BOLO: 'BOLO',
  ARMED_OCCUPANTS: 'ARMED_OCCUPANTS',
  EVIDENCE: 'EVIDENCE',
  SURVEILLANCE: 'SURVEILLANCE',
};

export const VEHICLE_FLAG_LABELS = {
  [VEHICLE_FLAGS.STOLEN]: 'Véhicule volé',
  [VEHICLE_FLAGS.BOLO]: 'Avis de recherche',
  [VEHICLE_FLAGS.ARMED_OCCUPANTS]: 'Occupants armés',
  [VEHICLE_FLAGS.EVIDENCE]: 'Pièce à conviction',
  [VEHICLE_FLAGS.SURVEILLANCE]: 'Sous surveillance',
};

/** Événements de la chronologie d'un véhicule. */
export const VEHICLE_EVENTS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  OWNER_ASSIGNED: 'OWNER_ASSIGNED',
  OWNER_REMOVED: 'OWNER_REMOVED',
  IMPOUNDED: 'IMPOUNDED',
  RELEASED: 'RELEASED',
  FLAGGED: 'FLAGGED',
  REPORT_LINKED: 'REPORT_LINKED',
};

export const VEHICLE_EVENT_LABELS = {
  [VEHICLE_EVENTS.CREATED]: 'Véhicule enregistré',
  [VEHICLE_EVENTS.UPDATED]: 'Fiche modifiée',
  [VEHICLE_EVENTS.ARCHIVED]: 'Fiche archivée',
  [VEHICLE_EVENTS.RESTORED]: 'Fiche restaurée',
  [VEHICLE_EVENTS.OWNER_ASSIGNED]: 'Propriétaire attribué',
  [VEHICLE_EVENTS.OWNER_REMOVED]: 'Propriétaire retiré',
  [VEHICLE_EVENTS.IMPOUNDED]: 'Mise en fourrière',
  [VEHICLE_EVENTS.RELEASED]: 'Sortie de fourrière',
  [VEHICLE_EVENTS.FLAGGED]: 'Signalement modifié',
  [VEHICLE_EVENTS.REPORT_LINKED]: 'Rapport lié',
};

/** Libellés des champs, pour la chronologie. */
export const VEHICLE_FIELD_LABELS = {
  plate: 'Plaque',
  vin: 'Numéro de série (VIN)',
  make: 'Marque',
  model: 'Modèle',
  year: 'Année',
  color: 'Couleur',
  type: 'Type',
  registrationStatus: 'Immatriculation',
  insurance: 'Assurance',
  condition: 'État',
  description: 'Description',
  photoUrl: 'Photographie',
  ownerId: 'Propriétaire',
  flags: 'Signalements',
  impound: 'Fourrière',
};

/** Couleurs les plus fréquentes, proposées à la saisie. */
export const COMMON_COLORS = [
  'Noir', 'Blanc', 'Gris', 'Argent', 'Rouge', 'Bleu', 'Vert',
  'Jaune', 'Orange', 'Marron', 'Beige', 'Violet', 'Rose', 'Bicolore',
];
