import { createCrudService, generateId } from './base/crudFactory';
import {
  subCol,
  subDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query as fsQuery,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
} from '@/firebase/db';
import { COLLECTIONS, paths } from '@/firebase/paths';
import { ENTITY_TYPES } from '@/app/config/constants';
import { registryName } from '@/utils/format';
import { SEX_ABBR } from '@/types/citizens';
import { formatDate } from '@/utils/dates';

/**
 * Service du registre des citoyens.
 *
 * Le module de référence : véhicules, armes, rapports et casiers suivront
 * exactement la même structure, seuls les champs indexés et le libellé changent.
 */

/**
 * Libellé au format registre — « DE SANTA, Michael ».
 * @param {object} citizen
 * @returns {string}
 */
function labelOf(citizen) {
  return registryName(citizen, 'Fiche sans nom');
}

/**
 * Champs alimentant l'index de recherche.
 * On indexe ce sur quoi un agent cherche réellement : nom, alias, téléphone,
 * adresse, employeur — pas les descriptions libres, qui feraient exploser le
 * nombre de tokens sans améliorer la pertinence.
 *
 * @param {object} citizen
 * @returns {string[]}
 */
function tokensOf(citizen) {
  return [
    citizen.firstName,
    citizen.lastName,
    ...(citizen.aliases ?? []),
    citizen.phone,
    citizen.email,
    citizen.address?.street,
    citizen.address?.district,
    citizen.occupation,
    citizen.employer,
    ...(citizen.affiliations ?? []).map((affiliation) => affiliation.name),
  ];
}

/**
 * Sous-titre affiché dans la recherche globale.
 * @param {object} citizen
 * @returns {string}
 */
function subtitleOf(citizen) {
  return [
    SEX_ABBR[citizen.sex] ?? '',
    citizen.birthDate ? formatDate(citizen.birthDate) : '',
    citizen.address?.district ?? '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export const citizensService = createCrudService({
  collection: COLLECTIONS.CITIZENS,
  entityType: ENTITY_TYPES.CITIZEN,
  labelOf,
  tokensOf,
  subtitleOf,
  photoOf: (citizen) => citizen.photoUrl ?? null,
  statKey: 'citizens',
  historyPath: paths.citizenHistory,
  defaultOrder: { field: 'lastName', direction: 'asc' },
  searchOrderField: 'lastName',
});

/* ------------------------------------------------------------------- notes */

/**
 * Notes internes d'une fiche, épinglées en premier.
 * @param {string} citizenId
 * @returns {Promise<object[]>}
 */
export async function listNotes(citizenId) {
  if (!citizenId) return [];
  const snapshot = await getDocs(
    fsQuery(subCol(paths.citizenNotes(citizenId)), orderBy('createdAt', 'desc'), fsLimit(200)),
  );
  return snapshot.docs
    .map((document) => document.data())
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
}

/**
 * Ajoute une note à une fiche.
 * @param {string} citizenId
 * @param {object} actor `{ uid, name }`
 * @param {string} body
 * @returns {Promise<void>}
 */
export async function addNote(citizenId, actor, body) {
  await setDoc(subDoc(paths.citizenNotes(citizenId), generateId()), {
    body: body.trim(),
    authorUid: actor.uid,
    authorName: actor.name,
    pinned: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * Épingle ou désépingle une note.
 * @param {string} citizenId
 * @param {string} noteId
 * @param {boolean} pinned
 * @returns {Promise<void>}
 */
export async function setNotePinned(citizenId, noteId, pinned) {
  await setDoc(subDoc(paths.citizenNotes(citizenId), noteId), { pinned }, { merge: true });
}

/**
 * Supprime une note.
 * @param {string} citizenId
 * @param {string} noteId
 * @returns {Promise<void>}
 */
export async function deleteNote(citizenId, noteId) {
  await deleteDoc(subDoc(paths.citizenNotes(citizenId), noteId));
}

/* ------------------------------------------------------------------ photos */

/**
 * Galerie d'une fiche.
 * @param {string} citizenId
 * @returns {Promise<object[]>}
 */
export async function listPhotos(citizenId) {
  if (!citizenId) return [];
  const snapshot = await getDocs(
    fsQuery(subCol(paths.citizenPhotos(citizenId)), orderBy('addedAt', 'desc'), fsLimit(100)),
  );
  return snapshot.docs.map((document) => document.data());
}

/**
 * Ajoute une photographie à la galerie.
 * @param {string} citizenId
 * @param {object} actor
 * @param {{url: string, caption?: string, category?: string}} photo
 * @returns {Promise<void>}
 */
export async function addPhoto(citizenId, actor, photo) {
  await setDoc(subDoc(paths.citizenPhotos(citizenId), generateId()), {
    url: photo.url.trim(),
    caption: photo.caption?.trim() ?? '',
    category: photo.category ?? 'OTHER',
    addedBy: actor.uid,
    addedByName: actor.name,
    addedAt: serverTimestamp(),
  });
}

/**
 * Retire une photographie de la galerie.
 * @param {string} citizenId
 * @param {string} photoId
 * @returns {Promise<void>}
 */
export async function deletePhoto(citizenId, photoId) {
  await deleteDoc(subDoc(paths.citizenPhotos(citizenId), photoId));
}

export default citizensService;
