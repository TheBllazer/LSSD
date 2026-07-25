import {
  docRef,
  col,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  query as fsQuery,
  limit as fsLimit,
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
 * Le RMS n'a pas d'inscription publique : le tout premier administrateur ne
 * peut pas se créer depuis l'application une fois les règles de sécurité
 * déployées — elles exigent un document `/permissions/{uid}` préexistant pour
 * autoriser la moindre écriture.
 *
 * Il reste une fenêtre : tant que les règles ne sont pas publiées, Firestore
 * fonctionne en mode ouvert et le client peut écrire. Ce service exploite cette
 * fenêtre pour provisionner le premier compte, puis **la referme** en invitant
 * à déployer les règles immédiatement.
 *
 * Les écritures sont volontairement séquencées en deux temps : les règles
 * évaluent chaque opération d'un lot contre l'état *antérieur* au lot. Écrire
 * les permissions et les référentiels d'un seul bloc échouerait donc dès que
 * les règles sont actives, alors que la séquence « permissions d'abord,
 * référentiels ensuite » fonctionne dans les deux configurations.
 */

/** Codes pénaux fournis au démarrage — éditables ensuite dans l'administration. */
const DEFAULT_CHARGE_CODES = [
  { code: 'PC 187', label: 'Homicide', type: 'FELONY' },
  { code: 'PC 207', label: 'Enlèvement', type: 'FELONY' },
  { code: 'PC 211', label: 'Vol qualifié', type: 'FELONY' },
  { code: 'PC 215', label: 'Vol de véhicule avec violence', type: 'FELONY' },
  { code: 'PC 240', label: 'Tentative de voies de fait', type: 'MISDEMEANOR' },
  { code: 'PC 245', label: 'Agression avec arme mortelle', type: 'FELONY' },
  { code: 'PC 261', label: 'Agression sexuelle', type: 'FELONY' },
  { code: 'PC 273.5', label: 'Violences domestiques', type: 'FELONY' },
  { code: 'PC 314', label: 'Exhibition', type: 'MISDEMEANOR' },
  { code: 'PC 415', label: 'Trouble à l\'ordre public', type: 'MISDEMEANOR' },
  { code: 'PC 459', label: 'Cambriolage', type: 'FELONY' },
  { code: 'PC 484', label: 'Vol simple', type: 'MISDEMEANOR' },
  { code: 'PC 487', label: 'Vol aggravé', type: 'FELONY' },
  { code: 'PC 496', label: 'Recel', type: 'FELONY' },
  { code: 'PC 594', label: 'Vandalisme', type: 'MISDEMEANOR' },
  { code: 'PC 647(f)', label: 'Ivresse publique', type: 'MISDEMEANOR' },
  { code: 'PC 664', label: 'Tentative', type: 'MISDEMEANOR' },
  { code: 'PC 69', label: 'Rébellion envers un agent', type: 'FELONY' },
  { code: 'PC 148', label: 'Obstruction à agent', type: 'MISDEMEANOR' },
  { code: 'PC 12025', label: 'Port d\'arme dissimulée', type: 'FELONY' },
  { code: 'PC 25400', label: 'Arme dissimulée dans un véhicule', type: 'FELONY' },
  { code: 'HS 11350', label: 'Possession de stupéfiants', type: 'FELONY' },
  { code: 'HS 11351', label: 'Détention en vue de la vente', type: 'FELONY' },
  { code: 'VC 23152', label: 'Conduite en état d\'ivresse', type: 'MISDEMEANOR' },
  { code: 'VC 22350', label: 'Excès de vitesse', type: 'INFRACTION' },
  { code: 'VC 2800.2', label: 'Refus d\'obtempérer', type: 'FELONY' },
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
 * Indique si le système a déjà été amorcé.
 *
 * On teste l'existence d'au moins un document dans `/permissions` : c'est la
 * marque d'un système en service. Une erreur de permission signifie que les
 * règles sont déjà déployées — donc que l'amorçage par le client n'est plus
 * possible.
 *
 * @returns {Promise<{ bootstrapped: boolean, rulesActive: boolean, error: string|null }>}
 */
export async function inspectBootstrapState() {
  try {
    const snapshot = await getDocs(fsQuery(col(COLLECTIONS.PERMISSIONS), fsLimit(1)));
    return { bootstrapped: !snapshot.empty, rulesActive: false, error: null };
  } catch (error) {
    if (error?.code === 'permission-denied') {
      return { bootstrapped: false, rulesActive: true, error: null };
    }
    return {
      bootstrapped: false,
      rulesActive: false,
      error: error?.message ?? 'Lecture impossible.',
    };
  }
}

/**
 * Provisionne le premier administrateur.
 *
 * @param {object} params
 * @param {import('firebase/auth').User} params.user Compte Firebase authentifié
 * @param {object} params.profile Champs de la fiche agent saisis à l'écran
 * @returns {Promise<void>}
 */
export async function provisionFirstAdministrator({ user, profile }) {
  // Garde-fou : on ne provisionne que si le système est vierge. Sans cela,
  // laisser cette route accessible reviendrait à offrir les pleins pouvoirs.
  const state = await inspectBootstrapState();
  if (state.bootstrapped) {
    throw new Error(
      'Le système est déjà amorcé : un compte administrateur existe. ' +
        "Utilisez le module Agents pour créer d'autres comptes.",
    );
  }
  if (state.rulesActive) {
    throw new Error(
      'Les règles de sécurité sont déjà déployées : la création du premier ' +
        'compte doit se faire depuis la console Firebase ' +
        '(voir firebase/seed/bootstrap-admin.md).',
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
    notes: 'Compte administrateur initial, créé lors de l\'amorçage du système.',
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

  // Étape 1 — habilitations et fiche agent.
  const identity = writeBatch(requireDb());
  identity.set(
    docRef(COLLECTIONS.PERMISSIONS, user.uid),
    buildPermissionDocument({ role: ROLES.ADMINISTRATOR }),
  );
  identity.set(docRef(COLLECTIONS.AGENTS, user.uid), agent);
  await identity.commit();

  // Étape 2 — référentiels et compteurs. Séparée pour que les règles, si elles
  // sont déjà actives, évaluent ces écritures avec les permissions de l'étape 1.
  await seedReferenceData(user.uid);
}

/**
 * Crée les documents de référence du système : paramètres, compteurs de
 * numérotation et agrégats du tableau de bord.
 *
 * Idempotent : les documents déjà présents ne sont pas écrasés.
 *
 * @param {string} uid Agent à l'origine de l'écriture
 * @returns {Promise<string[]>} Documents effectivement créés
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
