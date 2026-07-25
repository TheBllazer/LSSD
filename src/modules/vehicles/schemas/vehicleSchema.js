import {
  z,
  requiredString,
  optionalString,
  optionalDate,
  optionalPositiveInt,
  photoUrl,
} from '@/utils/validation';
import {
  VEHICLE_TYPES,
  REGISTRATION_STATUS,
  INSURANCE_STATUS,
  VEHICLE_FLAGS,
} from '@/types/vehicles';

/** Couverture d'assurance. */
export const insuranceSchema = z.object({
  status: z.enum(Object.values(INSURANCE_STATUS)),
  company: optionalString(80),
  policyNumber: optionalString(40),
  expiresAt: optionalDate,
});

/** Mise en fourrière. */
export const impoundSchema = z.object({
  isImpounded: z.boolean(),
  lot: optionalString(80),
  since: optionalDate,
  reason: optionalString(200),
});

/**
 * Schéma d'un véhicule.
 *
 * La plaque est normalisée en majuscules sans espace : c'est la clé de
 * recherche la plus utilisée sur le terrain, elle ne doit pas dépendre de la
 * façon dont l'agent l'a tapée.
 */
export const vehicleSchema = z.object({
  plate: requiredString("La plaque d'immatriculation", 12).transform((value) =>
    value.toUpperCase().replace(/\s+/g, ''),
  ),
  vin: optionalString(24).transform((value) => (value ? value.toUpperCase() : null)),

  make: requiredString('La marque', 40),
  model: requiredString('Le modèle', 60),
  year: optionalPositiveInt("L'année", 2100),
  color: optionalString(40),
  type: z.enum(Object.values(VEHICLE_TYPES)),

  registrationStatus: z.enum(Object.values(REGISTRATION_STATUS)),
  insurance: insuranceSchema.default({
    status: INSURANCE_STATUS.NONE,
    company: null,
    policyNumber: null,
    expiresAt: null,
  }),
  impound: impoundSchema.default({
    isImpounded: false,
    lot: null,
    since: null,
    reason: null,
  }),

  condition: optionalString(500),
  description: optionalString(1000),
  notes: optionalString(1000),

  flags: z.array(z.enum(Object.values(VEHICLE_FLAGS))).max(5).default([]),
  photoUrl,

  // Le propriétaire est posé à la création ; les changements ultérieurs
  // passent par `assignOwner`, qui tient les compteurs et les historiques.
  ownerId: z.string().nullable().optional().default(null),
});

/** Valeurs par défaut d'un nouveau véhicule. */
export function emptyVehicle() {
  return {
    plate: '',
    vin: '',
    make: '',
    model: '',
    year: null,
    color: '',
    type: VEHICLE_TYPES.SEDAN,
    registrationStatus: REGISTRATION_STATUS.VALID,
    insurance: {
      status: INSURANCE_STATUS.NONE,
      company: '',
      policyNumber: '',
      expiresAt: null,
    },
    impound: { isImpounded: false, lot: '', since: null, reason: '' },
    condition: '',
    description: '',
    notes: '',
    flags: [],
    photoUrl: '',
    ownerId: null,
  };
}

/**
 * Prépare une fiche existante pour l'édition.
 * @param {object} vehicle
 * @returns {object}
 */
export function toVehicleForm(vehicle) {
  const base = emptyVehicle();
  if (!vehicle) return base;

  return {
    ...base,
    ...vehicle,
    vin: vehicle.vin ?? '',
    color: vehicle.color ?? '',
    condition: vehicle.condition ?? '',
    description: vehicle.description ?? '',
    notes: vehicle.notes ?? '',
    photoUrl: vehicle.photoUrl ?? '',
    flags: vehicle.flags ?? [],
    insurance: {
      status: vehicle.insurance?.status ?? INSURANCE_STATUS.NONE,
      company: vehicle.insurance?.company ?? '',
      policyNumber: vehicle.insurance?.policyNumber ?? '',
      expiresAt: vehicle.insurance?.expiresAt ?? null,
    },
    impound: {
      isImpounded: Boolean(vehicle.impound?.isImpounded),
      lot: vehicle.impound?.lot ?? '',
      since: vehicle.impound?.since ?? null,
      reason: vehicle.impound?.reason ?? '',
    },
  };
}
