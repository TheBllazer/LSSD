import { createCrudService, generateId, buildHistoryEvent } from './base/crudFactory';
import {
  docRef,
  subCol,
  subDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  increment,
  query as fsQuery,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
  requireDb,
} from '@/firebase/db';
import { COLLECTIONS, DOC_IDS, paths } from '@/firebase/paths';
import { ENTITY_TYPES } from '@/app/config/constants';
import { AUDIT_ACTIONS } from '@/types/agents';
import { CITIZEN_EVENTS } from '@/types/citizens';
import {
  REPORT_EVENTS,
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_TRANSITIONS,
  MAX_REVISIONS,
} from '@/types/reports';
import { buildAuditEntry } from './audit.service';
import { nextNumber } from './counters.service';

/**
 * Service des rapports d'incident.
 */

/** Libellé : « LSSD-2026-000148 — Vol à main armée ». */
function labelOf(report) {
  return [report.number, report.title].filter(Boolean).join(' — ') || 'Rapport sans titre';
}

/**
 * Champs indexés.
 * Le corps du rapport est indexé sous sa forme texte, tronquée : au-delà,
 * on dépasserait le plafond de tokens sans gagner en pertinence.
 */
function tokensOf(report) {
  return [
    report.number,
    report.title,
    report.summary,
    report.location?.label,
    report.location?.district,
    (report.contentText ?? '').slice(0, 600),
    ...(report.involvedCitizens ?? []).map((party) => party.label),
  ];
}

