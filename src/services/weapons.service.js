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
import { CITIZEN_EVENTS, LICENSE_TYPES, LICENSE_STATUS } from '@/types/citizens';
import {
  WEAPON_EVENTS,
  WEAPON_CATEGORY_LABELS,
  LICENSE_REQUIRED_CLASSIFICATIONS,
} from '@/types/weapons';
import { buildAuditEntry } from './audit.service';
import { ownerSnapshot } from './vehicles.service';

/**
 * Service du registre des armes.
 */

/** Libellé : « SN-77-A4192 — Vom Feuer Combat Pistol ». */
function labelOf(weapon) {
  const model = [weapon.make, weapon.model].filter(Boolean).join(' ');
  return [weapon.serialNumber, model].filter(Boolean).join(' — ') || 'Arme non identifiée';
}

/** Champs indexés pour la recherche. */
function tokensOf(weapon) {
  return [
    weapon.serialNumber,
    weapon.make,
    weapon.model,
    weapon.caliber,
    weapon.ownerSnapshot?.label,
  ];
}

function subtitleOf(weapon) {
  return [
    WEAPON_CATEGORY_LABELS[weapon.category] ?? weapon.category,
    weapon.caliber,
    weapon.ownerSnapshot?.label,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const weaponsService = createCrudService({
  collection: COLLECTIONS.WEAPONS,
  entityType: ENTITY_TYPES.WEAPON,
  labelOf,
  tokensOf,
  subtitleOf,
  photoOf: (weapon) => weapon.photoUrl ?? null,
  statKey: 'weapons',
  historyPath: paths.weaponHistory,
  defaultOrder: { field: 'registeredAt', direction: 'desc' },
  searchOrderField: 'registeredAt',
});

/**
 * Contrôle de conformité entre l'arme et le permis de son détenteur.
 *
 * Une arme soumise à autorisation détenue par quelqu'un dont le permis de port
 * d'arme est suspendu, révoqué ou absent constitue une infraction : c'est
 * exactement ce qu'un agent doit voir en ouvrant la fiche, sans avoir à
 * recouper deux registres lui-même.
 *
 * @param {object} weapon
 * @param {object|null} owner Fiche citoyen du détenteur
 * @returns {{ compliant: boolean, severity: 'ok'|'warn'|'danger', message: string }}
 */
export function checkLicenseCompliance(weapon, owner) {
  const required = LICENSE_REQUIRED_CLASSIFICATIONS.includes(weapon.classification);

  if (!required) {
    return {
      compliant: true,
      severity: 'ok',
      message: "Cette arme n'exige pas de permis de port d'arme.",
    };
  }

  if (!owner) {
    return {
      compliant: false,
      severity: 'warn',
      message:
        "Arme soumise à autorisation sans détenteur enregistré. Aucun permis ne peut être vérifié.",
    };
  }

  const license = (owner.licenses ?? []).find(
    (item) => item.type === LICENSE_TYPES.FIREARM,
  );

  if (!license) {
    return {
      compliant: false,
      severity: 'danger',
      message: `${registryName(owner)} ne détient aucun permis de port d'arme.`,
    };
  }

  if (license.status !== LICENSE_STATUS.VALID) {
    return {
      compliant: false,
      severity: 'danger',
      message: `Le permis de port d'arme de ${registryName(owner)} est ${
        license.status === LICENSE_STATUS.SUSPENDED
          ? 'suspendu'
          : license.status === LICENSE_STATUS.REVOKED
            ? 'révoqué'
            : 'expiré'
      }.`,
    };
  }

  return {
    compliant: true,
    severity: 'ok',
    message: `Permis de port d'arme valide (${license.number || 'numéro non renseigné'}).`,
  };
}

/**
 * Attribue, change ou retire le détenteur d'une arme.
 *
 * Même mécanique que pour les véhicules : fiche, compteurs et chronologies des
 * trois entités concernées partent dans un lot unique.
 *
 * @param {object} params
 * @param {object} params.weapon
 * @param {object|null} params.newOwner
 * @param {object|null} params.previousOwner
 * @param {object} params.actor
 * @returns {Promise<void>}
 */
export async function assignHolder({ weapon, newOwner, previousOwner, actor }) {
  if (weapon.ownerId === (newOwner?.id ?? null)) return;

  const batch = writeBatch(requireDb());
  const snapshot = ownerSnapshot(newOwner);
  const weaponLabel = labelOf(weapon);

  batch.set(
    docRef(COLLECTIONS.WEAPONS, weapon.id),
    {
      ownerId: newOwner?.id ?? null,
      ownerSnapshot: snapshot,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true },
  );

  if (previousOwner) {
    batch.set(
      docRef(COLLECTIONS.CITIZENS, previousOwner.id),
      {
        counters: { weapons: increment(-1) },
        updatedAt: serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: true },
    );

    batch.set(
      subDoc(paths.citizenHistory(previousOwner.id), generateId()),
      buildHistoryEvent(actor, {
        type: CITIZEN_EVENTS.WEAPON_REMOVED,
        label: `Arme retirée : ${weaponLabel}`,
        refType: ENTITY_TYPES.WEAPON,
        refId: weapon.id,
      }),
    );
  }

  if (newOwner) {
    batch.set(
      docRef(COLLECTIONS.CITIZENS, newOwner.id),
      {
        counters: { weapons: increment(1) },
        updatedAt: serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: true },
    );

    batch.set(
      subDoc(paths.citizenHistory(newOwner.id), generateId()),
      buildHistoryEvent(actor, {
        type: CITIZEN_EVENTS.WEAPON_ADDED,
        label: `Arme enregistrée : ${weaponLabel}`,
        refType: ENTITY_TYPES.WEAPON,
        refId: weapon.id,
      }),
    );
  }

  batch.set(
    subDoc(paths.weaponHistory(weapon.id), generateId()),
    buildHistoryEvent(actor, {
      type: newOwner ? WEAPON_EVENTS.OWNER_ASSIGNED : WEAPON_EVENTS.OWNER_REMOVED,
      label: newOwner
        ? `Détenteur : ${registryName(newOwner)}`
        : `Détenteur retiré${previousOwner ? ` (${registryName(previousOwner)})` : ''}`,
      refType: ENTITY_TYPES.CITIZEN,
      refId: newOwner?.id ?? previousOwner?.id ?? null,
    }),
  );

  weaponsService.stageSearchIndex(batch, weapon.id, {
    ...weapon,
    ownerId: newOwner?.id ?? null,
    ownerSnapshot: snapshot,
  });

  batch.set(
    docRef(COLLECTIONS.AUDIT_LOGS, generateId()),
    buildAuditEntry(actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entityType: ENTITY_TYPES.WEAPON,
      entityId: weapon.id,
      entityLabel: weaponLabel,
      meta: {
        ownerFrom: previousOwner?.id ?? null,
        ownerTo: newOwner?.id ?? null,
      },
    }),
  );

  await batch.commit();
}

export default weaponsService;
