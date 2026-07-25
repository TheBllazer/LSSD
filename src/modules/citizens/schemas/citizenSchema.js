import {
  z,
  requiredString,
  optionalString,
  optionalEmail,
  optionalPhone,
  optionalDate,
  requiredDate,
  optionalPositiveInt,
  photoUrl,
} from '@/utils/validation';
import {
  SEX,
  CITIZEN_STATUS,
  CITIZEN_FLAGS,
  LICENSE_TYPES,
  LICENSE_STATUS,
  AFFILIATION_TYPES,
  EYE_COLORS,
  HAIR_COLORS,
} from '@/types/citizens';

/**
 * Schéma de validation d'un citoyen.
 *
 * Utilisé par le formulaire **et** par le service : une valeur refusée à
 * l'écran ne peut pas entrer en base par un autre chemin, et inversement le
 * formulaire n'oppose jamais un refus que l'écriture aurait accepté.
 */

/** Permis détenu par un citoyen. */
export const licenseSchema = z.object({
  type: z.enum(Object.values(LICENSE_TYPES)),
  number: optionalString(40),
  status: z.enum(Object.values(LICENSE_STATUS)),
  issuedAt: optionalDate,
  expiresAt: optionalDate,
  notes: optionalString(200),
});

/** Affiliation à un gang, une organisation, une entreprise ou une famille. */
export const affiliationSchema = z.object({
  type: z.enum(Object.values(AFFILIATION_TYPES)),
  name: requiredString('Le nom de l\'affiliation', 80),
  role: optionalString(80),
  since: optionalDate,
  notes: optionalString(200),
});

/** Tatouage ou marque distinctive localisée. */
export const tattooSchema = z.object({
  location: requiredString('L\'emplacement', 60),
  description: requiredString('La description', 200),
  photoUrl,
});

/** Adresse de résidence. */
export const addressSchema = z.object({
  street: optionalString(120),
  district: optionalString(60),
  postal: optionalString(12),
});

/** Schéma complet d'une fiche citoyen. */
export const citizenSchema = z.object({
  // Identité
  firstName: requiredString('Le prénom', 60),
  lastName: requiredString('Le nom', 60),
  aliases: z.array(z.string().trim().max(60)).max(10).default([]),
  birthDate: requiredDate('La date de naissance'),
  sex: z.enum(Object.values(SEX)),

  // Signalement physique
  height: optionalPositiveInt('La taille', 260),
  weight: optionalPositiveInt('Le poids', 400),
  eyeColor: z.enum(Object.values(EYE_COLORS)).nullable().optional(),
  hairColor: z.enum(Object.values(HAIR_COLORS)).nullable().optional(),

  // Coordonnées
  phone: optionalPhone,
  email: optionalEmail,
  address: addressSchema.default({ street: null, district: null, postal: null }),

  // Situation professionnelle
  occupation: optionalString(80),
  employer: optionalString(80),

  // Dossier
  status: z.enum(Object.values(CITIZEN_STATUS)),
  flags: z.array(z.enum(Object.values(CITIZEN_FLAGS))).max(7).default([]),
  licenses: z.array(licenseSchema).max(10).default([]),
  affiliations: z.array(affiliationSchema).max(10).default([]),
  tattoos: z.array(tattooSchema).max(20).default([]),

  // Descriptif libre
  description: optionalString(2000),
  distinctiveMarks: optionalString(1000),
  notes: optionalString(2000),

  // Média
  photoUrl,
});

/**
 * Valeurs par défaut d'une nouvelle fiche.
 * Séparées du schéma : un formulaire vide doit être *valide en structure*
 * même s'il est incomplet, sinon React Hook Form affiche des erreurs
 * avant la moindre saisie.
 *
 * @returns {object}
 */
export function emptyCitizen() {
  return {
    firstName: '',
    lastName: '',
    aliases: [],
    birthDate: null,
    sex: SEX.M,
    height: null,
    weight: null,
    eyeColor: null,
    hairColor: null,
    phone: '',
    email: '',
    address: { street: '', district: '', postal: '' },
    occupation: '',
    employer: '',
    status: CITIZEN_STATUS.CLEAR,
    flags: [],
    licenses: [],
    affiliations: [],
    tattoos: [],
    description: '',
    distinctiveMarks: '',
    notes: '',
    photoUrl: '',
  };
}

/**
 * Prépare une fiche existante pour l'édition.
 * Convertit les `null` en chaînes vides : un champ contrôlé React ne doit
 * jamais recevoir `null`, sous peine de basculer en non contrôlé.
 *
 * @param {object} citizen
 * @returns {object}
 */
export function toFormValues(citizen) {
  const base = emptyCitizen();
  if (!citizen) return base;

  return {
    ...base,
    ...citizen,
    phone: citizen.phone ?? '',
    email: citizen.email ?? '',
    occupation: citizen.occupation ?? '',
    employer: citizen.employer ?? '',
    description: citizen.description ?? '',
    distinctiveMarks: citizen.distinctiveMarks ?? '',
    notes: citizen.notes ?? '',
    photoUrl: citizen.photoUrl ?? '',
    address: {
      street: citizen.address?.street ?? '',
      district: citizen.address?.district ?? '',
      postal: citizen.address?.postal ?? '',
    },
    aliases: citizen.aliases ?? [],
    flags: citizen.flags ?? [],
    licenses: citizen.licenses ?? [],
    affiliations: citizen.affiliations ?? [],
    tattoos: citizen.tattoos ?? [],
  };
}
