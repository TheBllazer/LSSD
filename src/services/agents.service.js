import {
  docRef,
  col,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query as fsQuery,
  where,
  orderBy,
  limit as fsLimit,
  increment,
  serverTimestamp,
  requireDb,
} from '@/firebase/db';
import { COLLECTIONS } from '@/firebase/paths';
import { getProvisioningAuth, sendPasswordReset } from '@/firebase/auth';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { buildPermissionDocument } from '@/utils/permissions';
import { buildSearchTokens } from '@/utils/tokens';
import { buildAuditEntry } from './audit.service';
import { generateId } from './base/crudFactory';
import { AGENT_STATUS, AUDIT_ACTIONS } from '@/types/agents';
import { agentSignature } from '@/utils/format';

/**
 * Gestion du personnel.
 *
 * Le module ne passe pas par la fabrique CRUD : un agent n'est pas un
 * enregistrement ordinaire. Son identifiant est imposé par Firebase
 * Authentication, ses droits vivent dans un document séparé lu par les règles,
 * et sa création implique un compte d'authentification.
 */

/* --------------------------------------------------------------- lectures */

/**
 * Lit le document d'autorité `/permissions/{uid}`.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function fetchPermissions(uid) {
  const snapshot = await getDoc(docRef(COLLECTIONS.PERMISSIONS, uid));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Lit la fiche d'un agent.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function fetchAgent(uid) {
  const snapshot = await getDoc(docRef(COLLECTIONS.AGENTS, uid));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Annuaire du personnel.
 * @param {{ status?: string, division?: string, max?: number }} [params]
 * @returns {Promise<object[]>}
 */
export async function listAgents({ status, division, max = 200 } = {}) {
  const constraints = [];
  if (status) constraints.push(where('status', '==', status));
  if (division) constraints.push(where('division', '==', division));
  constraints.push(orderBy('lastName', 'asc'), fsLimit(max));

  const snapshot = await getDocs(fsQuery(col(COLLECTIONS.AGENTS), ...constraints));
  return snapshot.docs.map((document) => document.data());
}

/**
 * Activité récente d'un agent.
 * @param {string} uid
 * @param {number} [max=50]
 * @returns {Promise<object[]>}
 */
export async function listAgentActivity(uid, max = 50) {
  if (!uid) return [];
  const snapshot = await getDocs(
    fsQuery(col(COLLECTIONS.AUDIT_LOGS), where('actorUid', '==', uid), orderBy('at', 'desc'), fsLimit(max)),
  );
  return snapshot.docs.map((document) => document.data());
}

/**
 * Journal d'audit global.
 * @param {{ action?: string, max?: number }} [params]
 * @returns {Promise<object[]>}
 */
export async function listAuditLog({ action, max = 100 } = {}) {
  const constraints = [];
  if (action) constraints.push(where('action', '==', action));
  constraints.push(orderBy('at', 'desc'), fsLimit(max));

  const snapshot = await getDocs(fsQuery(col(COLLECTIONS.AUDIT_LOGS), ...constraints));
  return snapshot.docs.map((document) => document.data());
}

/* --------------------------------------------------------------- écritures */

/**
 * Enregistre la connexion sur la fiche agent.
 * Échec silencieux : une erreur ici ne doit pas empêcher la session.
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function touchLastLogin(uid) {
  try {
    await updateDoc(docRef(COLLECTIONS.AGENTS, uid), {
      lastLoginAt: serverTimestamp(),
      loginCount: increment(1),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
  } catch (error) {
    console.warn('[LSSD] Mise à jour de la dernière connexion impossible :', error);
  }
}

/**
 * Crée un compte agent complet.
 *
 * Le compte d'authentification est créé via une **instance Firebase
 * secondaire** : `createUserWithEmailAndPassword` connecte automatiquement
 * l'utilisateur créé, ce qui déconnecterait l'administrateur s'il utilisait
 * l'instance principale. L'instance secondaire est déconnectée aussitôt.
 *
 * Le mot de passe n'est jamais conservé : il est transmis à Firebase puis
 * oublié, et l'agent reçoit un courriel de réinitialisation.
 *
 * @param {object} params
 * @param {object} params.profile   Champs de la fiche agent
 * @param {string} params.password  Mot de passe provisoire
 * @param {object} params.actor
 * @returns {Promise<{uid: string}>}
 */
