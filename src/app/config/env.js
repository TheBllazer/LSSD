/**
 * Accès centralisé et validé aux variables d'environnement.
 *
 * Toute variable exposée au client DOIT être préfixée `VITE_` (règle Vite).
 * On échoue tôt et bruyamment si la configuration Firebase est incomplète :
 * mieux vaut un écran d'erreur explicite qu'un `permission-denied` obscur.
 */

const raw = import.meta.env;

/** Convertit '1' | 'true' en booléen. */
const bool = (value) => value === '1' || value === 'true';

export const env = {
  mode: raw.MODE,
  isDev: raw.DEV,
  isProd: raw.PROD,

  /** Chemin de base injecté par Vite (`base` dans vite.config.js). */
  basePath: raw.BASE_URL,

  app: {
    name: raw.VITE_APP_NAME || 'LSSD RMS',
    version: raw.VITE_APP_VERSION || '1.0.0',
    agency: raw.VITE_AGENCY_NAME || "Los Santos Sheriff's Department",
  },

  firebase: {
    apiKey: raw.VITE_FIREBASE_API_KEY,
    authDomain: raw.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: raw.VITE_FIREBASE_PROJECT_ID,
    storageBucket: raw.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: raw.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: raw.VITE_FIREBASE_APP_ID,
  },

  recaptchaSiteKey: raw.VITE_RECAPTCHA_SITE_KEY || '',
  useEmulators: bool(raw.VITE_USE_EMULATORS),
};

/** Clés Firebase indispensables au démarrage. */
const REQUIRED_FIREBASE_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'];

/**
 * @returns {string[]} Liste des clés Firebase manquantes (vide si tout est OK).
 */
export function getMissingFirebaseKeys() {
  return REQUIRED_FIREBASE_KEYS.filter((key) => !env.firebase[key]);
}

/**
 * @returns {boolean} true si la configuration Firebase permet l'initialisation.
 */
export function isFirebaseConfigured() {
  return getMissingFirebaseKeys().length === 0;
}

export default env;
