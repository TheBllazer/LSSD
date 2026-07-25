import { createCrudService, generateId, buildHistoryEvent } from './base/crudFactory';
import {
  docRef,
  subDoc,
  writeBatch,
  increment,
  serverTimestamp,
  requireDb,
} from '@/firebase/db';
import { COLLECTIONS, paths } from '@/firebase/paths';
import { ENTITY_TYPES } from '@/app/config/constants';
import { registryName } from '@/utils/format';
import { AUDIT_ACTIONS } from '@/types/agents';
import { CITIZEN_EVENTS } from '@/types/citizens';
import { VEHICLE_EVENTS, VEHICLE_TYPE_LABELS } from '@/types/vehicles';
import { buildAuditEntry } from './audit.service';

/**
 * Service du registre des véhicules.
 */

/** Libellé : « 46EEK572 — Bravado Buffalo ». */
function labelOf(vehicle) {
  const model = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
  return [vehicle.plate, model].filter(Boolean).join(' — ') || 'Véhicule sans plaque';
}

/** Champs indexés pour la recherche. */
function tokensOf(vehicle) {
  return [
    vehicle.plate,
    vehicle.vin,
    vehicle.make,
    vehicle.model,
    vehicle.color,
    vehicle.ownerSnapshot?.label,
  ];
}

