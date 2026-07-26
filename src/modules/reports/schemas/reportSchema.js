import {
  z,
  requiredString,
  optionalString,
  requiredDate,
  photoUrl,
} from '@/utils/validation';
import {
  REPORT_TYPES,
  REPORT_CLASSIFICATIONS,
  REPORT_STATUS,
  REPORT_PRIORITIES,
  CITIZEN_ROLES,
  AGENT_ROLES,
  VEHICLE_ROLES,
  WEAPON_ROLES,
} from '@/types/reports';

/** Lieu des faits. */
export const locationSchema = z.object({
  label: optionalString(160),
  district: optionalString(60),
});

/** Chef d'accusation retenu contre un citoyen. */
export const chargeSchema = z.object({
  code: requiredString('Le code pénal', 20),
  label: requiredString("L'intitulé", 120),
  citizenId: z.string().nullable().optional().default(null),
  counts: z.number().int().min(1).max(99).default(1),
});

/** Partie impliquée : citoyen, agent, véhicule ou arme. */
const partySchema = (roles) =>
  z.object({
    id: z.string(),
    label: z.string(),
    photoUrl: z.string().nullable().optional().default(null),
    role: z.enum(Object.values(roles)),
  });

export const involvedCitizenSchema = partySchema(CITIZEN_ROLES);
export const involvedVehicleSchema = partySchema(VEHICLE_ROLES);
export const involvedWeaponSchema = partySchema(WEAPON_ROLES);

/** Agent impliqué — porte en plus son matricule, qui figure sur le PDF. */
export const involvedAgentSchema = z.object({
  id: z.string(),
  label: z.string(),
  badge: z.string().nullable().optional().default(null),
  photoUrl: z.string().nullable().optional().default(null),
  role: z.enum(Object.values(AGENT_ROLES)),
});

/**
 * Schéma d'un rapport.
 *
 * Le corps du rapport est stocké sous deux formes : le document TipTap
 * (`content`, JSON) pour l'édition et le rendu PDF, et sa version texte plat
 * (`contentText`) qui alimente l'index de recherche. Indexer le JSON
 * reviendrait à chercher dans du balisage.
 */
export const reportSchema = z.object({
  title: requiredString('Le titre', 160),
  type: z.enum(Object.values(REPORT_TYPES)),
  classification: z.enum(Object.values(REPORT_CLASSIFICATIONS)),
  priority: z.enum(Object.values(REPORT_PRIORITIES)),
  status: z.enum(Object.values(REPORT_STATUS)),

  occurredAt: requiredDate('La date des faits'),
  location: locationSchema.default({ label: null, district: null }),

  summary: optionalString(400),
  content: z.any().nullable().optional().default(null),
  contentText: optionalString(50000),

  involvedCitizens: z.array(involvedCitizenSchema).max(30).default([]),
  involvedAgents: z.array(involvedAgentSchema).max(20).default([]),
  involvedVehicles: z.array(involvedVehicleSchema).max(20).default([]),
  involvedWeapons: z.array(involvedWeaponSchema).max(20).default([]),

  charges: z.array(chargeSchema).max(30).default([]),
  photos: z.array(photoUrl).max(20).default([]),
});

/**
 * Métadonnées seules — utilisées par le panneau latéral de l'éditeur, qui ne
 * touche pas au corps du rapport.
 */
export const reportMetaSchema = reportSchema.pick({
  title: true,
  type: true,
  classification: true,
  priority: true,
  occurredAt: true,
  location: true,
  summary: true,
});

/**
 * Valeurs par défaut d'un nouveau rapport.
 * @returns {object}
 */
export function emptyReport() {
  return {
    title: '',
    type: REPORT_TYPES.INCIDENT,
    classification: REPORT_CLASSIFICATIONS.RESTRICTED,
    priority: REPORT_PRIORITIES.MEDIUM,
    status: REPORT_STATUS.DRAFT,
    occurredAt: new Date(),
    location: { label: '', district: '' },
    summary: '',
    content: null,
    contentText: '',
    involvedCitizens: [],
    involvedAgents: [],
    involvedVehicles: [],
    involvedWeapons: [],
    charges: [],
    photos: [],
  };
}

/**
 * Prépare un rapport existant pour l'édition des métadonnées.
 * @param {object} report
 * @returns {object}
 */
export function toReportMetaForm(report) {
  return {
    title: report?.title ?? '',
    type: report?.type ?? REPORT_TYPES.INCIDENT,
    classification: report?.classification ?? REPORT_CLASSIFICATIONS.RESTRICTED,
    priority: report?.priority ?? REPORT_PRIORITIES.MEDIUM,
    occurredAt: report?.occurredAt ?? new Date(),
    location: {
      label: report?.location?.label ?? '',
      district: report?.location?.district ?? '',
    },
    summary: report?.summary ?? '',
  };
}