export async function createAgentAccount({ profile, password, actor }) {
  const provisioningAuth = getProvisioningAuth();

  const credential = await createUserWithEmailAndPassword(
    provisioningAuth,
    profile.email.trim().toLowerCase(),
    password,
  );
  const uid = credential.user.uid;

  // La session secondaire n'a plus lieu d'être : on la ferme immédiatement.
  await signOut(provisioningAuth).catch(() => {});

  const agent = {
    uid,
    email: profile.email.trim().toLowerCase(),
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    badgeNumber: profile.badgeNumber.trim(),
    phone: profile.phone?.trim() || null,
    photoUrl: profile.photoUrl?.trim() || null,
    rank: profile.rank,
    role: profile.role,
    division: profile.division,
    service: profile.service?.trim() || null,
    callsign: profile.callsign?.trim() || null,
    status: AGENT_STATUS.ACTIVE,
    certifications: [],
    supervisorId: null,
    notes: '',
    loginCount: 0,
    lastLoginAt: null,
    deletedAt: null,
    searchTokens: buildSearchTokens([
      profile.firstName,
      profile.lastName,
      profile.badgeNumber,
      profile.callsign,
      profile.email,
    ]),
    createdAt: serverTimestamp(),
    createdBy: actor.uid,
    updatedAt: serverTimestamp(),
    updatedBy: actor.uid,
  };

  const batch = writeBatch(requireDb());
  batch.set(docRef(COLLECTIONS.AGENTS, uid), agent);
  batch.set(
    docRef(COLLECTIONS.PERMISSIONS, uid),
    buildPermissionDocument({ role: profile.role }),
  );
  batch.set(
    docRef(COLLECTIONS.AUDIT_LOGS, generateId()),
    buildAuditEntry(actor, {
      action: AUDIT_ACTIONS.CREATE,
      entityType: 'agent',
      entityId: uid,
      entityLabel: agentSignature(agent),
      meta: { role: profile.role },
    }),
  );
  await batch.commit();

  // L'agent définit lui-même son mot de passe : celui saisi ici ne sert qu'à
  // créer le compte et n'est communiqué à personne.
  await sendPasswordReset(agent.email).catch(() => {});

  return { uid };
}

/**
 * Met à jour la fiche d'un agent.
 * @param {string} uid
 * @param {object} patch
 * @param {object} actor
 * @returns {Promise<void>}
 */
export async function updateAgent(uid, patch, actor) {
  const merged = { ...patch };
  await setDoc(
    docRef(COLLECTIONS.AGENTS, uid),
    {
      ...merged,
      searchTokens: buildSearchTokens([
        patch.firstName,
        patch.lastName,
        patch.badgeNumber,
        patch.callsign,
        patch.email,
      ]),
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true },
  );
}

/**
 * Enregistre les habilitations d'un agent.
 *
 * La liste effective est **recompilée** à partir du rôle et des dérogations :
 * c'est elle que lisent les règles Firestore, et elle ne doit jamais être
 * saisie à la main. Un agent ne peut pas modifier ses propres droits — les
 * règles le refusent, et l'interface ne le propose pas.
 *
 * @param {object} params
 * @param {string} params.uid
 * @param {string} params.role
 * @param {string[]} params.grants
 * @param {string[]} params.revokes
 * @param {boolean} params.disabled
 * @param {object} params.actor
 * @returns {Promise<void>}
 */
export async function savePermissions({ uid, role, grants, revokes, disabled, actor }) {
  const document = buildPermissionDocument({ role, grants, revokes, disabled });

  const batch = writeBatch(requireDb());
  batch.set(docRef(COLLECTIONS.PERMISSIONS, uid), document);
  batch.set(
    docRef(COLLECTIONS.AGENTS, uid),
    { role, updatedAt: serverTimestamp(), updatedBy: actor.uid },
    { merge: true },
  );
  batch.set(
    docRef(COLLECTIONS.AUDIT_LOGS, generateId()),
    buildAuditEntry(actor, {
      action: AUDIT_ACTIONS.PERMISSION_CHANGE,
      entityType: 'agent',
      entityId: uid,
      entityLabel: uid,
      meta: { role, grants, revokes, disabled },
    }),
  );
  await batch.commit();
}

/**
 * Active ou désactive un compte.
 *
 * `disabled` dans le document de permissions est un coupe-circuit immédiat :
 * les règles Firestore le vérifient à chaque requête, sans attendre
 * l'expiration du jeton d'authentification.
 *
 * @param {object} params
 * @param {string} params.uid
 * @param {boolean} params.disabled
 * @param {object} params.permissions Document de permissions courant
 * @param {object} params.actor
 * @returns {Promise<void>}
 */
export async function setAccountDisabled({ uid, disabled, permissions, actor }) {
  await savePermissions({
    uid,
    role: permissions.role,
    grants: permissions.grants ?? [],
    revokes: permissions.revokes ?? [],
    disabled,
    actor,
  });

  await setDoc(
    docRef(COLLECTIONS.AGENTS, uid),
    {
      status: disabled ? AGENT_STATUS.SUSPENDED : AGENT_STATUS.ACTIVE,
      updatedAt: serverTimestamp(),
      updatedBy: actor.uid,
    },
    { merge: true },
  );
}

export { sendPasswordReset };
