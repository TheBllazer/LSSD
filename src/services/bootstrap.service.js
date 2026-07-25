import {
  docRef,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  requireDb,
} from '@/firebase/db';
import { COLLECTIONS, DOC_IDS } from '@/firebase/paths';
import { buildPermissionDocument, ROLES } from '@/utils/permissions';
import { RANKS, DIVISIONS, AGENT_STATUS } from '@/types/agents';
import { buildSearchTokens } from '@/utils/tokens';
import { dayjs } from '@/utils/dates';

/**
 * Amorçage du système.
 *
 * Problème à résoudre : le RMS n'a pas d'inscription publique, et les règles
 * de sécurité exigent un document `/permissions/{uid}` préexistant pour
 * autoriser la moindre écriture. Le tout premier administrateur ne peut donc
 * se créer ni depuis l'application, ni par lui-même une fois le système en
 * service.
 *
 * Solution : une porte unique, refermée par son propre usage. Les règles
 * autorisent un agent authentifié à se déclarer administrateur **tant que
 * `/settings/bootstrap` n'existe pas**, et l'amorçage crée ce document dans la
 * même transaction atomique. Une seule personne peut donc l'emprunter, une
 * seule fois — et uniquement pour se provisionner, pas pour écrire autre chose.
 *
 * Voir `firebase/firestore.rules`, section « amorçage ».
 */

/** Identifiant du document sentinelle. */
const SENTINEL = 'bootstrap';

/** Codes pénaux fournis au démarrage — éditables ensuite dans l'administration. */
const DEFAULT_CHARGE_CODES = [
  { code: 'PC 187', label: 'Homicide', type: 'FELONY' },
  { code: 'PC 207', label: 'Enlèvement', type: 'FELONY' },
  { code: 'PC 211', label: 'Vol qualifié', type: 'FELONY' },
  { code: 'PC 215', label: 'Vol de véhicule avec violence', type: 'FELONY' },
  { code: 'PC 240', label: 'Tentative de voies de fait', type: 'MISDEMEANOR' },
  { code: 'PC 245', label: 'Agression avec arme mortelle', type: 'FELONY' },
  { code: 'PC 273.5', label: 'Violences domestiques', type: 'FELONY' },
  { code: 'PC 415', label: "Trouble à l'ordre public", type: 'MISDEMEANOR' },
  { code: 'PC 459', label: 'Cambriolage', type: 'FELONY' },
  { code: 'PC 484', label: 'Vol simple', type: 'MISDEMEANOR' },
  { code: 'PC 487', label: 'Vol aggravé', type: 'FELONY' },
  { code: 'PC 496', label: 'Recel', type: 'FELONY' },
  { code: 'PC 594', label: 'Vandalisme', type: 'MISDEMEANOR' },
  { code: 'PC 647(f)', label: 'Ivresse publique', type: 'MISDEMEANOR' },
  { code: 'PC 69', label: 'Rébellion envers un agent', type: 'FELONY' },
  { code: 'PC 148', label: 'Obstruction à agent', type: 'MISDEMEANOR' },
  { code: 'PC 25400', label: "Port d'arme dissimulée", type: 'FELONY' },
  { code: 'HS 11350', label: 'Possession de stupéfiants', type: 'FELONY' },
  { code: 'HS 11351', label: 'Détention en vue de la vente', type: 'FELONY' },
  { code: 'VC 23152', label: "Conduite en état d'ivresse", type: 'MISDEMEANOR' },
  { code: 'VC 22350', label: 'Excès de vitesse', type: 'INFRACTION' },
  { code: 'VC 2800.2', label: "Refus d'obtempérer", type: 'FELONY' },
  { code: 'VC 20002', label: 'Délit de fuite', type: 'MISDEMEANOR' },
];

/** Districts de Los Santos et du comté de Blaine. */
const DEFAULT_DISTRICTS = [
  'Vespucci', 'Rockford Hills', 'Vinewood', 'Downtown', 'Davis', 'Strawberry',
  'La Mesa', 'El Burro Heights', 'Mirror Park', 'Little Seoul', 'Del Perro',
  'Pacific Bluffs', 'Sandy Shores', 'Paleto Bay', 'Grapeseed', 'Harmony',
  'Chumash', 'Banham Canyon', 'Route 68', 'Mount Chiliad',
];

/**
 * Le système a-t-il déjà été amorcé ?
 *
 * Lit la sentinelle, seul document accessible à un compte sans permissions.
 *
 * @returns {Promise<{ open: boolean, error: string|null }>}
 */
export async function isBootstrapOpen() {
  try {
    const snapshot = await getDoc(docRef(COLLECTIONS.SETTINGS, SENTINEL));
    return { open: !snapshot.exists(), error: null };
  } catch (error) {
    // Un refus ici signifie que les règles d'amorçage ne sont pas déployées.
    return {
      open: false,
      error:
        error?.code === 'permission-denied'
          ? "Les règles d'amorçage ne sont pas déployées sur ce projet Firebase."
          : (error?.message ?? 'Lecture impossible.'),
    };
  }
}