function subtitleOf(vehicle) {
  return [
    VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type,
    vehicle.year ? String(vehicle.year) : '',
    vehicle.color,
    vehicle.ownerSnapshot?.label,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const vehiclesService = createCrudService({
  collection: COLLECTIONS.VEHICLES,
  entityType: ENTITY_TYPES.VEHICLE,
  labelOf,
  tokensOf,
  subtitleOf,
  photoOf: (vehicle) => vehicle.photoUrl ?? null,
  statKey: 'vehicles',
  historyPath: paths.vehicleHistory,
  defaultOrder: { field: 'plate', direction: 'asc' },
  searchOrderField: 'plate',
});

/**
 * Instantané du propriétaire conservé sur la fiche.
 *
 * Dénormalisation volontaire et limitée à l'affichage : elle évite une lecture
 * par ligne dans les registres, et surtout elle **survit à l'archivage** du
 * citoyen — une fiche véhicule doit rester lisible même si le propriétaire a
 * été retiré du registre.
 *
 * @param {object|null} citizen
 * @returns {{id: string, label: string, photoUrl: string|null}|null}
 */
export function ownerSnapshot(citizen) {
  if (!citizen) return null;
  return {
    id: citizen.id,
    label: registryName(citizen),
    photoUrl: citizen.photoUrl ?? null,
  };
}

/**
 * Attribue, change ou retire le propriétaire d'un véhicule.
 *
 * Toute la liaison bidirectionnelle tient dans un seul lot :
 *  - la fiche véhicule reçoit l'identifiant et l'instantané du nouveau
 *    propriétaire ;
 *  - le compteur `counters.vehicles` est décrémenté chez l'ancien, incrémenté
 *    chez le nouveau ;
 *  - un événement est écrit dans les chronologies des trois fiches concernées.
 *
 * Rien ne peut donc se désynchroniser : soit la mutation entière réussit, soit
 * elle échoue sans laisser de compteur faux.
 *
 * @param {object} params
 * @param {object} params.vehicle        Fiche véhicule courante
 * @param {object|null} params.newOwner  Citoyen à rattacher, ou `null`
 * @param {object|null} params.previousOwner Citoyen actuellement rattaché
 * @param {object} params.actor          `{ uid, name }`
 * @returns {Promise<void>}
 */
export async function assignOwner({ vehicle, newOwner, previousOwner, actor }) {
  if (vehicle.ownerId === (newOwner?.id ?? null)) return;

  const batch = writeBatch(requireDb());
  const snapshot = ownerSnapshot(newOwner);
  const vehicleLabel = labelOf(vehicle);

  // --- Fiche véhicule
  batch.set(
    docRef(COLLECTIONS.VEHICLES, vehicle.id),
    {
      ownerId: newOwner?.id ?? null,
      ownerSnapshot: snapshot,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true },
  );

  // --- Ancien propriétaire : compteur et chronologie
  if (previousOwner) {
    batch.set(
      docRef(COLLECTIONS.CITIZENS, previousOwner.id),
      {
        counters: { vehicles: increment(-1) },
        updatedAt: serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: true },
    );

    batch.set(
      subDoc(paths.citizenHistory(previousOwner.id), generateId()),
      buildHistoryEvent(actor, {
        type: CITIZEN_EVENTS.VEHICLE_REMOVED,
        label: `Véhicule retiré : ${vehicleLabel}`,
        refType: ENTITY_TYPES.VEHICLE,
        refId: vehicle.id,
      }),
    );
  }

  // --- Nouveau propriétaire : compteur et chronologie
  if (newOwner) {
    batch.set(
      docRef(COLLECTIONS.CITIZENS, newOwner.id),
      {
        counters: { vehicles: increment(1) },
        updatedAt: serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: true },
    );

    batch.set(
      subDoc(paths.citizenHistory(newOwner.id), generateId()),
      buildHistoryEvent(actor, {
        type: CITIZEN_EVENTS.VEHICLE_ADDED,
        label: `Véhicule enregistré : ${vehicleLabel}`,
        refType: ENTITY_TYPES.VEHICLE,
        refId: vehicle.id,
      }),
    );
  }

  // --- Chronologie du véhicule
  batch.set(
    subDoc(paths.vehicleHistory(vehicle.id), generateId()),
    buildHistoryEvent(actor, {
      type: newOwner ? VEHICLE_EVENTS.OWNER_ASSIGNED : VEHICLE_EVENTS.OWNER_REMOVED,
      label: newOwner
        ? `Propriétaire : ${registryName(newOwner)}`
        : `Propriétaire retiré${previousOwner ? ` (${registryName(previousOwner)})` : ''}`,
      refType: ENTITY_TYPES.CITIZEN,
      refId: newOwner?.id ?? previousOwner?.id ?? null,
    }),
  );

  // --- Index de recherche : le nom du propriétaire y figure
  vehiclesService.stageSearchIndex(batch, vehicle.id, {
    ...vehicle,
    ownerId: newOwner?.id ?? null,
    ownerSnapshot: snapshot,
  });

  // --- Journal d'audit
  batch.set(
    docRef(COLLECTIONS.AUDIT_LOGS, generateId()),
    buildAuditEntry(actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.VEHICLE,
      entityId: vehicle.id,
      entityLabel: vehicleLabel,
      meta: {
        ownerFrom: previousOwner?.id ?? null,
        ownerTo: newOwner?.id ?? null,
      },
    }),
  );

  await batch.commit();
}

/**
 * Met un véhicule en fourrière ou l'en sort.
 *
 * @param {object} params
 * @param {object} params.vehicle
 * @param {boolean} params.impounded
 * @param {string} [params.lot]
 * @param {string} [params.reason]
 * @param {object} params.actor
 * @returns {Promise<void>}
 */
export async function setImpound({ vehicle, impounded, lot, reason, actor }) {
  const batch = writeBatch(requireDb());

  batch.set(
    docRef(COLLECTIONS.VEHICLES, vehicle.id),
    {
      impound: {
        isImpounded: impounded,
        lot: impounded ? (lot ?? null) : null,
        since: impounded ? serverTimestamp() : null,
        reason: impounded ? (reason ?? null) : null,
      },
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true },
  );

  batch.set(
    subDoc(paths.vehicleHistory(vehicle.id), generateId()),
    buildHistoryEvent(actor, {
      type: impounded ? VEHICLE_EVENTS.IMPOUNDED : VEHICLE_EVENTS.RELEASED,
      label: impounded
        ? `Mise en fourrière${lot ? ` — ${lot}` : ''}${reason ? ` (${reason})` : ''}`
        : 'Sortie de fourrière',
    }),
  );

  await batch.commit();
}

export default vehiclesService;
