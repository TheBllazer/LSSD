import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { env, isFirebaseConfigured } from '@/app/config/env';

/**
 * Initialisation de l'application Firebase.
 *
 * ⚠️ Seule cette couche (`src/firebase/**`) a le droit d'importer le SDK.
 * Les services (`src/services/**`) consomment `db` / `auth` exportés ici ;
 * les composants ne touchent jamais au SDK directement.
 *
 * Si la configuration est absente (fichier `.env.local` non renseigné), on
 * n'initialise rien et on laisse `main.jsx` afficher un écran explicite.
 */

const APP_NAME = 'lssd-rms';

/** Nom de l'instance secondaire utilisée pour provisionner des comptes. */
export const PROVISIONING_APP_NAME = 'lssd-provisioning';

/**
 * Récupère une instance nommée déjà créée, sinon undefined.
 * @param {string} name
 */
function findApp(name) {
  return getApps().find((app) => app.name === name);
}

/**
 * Active App Check sur une instance Firebase.
 *
 * App Check atteste que l'appel provient bien de **cette** application, et non
 * d'un script tiers muni de la clé API — laquelle est publique par conception.
 * C'est ce qui permet de laisser la création de comptes ouverte côté Firebase
 * sans exposer une porte utilisable depuis l'extérieur.
 *
 * Point capital : App Check est attaché à une **instance**, pas au projet.
 * L'instance secondaire qui provisionne les comptes doit donc être attestée
 * elle aussi — sans quoi la création de comptes échouerait dès l'activation de
 * l'enforcement, alors que tout le reste de l'application continuerait de
 * fonctionner. C'est exactement le genre de panne qu'on ne relie pas à sa cause.
 *
 * Sans `VITE_RECAPTCHA_SITE_KEY`, on n'initialise rien : App Check est alors
 * simplement inactif, ce qui reste valide tant que l'enforcement est désactivé
 * dans la console.
 *
 * @param {import('firebase/app').FirebaseApp} app
 */
function attachAppCheck(app) {
  if (!env.recaptchaSiteKey) return;

  try {
    if (env.isDev) {
      // Jeton de debug affiché en console au premier lancement, à enregistrer
      // dans Console Firebase → App Check → Applications. Sans lui, le poste de
      // développement est rejeté dès que l'enforcement est actif.
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn(`[LSSD] App Check non initialisé sur « ${app.name} » :`, error);
  }
}

/**
 * Crée (ou réutilise) l'application Firebase principale.
 * @returns {import('firebase/app').FirebaseApp | null}
 */
function createPrimaryApp() {
  if (!isFirebaseConfigured()) {
    console.error(
      '[LSSD] Configuration Firebase incomplète — copiez .env.example vers .env.local.',
    );
    return null;
  }

  const existing = findApp(APP_NAME);
  if (existing) return existing;

  const app = initializeApp(env.firebase, APP_NAME);
  attachAppCheck(app);
  return app;
}

export const firebaseApp = createPrimaryApp();

/**
 * Application Firebase secondaire, utilisée pour créer des comptes agents sans
 * remplacer la session de l'administrateur connecté (contrainte d'un front
 * statique : `createUserWithEmailAndPassword` connecte l'utilisateur créé).
 *
 * Instanciée à la demande — inutile de la créer pour tous les utilisateurs.
 *
 * Elle reçoit App Check comme l'instance principale : c'est précisément par
 * elle que passent les créations de comptes, l'appel le plus sensible de
 * l'application.
 *
 * @returns {import('firebase/app').FirebaseApp}
 */
export function getProvisioningApp() {
  if (!isFirebaseConfigured()) {
    throw new Error('Configuration Firebase absente : provisionnement impossible.');
  }
  const existing = findApp(PROVISIONING_APP_NAME);
  if (existing) return existing;

  const app = initializeApp(env.firebase, PROVISIONING_APP_NAME);
  attachAppCheck(app);
  return app;
}

/**
 * Accès sûr à l'application principale.
 * @returns {import('firebase/app').FirebaseApp}
 */
export function requireApp() {
  if (!firebaseApp) {
    throw new Error(
      "Firebase n'est pas initialisé. Vérifiez les variables VITE_FIREBASE_* de .env.local.",
    );
  }
  return getApp(APP_NAME);
}

export default firebaseApp;
