import {
  docRef,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from '@/firebase/db';
import { COLLECTIONS } from '@/firebase/paths';

/**
 * Accès aux données du personnel.
 *
 * La phase 1 n'expose que ce dont la session a besoin : lecture du document de
 * permissions, lecture de la fiche agent et mise à jour de la dernière
 * connexion. La gestion complète (création de comptes, matrice de permissions,
 * activation) arrive en phase 9.
 */

/**
 * Lit le document d'autorité `/permissions/{uid}`.
 *
 * C'est la première lecture effectuée après authentification : elle conditionne
 * tout le reste (les règles Firestore exigent son existence pour lire quoi que
 * ce soit d'autre).
 *
 * @param {string} uid
 * @returns {Promise<object|null>} `null` si le compte n'est pas provisionné
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
 * Enregistre la connexion sur la fiche agent.
 *
 * Les champs touchés (`lastLoginAt`, `loginCount`) font partie de la liste
 * blanche que les règles autorisent un agent à modifier sur sa propre fiche ;
 * `updatedAt`/`updatedBy` sont exigés par la validation d'audit.
 *
 * Une erreur ici ne doit pas empêcher la connexion : elle est signalée mais
 * ne remonte pas.
 *
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