/**
 * Provisionne le premier administrateur et scelle la porte d'amorçage.
 *
 * Les trois écritures partent dans un lot unique : les règles évaluent chaque
 * opération contre l'état *antérieur* au lot, si bien que la sentinelle peut
 * être créée en même temps que les permissions qu'elle autorise. Soit tout
 * réussit, soit rien n'est écrit — aucun état intermédiaire où la porte
 * resterait ouverte.
 *
 * @param {object} params
 * @param {import('firebase/auth').User} params.user
 * @param {object} params.profile Champs de la fiche agent saisis à l'écran
 * @returns {Promise<void>}
 */
export async function provisionFirstAdministrator({ user, profile }) {
  const state = await isBootstrapOpen();
  if (!state.open) {
    throw new Error(
      state.error ??
        'Le système est déjà amorcé : un administrateur existe. Faites-vous ' +
          'provisionner par un officier disposant des droits d\'administration.',
    );
  }

  const agent = {
    uid: user.uid,
    email: user.email,
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    badgeNumber: profile.badgeNumber.trim(),
    phone: profile.phone?.trim() || null,
    photoUrl: profile.photoUrl?.trim() || null,
    rank: profile.rank || RANKS.SHERIFF,
    role: ROLES.ADMINISTRATOR,
    division: profile.division || DIVISIONS.ADMIN,
    service: profile.service?.trim() || 'Station centrale',
    callsign: profile.callsign?.trim() || null,
    status: AGENT_STATUS.ACTIVE,
    certifications: [],
    supervisorId: null,
    notes: "Compte administrateur initial, créé lors de l'amorçage du système.",
    loginCount: 0,
    lastLoginAt: null,
    deletedAt: null,
    searchTokens: buildSearchTokens([
      profile.firstName,
      profile.lastName,
      profile.badgeNumber,
      profile.callsign,
    ]),
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  };

  const batch = writeBatch(requireDb());

  batch.set(
    docRef(COLLECTIONS.PERMISSIONS, user.uid),
    buildPermissionDocument({ role: ROLES.ADMINISTRATOR }),
  );
  batch.set(docRef(COLLECTIONS.AGENTS, user.uid), agent);

  // Scelle la porte. Immuable et indestructible d'après les règles.
  batch.set(docRef(COLLECTIONS.SETTINGS, SENTINEL), {
    bootstrappedAt: serverTimestamp(),
    bootstrappedBy: user.uid,
    bootstrappedByEmail: user.email,
  });

  await batch.commit();
}

/**
 * Crée les documents de référence : paramètres, compteurs de numérotation et
 * agrégats du tableau de bord.
 *
 * Appelé après le provisionnement, une fois l'agent reconnu administrateur —
 * ces écritures exigent la permission `admin.settings`. Idempotent : un
 * document déjà présent n'est pas écrasé.
 *
 * @param {string} uid
 * @returns {Promise<string[]>} Chemins des documents effectivement créés
 */
export async function seedReferenceData(uid) {
  const created = [];
  const year = dayjs().year();

  const documents = [
    {
      ref: docRef(COLLECTIONS.SETTINGS, DOC_IDS.APP_SETTINGS),
      data: {
        agency: "Los Santos Sheriff's Department",
        abbreviation: 'LSSD',
        chargeCodes: DEFAULT_CHARGE_CODES,
        districts: DEFAULT_DISTRICTS,
        pdf: {
          headerTitle: "LOS SANTOS SHERIFF'S DEPARTMENT",
          headerSubtitle: 'Records Management System',
          footerNotice:
            'Document officiel — diffusion restreinte au personnel autorisé.',
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      },
    },
    {
      ref: docRef(COLLECTIONS.COUNTERS, DOC_IDS.COUNTER_REPORTS),
      data: { year, value: 0 },
    },
    {
      ref: docRef(COLLECTIONS.COUNTERS, DOC_IDS.COUNTER_RECORDS),
      data: { year, value: 0 },
    },
    {
      ref: docRef(COLLECTIONS.COUNTERS, DOC_IDS.COUNTER_CITIZENS),
      data: { year, value: 0 },
    },
    {
      ref: docRef(COLLECTIONS.STATS, DOC_IDS.DASHBOARD_STATS),
      data: {
        citizens: 0,
        vehicles: 0,
        weapons: 0,
        reports: 0,
        criminalRecords: 0,
        arrests: 0,
        updatedAt: serverTimestamp(),
      },
    },
  ];

  for (const document of documents) {
    const existing = await getDoc(document.ref);
    if (existing.exists()) continue;
    await setDoc(document.ref, document.data);
    created.push(document.ref.path);
  }

  return created;
}
