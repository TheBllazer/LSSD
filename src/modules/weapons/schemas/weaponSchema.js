import {
  z,
  requiredString,
  optionalString,
  optionalDate,
  photoUrl,
} from '@/utils/validation';
import {
  WEAPON_CATEGORIES,
  WEAPON_CLASSIFICATIONS,
  WEAPON_STATUS,
} from '@/types/weapons';

/**
 * Schéma d'une arme.
 *
 * Le numéro de série est normalisé en majuscules : c'est l'identifiant retenu
 * lors d'une saisie sur le terrain, il ne doit pas dépendre de la casse tapée.
 */
export const weaponSchema = z.object({
  serialNumber: requiredString('Le numéro de série', 32).transform((value) =>
    value.toUpperCase().replace(/\s+/g, ''),
  ),

  make: requiredString('La marque', 40),
  model: requiredString('Le modèle', 60),
  caliber: optionalString(30),
  category: z.enum(Object.values(WEAPON_CATEGORIES)),
  classification: z.enum(Object.values(WEAPON_CLASSIFICATIONS)),

  status: z.enum(Object.values(WEAPON_STATUS)),
  registeredAt: optionalDate,

  // Référence au permis du détenteur, choisi parmi ceux de sa fiche citoyen.
  licenseNumber: optionalString(40),

  description: optionalString(1000),
  notes: optionalString(1000),
  photoUrl,

  ownerId: z.string().nullable().optional().default(null),
});

/** Valeurs par défaut d'une nouvelle arme. */
export function emptyWeapon() {
  return {
    serialNumber: '',
    make: '',
    model: '',
    caliber: '',
    category: WEAPON_CATEGORIES.HANDGUN,
    classification: WEAPON_CLASSIFICATIONS.CIVIL,
    status: WEAPON_STATUS.REGISTERED,
    registeredAt: new Date(),
    licenseNumber: '',
    description: '',
    notes: '',
    photoUrl: '',
    ownerId: null,
  };
}

/**
 * Prépare une fiche existante pour l'édition.
 * @param {object} weapon
 * @returns {object}
 */
export function toWeaponForm(weapon) {
  const base = emptyWeapon();
  if (!weapon) return base;

  return {
    ...base,
    ...weapon,
    caliber: weapon.caliber ?? '',
    licenseNumber: weapon.licenseNumber ?? '',
    description: weapon.description ?? '',
    notes: weapon.notes ?? '',
    photoUrl: weapon.photoUrl ?? '',
  };
}
