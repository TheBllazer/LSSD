import {
  z,
  requiredString,
  optionalString,
  requiredDate,
  optionalPositiveInt,
  photoUrl,
} from '@/utils/validation';
import { RECORD_TYPES, DISPOSITIONS, RECORD_STATUS } from '@/types/records';

/** Chef d'accusation retenu. */
export const chargeSchema = z.object({
  code: requiredString('Le code pénal', 20),
  label: requiredString("L'intitulé", 120),
  degree: optionalString(10),
  counts: z.number().int().min(1).max(99).default(1),
});

/**
 * Peine prononcée.
 *
 * Les durées sont exprimées en jours et les montants en dollars : ce sont les
 * unités des juridictions californiennes dont s'inspire le comté, et cela évite
 * toute conversion à l'affichage comme au calcul de la progression.
 */
export const sentenceSchema = z.object({
  prisonDays: optionalPositiveInt('La peine de prison', 36500),
  probationDays: optionalPositiveInt('La probation', 36500),
  communityServiceHours: optionalPositiveInt("Les travaux d'intérêt général", 10000),
  fineAmount: optionalPositiveInt("L'amende", 10000000),
  finePaid: z.boolean().default(false),
  startedAt: z.union([z.date(), z.string(), z.null(), z.undefined()]).transform((value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }),
});

/** Schéma d'un casier judiciaire. */
export const recordSchema = z.object({
  citizenId: requiredString('Le citoyen', 60),

  date: requiredDate('La date des faits'),
  type: z.enum(Object.values(RECORD_TYPES)),
  charges: z.array(chargeSchema).min(1, "Au moins un chef d'accusation est requis.").max(30),

  disposition: z.enum(Object.values(DISPOSITIONS)),
  status: z.enum(Object.values(RECORD_STATUS)),
  sentence: sentenceSchema.default({
    prisonDays: null,
    probationDays: null,
    communityServiceHours: null,
    fineAmount: null,
    finePaid: false,
    startedAt: null,
  }),

  court: optionalString(120),
  judge: optionalString(80),
  prosecutor: optionalString(80),
  defenseAttorney: optionalString(80),

  reportId: z.string().nullable().optional().default(null),
  mugshotUrl: photoUrl,
  photos: z.array(photoUrl).max(10).default([]),
  notes: optionalString(2000),
});

/** Valeurs par défaut d'un nouveau casier. */
export function emptyRecord(citizenId = '') {
  return {
    citizenId,
    date: new Date(),
    type: RECORD_TYPES.MISDEMEANOR,
    charges: [],
    disposition: DISPOSITIONS.PENDING,
    status: RECORD_STATUS.ACTIVE,
    sentence: {
      prisonDays: null,
      probationDays: null,
      communityServiceHours: null,
      fineAmount: null,
      finePaid: false,
      startedAt: null,
    },
    court: '',
    judge: '',
    prosecutor: '',
    defenseAttorney: '',
    reportId: null,
    mugshotUrl: '',
    photos: [],
    notes: '',
  };
}

/**
 * Prépare un casier existant pour l'édition.
 * @param {object} record
 * @returns {object}
 */
export function toRecordForm(record) {
  const base = emptyRecord();
  if (!record) return base;

  return {
    ...base,
    ...record,
    court: record.court ?? '',
    judge: record.judge ?? '',
    prosecutor: record.prosecutor ?? '',
    defenseAttorney: record.defenseAttorney ?? '',
    mugshotUrl: record.mugshotUrl ?? '',
    notes: record.notes ?? '',
    charges: record.charges ?? [],
    photos: record.photos ?? [],
    sentence: { ...base.sentence, ...(record.sentence ?? {}) },
  };
}

/**
 * Progression d'une peine de prison.
 *
 * @param {object} sentence
 * @returns {{ served: number, total: number, percent: number, remaining: number }|null}
 */
export function sentenceProgress(sentence) {
  const total = sentence?.prisonDays ?? 0;
  if (!total || !sentence?.startedAt) return null;

  const start = sentence.startedAt instanceof Date
    ? sentence.startedAt
    : new Date(sentence.startedAt);
  const elapsedDays = Math.floor((Date.now() - start.getTime()) / 86400000);
  const served = Math.max(0, Math.min(total, elapsedDays));

  return {
    served,
    total,
    remaining: total - served,
    percent: Math.round((served / total) * 100),
  };
}
