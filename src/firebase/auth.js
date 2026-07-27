import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { firebaseApp, requireApp, getProvisioningApp } from './app';
import { env } from '@/app/config/env';

/**
 * Couche d'accès à Firebase Authentication.
 *
 * L'application n'expose aucune inscription publique : les comptes sont
 * provisionnés par un administrateur depuis le module Agents (phase 9), via une
 * instance Firebase secondaire pour ne pas casser la session en cours.
 */

function createAuth() {
  if (!firebaseApp) return null;
  const instance = getAuth(requireApp());
  instance.languageCode = 'fr';

  if (env.useEmulators) {
    connectAuthEmulator(instance, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.info('[LSSD] Auth branché sur l\'émulateur 127.0.0.1:9099');
  }

  return instance;
}

export const auth = createAuth();

/** @returns {import('firebase/auth').Auth} */
export function requireAuth() {
  if (!auth) throw new Error('Firebase Auth non initialisé (configuration absente).');
  return auth;
}

/**
 * Authentifie un agent.
 *
 * @param {string} email
 * @param {string} password
 * @param {boolean} [remember=true] `true` → session conservée après fermeture du
 *                                   navigateur ; `false` → session d'onglet.
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signIn(email, password, remember = true) {
  const instance = requireAuth();
  await setPersistence(
    instance,
    remember ? browserLocalPersistence : browserSessionPersistence,
  );
  const credential = await signInWithEmailAndPassword(
    instance,
    email.trim().toLowerCase(),
    password,
  );
  return credential.user;
}

/** Déconnecte l'agent courant. */
export async function signOut() {
  await fbSignOut(requireAuth());
}

/**
 * Envoie un e-mail de réinitialisation de mot de passe.
 * Déclenché par un administrateur depuis la fiche agent.
 * @param {string} email
 */
export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(requireAuth(), email.trim().toLowerCase());
}

/**
 * Change le mot de passe de l'agent connecté.
 *
 * Seule voie de changement disponible depuis un front statique : le SDK client
 * ne peut modifier que le compte courant. Un administrateur ne peut pas
 * réattribuer le mot de passe d'un autre agent — cela demanderait le SDK
 * Admin, donc un serveur.
 *
 * Firebase exige une authentification récente avant toute modification
 * sensible : on rejoue donc les identifiants actuels. C'est aussi ce qui
 * empêche un poste laissé déverrouillé de servir à confisquer un compte.
 *
 * @param {string} currentPassword
 * @param {string} newPassword
 */
export async function changeOwnPassword(currentPassword, newPassword) {
  const instance = requireAuth();
  const user = instance.currentUser;
  if (!user) throw new Error('Aucune session active.');

  await reauthenticateWithCredential(
    user,
    EmailAuthProvider.credential(user.email, currentPassword),
  );
  await updatePassword(user, newPassword);
}

/**
 * S'abonne aux changements d'état d'authentification.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} Fonction de désabonnement
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(requireAuth(), callback);
}

/**
 * Instance Auth secondaire dédiée à la création de comptes.
 * Permet d'appeler `createUserWithEmailAndPassword` sans déconnecter l'admin.
 * @returns {import('firebase/auth').Auth}
 */
export function getProvisioningAuth() {
  return getAuth(getProvisioningApp());
}

/**
 * Traduit les codes d'erreur Firebase en messages destinés aux agents.
 * @param {unknown} error
 * @returns {string}
 */
export function describeAuthError(error) {
  const code = typeof error === 'object' && error !== null ? error.code : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Adresse e-mail invalide.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé. Contactez un administrateur.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Identifiants incorrects.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Accès temporairement bloqué.';
    case 'auth/network-request-failed':
      return 'Connexion au serveur impossible. Vérifiez le réseau.';
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà associée à un compte.';
    case 'auth/weak-password':
      return 'Mot de passe trop faible (8 caractères minimum).';
    case 'auth/requires-recent-login':
      return 'Session trop ancienne. Reconnectez-vous puis réessayez.';
    case 'auth/missing-password':
      return 'Mot de passe requis.';
    case 'auth/operation-not-allowed':
      return "L'authentification par e-mail n'est pas activée sur le projet Firebase.";
    case 'auth/configuration-not-found':
      return 'Configuration Firebase Authentication introuvable pour ce projet.';
    case 'auth/unauthorized-domain':
      return "Ce domaine n'est pas autorisé dans les réglages Firebase Authentication.";
    default:
      // Le code inconnu est tracé : sans lui, diagnostiquer une erreur de
      // configuration du projet reviendrait à deviner.
      console.warn('[LSSD] Code d\'erreur Auth non traité :', code, error);
      return "Échec de l'authentification. Réessayez.";
  }
}

export default auth;
