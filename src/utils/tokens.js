/**
 * Tokenisation pour la recherche.
 *
 * Firestore ne propose pas de recherche plein texte. La stratégie retenue est
 * un index de préfixes : chaque document stocke un tableau `searchTokens`
 * interrogeable avec `array-contains`, ce qui permet une recherche « commence
 * par » sur n'importe quel mot de la fiche, sans service externe.
 *
 * Limites assumées : pas de recherche au milieu d'un mot, pas de correction
 * orthographique. Pour un RMS où l'on cherche un nom, une plaque ou un numéro
 * de série, c'est le compromis qui coûte le moins cher en lectures.
 */

/** Longueur minimale d'un préfixe indexé. */
export const MIN_PREFIX = 2;
/** Longueur maximale d'un préfixe indexé. */
export const MAX_PREFIX = 12;
/** Plafond de tokens par document (limite Firestore : 40 000 octets/document). */
export const MAX_TOKENS = 60;

/**
 * Normalise une chaîne : minuscules, sans accent, sans ponctuation.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Découpe une chaîne normalisée en mots.
 * @param {string} value
 * @returns {string[]}
 */
export function words(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
}

/**
 * Construit le tableau de tokens d'un document.
 *
 * Chaque mot produit ses préfixes de `MIN_PREFIX` à `MAX_PREFIX` caractères.
 * Les mots d'un seul caractère sont conservés tels quels (initiales, calibres).
 *
 * @param {(string|null|undefined)[]} values Champs à indexer
 * @returns {string[]} Tokens dédoublonnés, plafonnés à `MAX_TOKENS`
 *
 * @example
 * buildSearchTokens(['Michael', 'De Santa'])
 * // ['mi','mic','mich',…,'michael','de','sa','san',…,'santa']
 */
export function buildSearchTokens(values = []) {
  const tokens = new Set();

  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;

    for (const word of words(value)) {
      if (word.length === 1) {
        tokens.add(word);
        continue;
      }
      const upper = Math.min(word.length, MAX_PREFIX);
      for (let size = MIN_PREFIX; size <= upper; size += 1) {
        tokens.add(word.slice(0, size));
      }
      // Un mot plus long que MAX_PREFIX reste trouvable en entier.
      if (word.length > MAX_PREFIX) tokens.add(word.slice(0, MAX_PREFIX));
    }
  }

  return [...tokens].slice(0, MAX_TOKENS);
}

/**
 * Prépare une saisie utilisateur pour une requête `array-contains`.
 *
 * @param {string} query
 * @returns {string|null} Token interrogeable, ou `null` si la saisie est trop
 *                        courte pour être indexée
 */
export function toQueryToken(query) {
  const [first] = words(query);
  if (!first) return null;
  return first.slice(0, MAX_PREFIX);
}

/**
 * Filtrage local d'une liste déjà chargée.
 *
 * Utilisé par la recherche instantanée des registres et par la palette
 * Ctrl+K : tant que les données sont en cache, filtrer en mémoire coûte zéro
 * lecture et répond en dessous de la milliseconde.
 *
 * @param {string} query        Saisie brute
 * @param {string[]} haystack   Valeurs du document à confronter
 * @returns {boolean} `true` si tous les mots de la requête sont trouvés
 */
export function matchesQuery(query, haystack = []) {
  const needles = words(query);
  if (needles.length === 0) return true;

  const target = haystack
    .filter(Boolean)
    .map((value) => normalize(value))
    .join(' ');

  return needles.every((needle) => {
    // Correspondance en début de mot : cohérent avec l'index serveur.
    if (target.startsWith(needle)) return true;
    return target.includes(` ${needle}`);
  });
}

/**
 * Met en évidence les correspondances d'une recherche dans un texte.
 * Retourne des segments prêts à être rendus, sans HTML injecté.
 *
 * @param {string} text
 * @param {string} query
 * @returns {{ value: string, match: boolean }[]}
 */
export function highlightSegments(text, query) {
  const source = String(text ?? '');
  const needles = words(query);
  if (!source || needles.length === 0) return [{ value: source, match: false }];

  const normalized = normalize(source);
  const ranges = [];

  for (const needle of needles) {
    let from = 0;
    while (from < normalized.length) {
      const index = normalized.indexOf(needle, from);
      if (index === -1) break;
      // Uniquement les débuts de mot, comme l'index.
      if (index === 0 || /[^a-z0-9]/.test(normalized[index - 1])) {
        ranges.push([index, index + needle.length]);
      }
      from = index + needle.length;
    }
  }

  if (ranges.length === 0) return [{ value: source, match: false }];

  ranges.sort((a, b) => a[0] - b[0]);

  const segments = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    if (start < cursor) continue;
    if (start > cursor) {
      segments.push({ value: source.slice(cursor, start), match: false });
    }
    segments.push({ value: source.slice(start, end), match: true });
    cursor = end;
  }

  if (cursor < source.length) {
    segments.push({ value: source.slice(cursor), match: false });
  }

  return segments;
}
