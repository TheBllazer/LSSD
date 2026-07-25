/**
 * Référentiels du registre des armes.
 */

/** Catégorie d'arme. */
export const WEAPON_CATEGORIES = {
  HANDGUN: 'HANDGUN',
  RIFLE: 'RIFLE',
  SHOTGUN: 'SHOTGUN',
  SMG: 'SMG',
  SNIPER: 'SNIPER',
  MELEE: 'MELEE',
  EXPLOSIVE: 'EXPLOSIVE',
  OTHER: 'OTHER',
};

export const WEAPON_CATEGORY_LABELS = {
  [WEAPON_CATEGORIES.HANDGUN]: 'Arme de poing',
  [WEAPON_CATEGORIES.RIFLE]: 'Fusil',
  [WEAPON_CATEGORIES.SHOTGUN]: 'Fusil à pompe',
  [WEAPON_CATEGORIES.SMG]: 'Pistolet-mitrailleur',
  [WEAPON_CATEGORIES.SNIPER]: 'Fusil de précision',
  [WEAPON_CATEGORIES.MELEE]: 'Arme blanche',
  [WEAPON_CATEGORIES.EXPLOSIVE]: 'Explosif',
  [WEAPON_CATEGORIES.OTHER]: 'Autre',
};

/**
 * Classification légale.
 * Elle détermine si la détention exige un permis de port d'arme valide.
 */
export const WEAPON_CLASSIFICATIONS = {
  CIVIL: 'CIVIL',
  RESTRICTED: 'RESTRICTED',
  PROHIBITED: 'PROHIBITED',
  LAW_ENFORCEMENT: 'LAW_ENFORCEMENT',
};

export const WEAPON_CLASSIFICATION_LABELS = {
  [WEAPON_CLASSIFICATIONS.CIVIL]: 'Vente libre',
  [WEAPON_CLASSIFICATIONS.RESTRICTED]: 'Soumise à autorisation',
  [WEAPON_CLASSIFICATIONS.PROHIBITED]: 'Prohibée',
  [WEAPON_CLASSIFICATIONS.LAW_ENFORCEMENT]: 'Réservée aux forces de l\'ordre',
};

/**
 * Classifications exigeant un permis de port d'arme valide chez le détenteur.
 * Sert à déclencher l'alerte de la fiche.
 */
export const LICENSE_REQUIRED_CLASSIFICATIONS = [
  WEAPON_CLASSIFICATIONS.RESTRICTED,
  WEAPON_CLASSIFICATIONS.PROHIBITED,
];

/** Statut de l'arme dans le registre. */
export const WEAPON_STATUS = {
  REGISTERED: 'REGISTERED',
  SEIZED: 'SEIZED',
  STOLEN: 'STOLEN',
  DESTROYED: 'DESTROYED',
  LOST: 'LOST',
};

export const WEAPON_STATUS_LABELS = {
  [WEAPON_STATUS.REGISTERED]: 'Enregistrée',
  [WEAPON_STATUS.SEIZED]: 'Saisie',
  [WEAPON_STATUS.STOLEN]: 'Déclarée volée',
  [WEAPON_STATUS.DESTROYED]: 'Détruite',
  [WEAPON_STATUS.LOST]: 'Perdue',
};

/** Calibres courants, proposés à la saisie. */
export const COMMON_CALIBERS = [
  '.22 LR', '.38 Special', '.357 Magnum', '.44 Magnum', '.45 ACP',
  '9 mm', '10 mm', '5.56 mm', '7.62 mm', '12 gauge', '20 gauge',
  '.50 BMG', '.308 Winchester', 'Non applicable',
];

/** Événements de la chronologie d'une arme. */
export const WEAPON_EVENTS = {
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  ARCHIVED: 'ARCHIVED',
  RESTORED: 'RESTORED',
  OWNER_ASSIGNED: 'OWNER_ASSIGNED',
  OWNER_REMOVED: 'OWNER_REMOVED',
  SEIZED: 'SEIZED',
  RETURNED: 'RETURNED',
  REPORT_LINKED: 'REPORT_LINKED',
};

export const WEAPON_EVENT_LABELS = {
  [WEAPON_EVENTS.CREATED]: 'Arme enregistrée',
  [WEAPON_EVENTS.UPDATED]: 'Fiche modifiée',
  [WEAPON_EVENTS.ARCHIVED]: 'Fiche archivée',
  [WEAPON_EVENTS.RESTORED]: 'Fiche restaurée',
  [WEAPON_EVENTS.OWNER_ASSIGNED]: 'Détenteur attribué',
  [WEAPON_EVENTS.OWNER_REMOVED]: 'Détenteur retiré',
  [WEAPON_EVENTS.SEIZED]: 'Arme saisie',
  [WEAPON_EVENTS.RETURNED]: 'Arme restituée',
  [WEAPON_EVENTS.REPORT_LINKED]: 'Rapport lié',
};

/** Libellés des champs, pour la chronologie. */
export const WEAPON_FIELD_LABELS = {
  serialNumber: 'Numéro de série',
  make: 'Marque',
  model: 'Modèle',
  caliber: 'Calibre',
  category: 'Catégorie',
  classification: 'Classification',
  registeredAt: "Date d'enregistrement",
  status: 'Statut',
  ownerId: 'Détenteur',
  photoUrl: 'Photographie',
  notes: 'Notes',
};
