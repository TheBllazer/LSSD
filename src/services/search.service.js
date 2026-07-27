import { col, getDocs, query as fsQuery, orderBy, limit as fsLimit } from '@/firebase/db';
import { COLLECTIONS } from '@/firebase/paths';
import { matchesQuery } from '@/utils/tokens';

/**
 * Recherche globale.
 *
 * L'index `/searchIndex` contient une entrée plate par fiche — type, libellé,
 * sous-titre, vignette, jetons — alimentée dans le même lot que chaque
 * écriture métier. Le charger une fois puis filtrer en mémoire donne une
 * recherche réellement instantanée : la frappe ne déclenche aucune lecture.
 *
 * C'est le compromis assumé du projet : quelques centaines de kilo-octets
 * chargés une fois, contre une requête réseau par caractère tapé.
 */

/** Nombre maximum d'entrées chargées. */
const INDEX_LIMIT = 2000;

/**
 * Charge l'index de recherche.
 * @returns {Promise<object[]>}
 */
export async function loadSearchIndex() {
  const snapshot = await getDocs(
    fsQuery(col(COLLECTIONS.SEARCH_INDEX), orderBy('updatedAt', 'desc'), fsLimit(INDEX_LIMIT)),
  );
  return snapshot.docs.map((document) => document.data());
}

/** Préfixes de filtrage par type, saisis dans la palette. */
export const TYPE_PREFIXES = {
  'c:': 'citizen',
  'v:': 'vehicle',
  'a:': 'weapon',
  'r:': 'report',
  'k:': 'record',
  'm:': 'mapFeature',
};

/**
 * Interprète la saisie : préfixe de type éventuel, puis termes.
 *
 * @param {string} input
 * @returns {{ type: string|null, terms: string }}
 */
export function parseQuery(input) {
  const trimmed = (input ?? '').trimStart();
  for (const [prefix, type] of Object.entries(TYPE_PREFIXES)) {
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return { type, terms: trimmed.slice(prefix.length).trim() };
    }
  }
  return { type: null, terms: trimmed.trim() };
}

/**
 * Filtre l'index en mémoire.
 *
 * @param {object[]} index
 * @param {string} input
 * @param {number} [max=40]
 * @returns {object[]}
 */
export function searchIndex(index, input, max = 40) {
  const { type, terms } = parseQuery(input);
  if (!terms && !type) return [];

  const results = index.filter((entry) => {
    if (type && entry.type !== type) return false;
    if (!terms) return true;
    return matchesQuery(terms, [entry.label, entry.subtitle]);
  });

  return results.slice(0, max);
}
