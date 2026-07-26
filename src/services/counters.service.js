import { docRef, getDoc, runTransaction, requireDb } from '@/firebase/db';
import { COLLECTIONS } from '@/firebase/paths';
import { dayjs } from '@/utils/dates';

/**
 * Numérotation des dossiers.
 *
 * Les numéros officiels (`LSSD-2026-000148`) doivent être **uniques, continus
 * et non réutilisables** : c'est ce qui permet de citer un rapport dans une
 * procédure. Sans backend, la seule garantie possible est une transaction
 * Firestore — deux agents qui créent un rapport à la même seconde obtiennent
 * deux numéros distincts, la seconde transaction étant rejouée automatiquement.
 *
 * Les règles n'autorisent qu'un incrément de 1 ou une remise à zéro annuelle,
 * ce qui empêche de fabriquer un numéro arbitraire depuis le client.
 */

/**
 * Réserve le prochain numéro de séquence.
 *
 * @param {string} counterId  Document de `/counters` (ex. `reports`)
 * @param {string} prefix     Préfixe du numéro (ex. `LSSD`)
 * @returns {Promise<{ number: string, value: number, year: number }>}
 */
export async function nextNumber(counterId, prefix) {
  const year = dayjs().year();
  const ref = docRef(COLLECTIONS.COUNTERS, counterId);

  const result = await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(ref);

    // La séquence repart à 1 à chaque année civile, comme dans les greffes.
    const current = snapshot.exists() ? snapshot.data() : { year, value: 0 };
    const sameYear = current.year === year;
    const value = sameYear ? (current.value ?? 0) + 1 : 1;

    transaction.set(ref, { year, value });
    return { value, year };
  });

  return {
    ...result,
    number: `${prefix}-${result.year}-${String(result.value).padStart(6, '0')}`,
  };
}

/**
 * Lit la valeur courante d'un compteur, sans la consommer.
 * Sert uniquement à l'affichage (« prochain numéro : … »).
 *
 * @param {string} counterId
 * @returns {Promise<{ year: number, value: number }|null>}
 */
export async function peekCounter(counterId) {
  const snapshot = await getDoc(docRef(COLLECTIONS.COUNTERS, counterId));
  return snapshot.exists() ? snapshot.data() : null;
}
