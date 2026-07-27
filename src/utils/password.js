/**
 * Génération et contrôle des mots de passe de service.
 *
 * Contexte : les adresses de service du LSSD ne correspondent à aucune boîte
 * réelle. Le courriel de réinitialisation de Firebase — la voie normale pour
 * qu'un agent choisisse son mot de passe — n'arrive donc jamais nulle part.
 * C'est le commandement qui définit le mot de passe initial et le transmet à
 * l'agent hors de l'application.
 *
 * Un mot de passe destiné à être lu à voix haute ou recopié doit être
 * transmissible sans ambiguïté : l'alphabet exclut les caractères qui se
 * confondent (`O`/`0`, `I`/`l`/`1`) et le résultat est découpé en groupes.
 */

/** Alphabet sans caractères confondables. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** Longueur minimale acceptée. Firebase en impose 6 ; on est plus strict. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Tire un mot de passe aléatoire, découpé en groupes de 4.
 *
 * `crypto.getRandomValues` plutôt que `Math.random` : ce mot de passe protège
 * un compte, pas une animation.
 *
 * @param {number} [groups=3] Nombre de groupes de 4 caractères.
 * @returns {string} Par exemple `k7Fq-9mXt-2Rvb`
 */
export function generatePassword(groups = 3) {
  const length = groups * 4;
  const bytes = crypto.getRandomValues(new Uint32Array(length));

  const characters = Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]);

  return Array.from({ length: groups }, (_, index) =>
    characters.slice(index * 4, index * 4 + 4).join(''),
  ).join('-');
}

/**
 * Vérifie qu'un mot de passe est acceptable.
 *
 * @param {string} value
 * @returns {{ ok: boolean, message: string | null }}
 */
export function validatePassword(value) {
  const password = value ?? '';

  if (password.length === 0) {
    return { ok: false, message: 'Mot de passe requis.' };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `${PASSWORD_MIN_LENGTH} caractères minimum (${password.length} saisi${password.length > 1 ? 's' : ''}).`,
    };
  }
  if (/^\s|\s$/.test(password)) {
    return {
      ok: false,
      message: 'Espace en début ou en fin : source d’erreur à la ressaisie.',
    };
  }
  return { ok: true, message: null };
}

/**
 * Qualifie la robustesse, pour un retour visuel.
 *
 * Estimation volontairement grossière — elle sert à décourager `motdepasse`,
 * pas à mesurer une entropie réelle.
 *
 * @param {string} value
 * @returns {{ score: 0|1|2|3, label: string }}
 */
export function passwordStrength(value) {
  const password = value ?? '';
  if (password.length < PASSWORD_MIN_LENGTH) return { score: 0, label: 'Insuffisant' };

  const families =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/[0-9]/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password));

  if (password.length >= 12 && families >= 3) return { score: 3, label: 'Solide' };
  if (password.length >= 10 && families >= 2) return { score: 2, label: 'Correct' };
  return { score: 1, label: 'Faible' };
}
