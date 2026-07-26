import { createCrudService, generateId, buildHistoryEvent } from './base/crudFactory';
import { docRef, subDoc, increment, serverTimestamp } from '@/firebase/db';
import { COLLECTIONS, DOC_IDS, paths } from '@/firebase/paths';
import { ENTITY_TYPES } from '@/app/config/constants';
import { registryName } from '@/utils/format';
import { formatDate } from '@/utils/dates';
import { CITIZEN_EVENTS } from '@/types/citizens';
import {
  RECORD_TYPE_LABELS,
  DISPOSITION_LABELS,
  CONVICTING_DISPOSITIONS,
  citizenStatusFromRecord,
} from '@/types/records';
import { nextNumber } from './counters.service';

/**
 * Service des casiers judiciaires.
 *
 * C'est le module qui referme la boucle : un casier relie un citoyen, un
 * rapport et une condamnation, et **modifie l'état de la fiche du citoyen**.
 * Toutes ces écritures partent ensemble.
 */

/** Libellé : « CR-2026-00087 — PHILIPS, Trevor ». */
function labelOf(record) {
  return [record.number, record.citizenSnapshot?.label].filter(Boolean).join(' — ') ||
    'Casier sans titulaire';
}

/** Champs indexés. */
function tokensOf(record) {
  return [
    record.number,
    record.citizenSnapshot?.label,
    record.court,
    record.judge,
    ...(record.charges ?? []).flatMap((charge) => [charge.code, charge.label]),
  ];
}

function subtitleOf(record) {
  return [
    RECORD_TYPE_LABELS[record.type] ?? record.type,
    DISPOSITION_LABELS[record.disposition] ?? record.disposition,
    record.date ? formatDate(record.date) : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export const recordsService = createCrudService({
  collection: COLLECTIONS.CRIMINAL_RECORDS,
  entityType: ENTITY_TYPES.RECORD,
  labelOf,
  tokensOf,
  subtitleOf,
  photoOf: (record) => record.mugshotUrl ?? null,
  statKey: 'criminalRecords',
  defaultOrder: { field: 'date', direction: 'desc' },
  searchOrderField: 'date',
});

/**
 * Ouvre un casier et répercute ses effets sur la fiche du citoyen.
 *
 * Dans un même lot :
 *  - le casier, numéroté par transaction ;
 *  - le compteur `counters.records` du citoyen ;
 *  - son statut judiciaire s'il devient incarcéré ou en probation ;
 *  - un événement dans sa chronologie ;
 *  - le compteur d'arrestations du tableau de bord.
 *
 * @param {object} params
 * @param {object} params.data     Casier validé
 * @param {object} params.citizen  Fiche du titulaire
 * @param {object} params.actor
 * @returns {Promise<object>}
 */
export async function createRecord({ data, citizen, actor }) {
  const { number } = await nextNumber(DOC_IDS.COUNTER_RECORDS, 'CR');

  const payload = {
    ...data,
    number,
    citizenSnapshot: citizen
      ? {
          id: citizen.id,
          label: registryName(citizen),
          photoUrl: citizen.photoUrl ?? null,
        }
      : null,
  };

  const newStatus = citizenStatusFromRecord(payload);
  const isConviction = CONVICTING_DISPOSITIONS.includes(payload.disposition);

  const created = await recordsService.create(payload, {
    actor,
    onBatch: (batch, recordId) => {
      if (!citizen) return;

      batch.set(
        docRef(COLLECTIONS.CITIZENS, citizen.id),
        {
          counters: { records: increment(1) },
          ...(newStatus ? { status: newStatus } : {}),
          updatedAt: serverTimestamp(),
          updatedBy: actor.uid,
        },
        { merge: true },
      );

      batch.set(
        subDoc(paths.citizenHistory(citizen.id), generateId()),
        buildHistoryEvent(actor, {
          type: CITIZEN_EVENTS.ARREST,
          label: `Casier ${number} — ${(payload.charges ?? [])
            .map((charge) => charge.code)
            .join(', ')}`,
          refType: ENTITY_TYPES.RECORD,
          refId: recordId,
        }),
      );

      if (newStatus) {
        batch.set(
          subDoc(paths.citizenHistory(citizen.id), generateId()),
          buildHistoryEvent(actor, {
            type: CITIZEN_EVENTS.STATUS_CHANGED,
            label: `Statut porté à ${newStatus}`,
            refType: ENTITY_TYPES.RECORD,
            refId: recordId,
          }),
        );
      }

      // Le tableau de bord compte les arrestations, pas les casiers ouverts :
      // une procédure classée sans suite n'est pas une arrestation aboutie.
      if (isConviction) {
        batch.set(
          docRef(COLLECTIONS.STATS, DOC_IDS.DASHBOARD_STATS),
          { arrests: increment(1), updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
    },
  });

  return { ...created, number };
}

/**
 * Met à jour un casier et réaligne le statut du citoyen si la peine change.
 *
 * @param {object} params
 * @param {string} params.id
 * @param {object} params.patch
 * @param {object} params.previous
 * @param {object|null} params.citizen
 * @param {object} params.actor
 * @returns {Promise<void>}
 */
export async function updateRecord({ id, patch, previous, citizen, actor }) {
  const merged = { ...previous, ...patch };
  const nextStatus = citizenStatusFromRecord(merged);
  const previousStatus = citizenStatusFromRecord(previous ?? {});

  await recordsService.update(id, patch, {
    actor,
    previous,
    onBatch: (batch) => {
      if (!citizen || nextStatus === previousStatus || !nextStatus) return;

      batch.set(
        docRef(COLLECTIONS.CITIZENS, citizen.id),
        {
          status: nextStatus,
          updatedAt: serverTimestamp(),
          updatedBy: actor.uid,
        },
        { merge: true },
      );

      batch.set(
        subDoc(paths.citizenHistory(citizen.id), generateId()),
        buildHistoryEvent(actor, {
          type: CITIZEN_EVENTS.STATUS_CHANGED,
          label: `Statut porté à ${nextStatus} (casier ${merged.number})`,
          refType: ENTITY_TYPES.RECORD,
          refId: id,
        }),
      );
    },
  });
}

export default recordsService;
