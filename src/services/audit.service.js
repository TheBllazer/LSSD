import { col, addDoc, serverTimestamp } from '@/firebase/db';
import { COLLECTIONS } from '@/firebase/paths';
import { AUDIT_ACTIONS } from '@/types/agents';

/**
 * Journal d'audit.
 *
 * Le journal est **immuable** : les règles Firestore n'autorisent que la
 * création et la lecture. Chaque entrée porte l'horodatage serveur et l'identité
 * de son auteur, forcés par les règles — un agent ne peut pas écrire au nom
 * d'un autre.
 *
 * @typedef {object} AuditActor
 * @property {string} uid
 * @property {string} name    Signature lisible (« SGT J. Marston #1042 »)
 * @property {string} [badge]
 */

/**
 * Construit une entrée d'audit, sans l'écrire.
 * Utilisé pour inclure le journal dans un `writeBatch` métier (phase 2), afin
 * qu'une action et sa trace soient atomiques.
 *
 * @param {AuditActor} actor
 * @param {object} payload
 * @param {string} payload.action           Valeur de `AUDIT_ACTIONS`
 * @param {string} [payload.entityType]
 * @param {string} [payload.entityId]
 * @param {string} [payload.entityLabel]
 * @param {Record<string, unknown>} [payload.meta]
 * @returns {object}
 */
export function buildAuditEntry(actor, payload) {
  return {
    at: serverTimestamp(),
    actorUid: actor?.uid ?? null,
    actorName: actor?.name ?? 'Inconnu',
    actorBadge: actor?.badge ?? null,
    action: payload.action,
    entityType: payload.entityType ?? null,
    entityId: payload.entityId ?? null,
    entityLabel: payload.entityLabel ?? null,
    meta: payload.meta ?? null,
  };
}

/**
 * Écrit une entrée dans le journal.
 *
 * L'échec d'une écriture d'audit ne doit **jamais** interrompre l'action
 * métier de l'agent : on trace l'erreur en console et on continue.
 *
 * @param {AuditActor} actor
 * @param {object} payload  Voir `buildAuditEntry`
 * @returns {Promise<void>}
 */
export async function logAudit(actor, payload) {
  try {
    await addDoc(col(COLLECTIONS.AUDIT_LOGS), buildAuditEntry(actor, payload));
  } catch (error) {
    console.warn("[LSSD] Écriture du journal d'audit impossible :", error);
  }
}

/**
 * Journalise une connexion réussie.
 * @param {AuditActor} actor
 * @returns {Promise<void>}
 */
export function logLogin(actor) {
  return logAudit(actor, {
    action: AUDIT_ACTIONS.LOGIN,
    entityType: 'agent',
    entityId: actor.uid,
    entityLabel: actor.name,
    meta: { userAgent: navigator.userAgent },
  });
}

/**
 * Journalise une déconnexion.
 * @param {AuditActor} actor
 * @returns {Promise<void>}
 */
export function logLogout(actor) {
  return logAudit(actor, {
    action: AUDIT_ACTIONS.LOGOUT,
    entityType: 'agent',
    entityId: actor.uid,
    entityLabel: actor.name,
  });
}

/**
 * Journalise une tentative d'accès refusée (route ou action interdite).
 * @param {AuditActor} actor
 * @param {string} resource   Chemin ou identifiant de la ressource visée
 * @param {string} permission Permission manquante
 * @returns {Promise<void>}
 */
export function logAccessDenied(actor, resource, permission) {
  return logAudit(actor, {
    action: AUDIT_ACTIONS.ACCESS_DENIED,
    entityType: 'route',
    entityLabel: resource,
    meta: { permission },
  });
}
