import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  collection,
  doc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseApp, requireApp } from './app';
import { env } from '@/app/config/env';

/**
 * Instance Firestore de l'application.
 *
 * Cache local persistant activé (IndexedDB, multi-onglets) : les registres déjà
 * consultés se réaffichent instantanément et hors ligne, sans relecture facturée.
 */
function createDb() {
  if (!firebaseApp) return null;

  const instance = initializeFirestore(requireApp(), {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    ignoreUndefinedProperties: true,
  });

  if (env.useEmulators) {
    connectFirestoreEmulator(instance, '127.0.0.1', 8080);
    console.info('[LSSD] Firestore branché sur l\'émulateur 127.0.0.1:8080');
  }

  return instance;
}

export const db = createDb();

/** @returns {import('firebase/firestore').Firestore} */
export function requireDb() {
  if (!db) throw new Error('Firestore non initialisé (configuration Firebase absente).');
  return db;
}

/* ---------------------------------------------------------------- conversion */

/**
 * Convertit récursivement les Timestamp Firestore en Date JavaScript.
 * Indispensable pour que le cache TanStack Query soit sérialisable en IndexedDB
 * (une Date passe la structured clone, un Timestamp non).
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function timestampsToDates(value) {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(timestampsToDates);
  if (value && typeof value === 'object' && value.constructor === Object) {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = timestampsToDates(item);
    }
    return output;
  }
  return value;
}

/**
 * Retire les propriétés `undefined` (Firestore les refuse) et le champ `id`
 * (l'identifiant vit dans le chemin du document, jamais dans ses données).
 *
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
export function sanitizeForWrite(data) {
  const output = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || key === 'id') continue;
    output[key] = value;
  }
  return output;
}

/**
 * Convertisseur générique : ajoute `id`, normalise les dates, nettoie les écritures.
 * @template T
 * @returns {import('firebase/firestore').FirestoreDataConverter<T>}
 */
export function createConverter() {
  return {
    toFirestore: (data) => sanitizeForWrite(data),
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return { id: snapshot.id, ...timestampsToDates(data) };
    },
  };
}

/** Convertisseur partagé — sans état, donc réutilisable partout. */
export const converter = createConverter();

/* ------------------------------------------------------------------ helpers */

/**
 * Référence de collection racine, convertisseur appliqué.
 * @param {string} name Nom issu de `COLLECTIONS`
 */
export function col(name) {
  return collection(requireDb(), name).withConverter(converter);
}

/**
 * Référence de document racine, convertisseur appliqué.
 * @param {string} name Nom de collection
 * @param {string} id   Identifiant du document
 */
export function docRef(name, id) {
  return doc(requireDb(), name, id).withConverter(converter);
}

/**
 * Référence de sous-collection à partir d'un tableau de segments.
 * @param {string[]} segments Ex. `paths.citizenHistory(citizenId)`
 */
export function subCol(segments) {
  return collection(requireDb(), ...segments).withConverter(converter);
}

/**
 * Référence de document dans une sous-collection.
 * @param {string[]} segments Segments de la sous-collection
 * @param {string} id         Identifiant du document
 */
export function subDoc(segments, id) {
  return doc(requireDb(), ...segments, id).withConverter(converter);
}

/** Horodatage serveur — seule source d'heure autorisée pour l'audit. */
export const now = serverTimestamp;

export default db;