function subtitleOf(report) {
  return [
    REPORT_TYPE_LABELS[report.type] ?? report.type,
    REPORT_STATUS_LABELS[report.status] ?? report.status,
    report.location?.district,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const reportsService = createCrudService({
  collection: COLLECTIONS.REPORTS,
  entityType: ENTITY_TYPES.REPORT,
  labelOf,
  tokensOf,
  subtitleOf,
  photoOf: (report) => report.photos?.[0] ?? null,
  statKey: 'reports',
  historyPath: paths.reportHistory,
  defaultOrder: { field: 'occurredAt', direction: 'desc' },
  searchOrderField: 'occurredAt',
});

/**
 * Tableaux d'identifiants plats, maintenus en parallèle des parties impliquées.
 *
 * Firestore ne sait pas interroger un champ situé à l'intérieur d'un tableau
 * d'objets : sans ces miroirs, retrouver « tous les rapports mentionnant ce
 * citoyen » serait impossible autrement qu'en lisant toute la collection.
 *
 * @param {object} report
 * @returns {object}
 */
function buildMirrors(report) {
  return {
    involvedCitizenIds: (report.involvedCitizens ?? []).map((party) => party.id),
    involvedAgentUids: (report.involvedAgents ?? []).map((party) => party.id),
    involvedVehicleIds: (report.involvedVehicles ?? []).map((party) => party.id),
    involvedWeaponIds: (report.involvedWeapons ?? []).map((party) => party.id),
  };
}

/**
 * Crée un rapport avec un numéro officiel réservé par transaction.
 *
 * @param {object} data   Rapport validé
 * @param {object} actor  `{ uid, name }`
 * @returns {Promise<object>} Rapport créé, numéro compris
 */
export async function createReport(data, actor) {
  const { number } = await nextNumber(DOC_IDS.COUNTER_REPORTS, 'LSSD');

  const payload = {
    ...data,
    number,
    ...buildMirrors(data),
    lockedBy: null,
    signature: null,
    review: null,
  };

  const created = await reportsService.create(payload, {
    actor,
    onBatch: (batch, reportId) => {
      // Chaque citoyen cité voit son compteur et sa chronologie mis à jour
      // dans le même lot que la création : pas d'état intermédiaire.
      for (const party of data.involvedCitizens ?? []) {
        batch.set(
          docRef(COLLECTIONS.CITIZENS, party.id),
          {
            counters: { reports: increment(1) },
            updatedAt: serverTimestamp(),
            updatedBy: actor.uid,
          },
          { merge: true },
        );

        batch.set(
          subDoc(paths.citizenHistory(party.id), generateId()),
          buildHistoryEvent(actor, {
            type: CITIZEN_EVENTS.REPORT_LINKED,
            label: `Rapport ${number} — ${data.title}`,
            refType: ENTITY_TYPES.REPORT,
            refId: reportId,
          }),
        );
      }
    },
  });

  return { ...created, number };
}

/**
 * Met à jour un rapport en tenant les miroirs d'identifiants à jour.
 *
 * @param {string} id
 * @param {object} patch
 * @param {object} options `{ actor, previous }`
 * @returns {Promise<void>}
 */
export async function updateReport(id, patch, { actor, previous }) {
  const merged = { ...(previous ?? {}), ...patch };
  await reportsService.update(id, { ...patch, ...buildMirrors(merged) }, { actor, previous });
}

/**
 * Applique un changement de statut.
 *
 * La transition est vérifiée contre `REPORT_TRANSITIONS` : l'interface ne
 * propose que les passages valides, et le service refuse les autres — un appel
 * direct ne peut pas faire sauter une étape du circuit.
 *
 * @param {object} params
 * @param {object} params.report
 * @param {string} params.status   Statut cible
 * @param {string} [params.comment] Motif du rejet ou observation de revue
 * @param {object} params.actor
 * @returns {Promise<void>}
 */
export async function changeStatus({ report, status, comment, actor }) {
  const allowed = REPORT_TRANSITIONS[report.status] ?? [];
  if (!allowed.includes(status)) {
    throw new Error(
      `Transition refusée : ${REPORT_STATUS_LABELS[report.status]} → ${
        REPORT_STATUS_LABELS[status] ?? status
      }.`,
    );
  }

  const batch = writeBatch(requireDb());

  batch.set(
    docRef(COLLECTIONS.REPORTS, reportIdOf(report)),
    {
      status,
      review: {
        byUid: actor.uid,
        byName: actor.name,
        at: serverTimestamp(),
        comment: comment ?? null,
      },
      // Le verrou d'édition tombe dès que le rapport quitte la main de l'auteur.
      lockedBy: null,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true },
  );

  batch.set(
    docRef(COLLECTIONS.AUDIT_LOGS, generateId()),
    buildAuditEntry(actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.REPORT,
      entityId: reportIdOf(report),
      entityLabel: labelOf(report),
      meta: { from: report.status, to: status, comment: comment ?? null },
    }),
  );

  await batch.commit();
}

/**
 * Appose la signature de l'agent sur le rapport.
 *
 * @param {object} params
 * @param {object} params.report
 * @param {object} params.agent  Fiche agent (grade, matricule)
 * @param {object} params.actor
 * @returns {Promise<void>}
 */
export async function signReport({ report, agent, actor }) {
  await reportsService.update(
    reportIdOf(report),
    {
      signature: {
        uid: actor.uid,
        name: actor.name,
        badge: agent?.badgeNumber ?? null,
        signedAt: serverTimestamp(),
      },
    },
    { actor, previous: report },
  );
}

/* --------------------------------------------------------------- révisions */

/**
 * Enregistre une version du corps du rapport.
 *
 * Appelé par l'enregistrement automatique. Les versions au-delà de
 * {@link MAX_REVISIONS} sont purgées : conserver l'intégralité d'un rapport
 * rédigé sur plusieurs heures représenterait des centaines de documents pour
 * un intérêt nul.
 *
 * @param {string} reportId
 * @param {object} params `{ content, contentText, actor, auto }`
 * @returns {Promise<void>}
 */
export async function saveRevision(reportId, { content, contentText, actor, auto = true }) {
  await setDoc(subDoc(paths.reportRevisions(reportId), generateId()), {
    content,
    contentText,
    auto,
    savedAt: serverTimestamp(),
    savedBy: actor.uid,
    savedByName: actor.name,
  });

  const snapshot = await getDocs(
    fsQuery(subCol(paths.reportRevisions(reportId)), orderBy('savedAt', 'desc')),
  );

  const excess = snapshot.docs.slice(MAX_REVISIONS);
  await Promise.all(
    excess.map((document) =>
      deleteDoc(subDoc(paths.reportRevisions(reportId), document.id)).catch(() => {}),
    ),
  );
}

/**
 * Liste les versions enregistrées d'un rapport.
 * @param {string} reportId
 * @returns {Promise<object[]>}
 */
export async function listRevisions(reportId) {
  if (!reportId) return [];
  const snapshot = await getDocs(
    fsQuery(
      subCol(paths.reportRevisions(reportId)),
      orderBy('savedAt', 'desc'),
      fsLimit(MAX_REVISIONS),
    ),
  );
  return snapshot.docs.map((document) => document.data());
}

/**
 * Restaure une version antérieure du corps du rapport.
 *
 * @param {object} params `{ report, revision, actor }`
 * @returns {Promise<void>}
 */
export async function restoreRevision({ report, revision, actor }) {
  await reportsService.update(
    reportIdOf(report),
    { content: revision.content, contentText: revision.contentText },
    { actor, previous: report },
  );

  await reportsService.addHistory(reportIdOf(report), actor, {
    type: REPORT_EVENTS.REVISION_RESTORED,
    label: `Version du ${revision.savedAt ? new Date(revision.savedAt).toLocaleString('fr-FR') : '—'} restaurée`,
  });
}

/**
 * Identifiant d'un rapport, quelle que soit la forme reçue.
 * @param {object|string} report
 * @returns {string}
 */
function reportIdOf(report) {
  return typeof report === 'string' ? report : report.id;
}

export default reportsService;
