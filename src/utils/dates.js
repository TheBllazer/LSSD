import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(duration);
dayjs.extend(isSameOrAfter);
dayjs.locale('fr');

/**
 * Formats normalisés du RMS.
 * Les registres américains privilégient un format court non ambigu ; on garde
 * ici le format français (JJ/MM/AAAA) pour l'interface, le PDF utilisant le
 * format officiel MM/DD/YYYY (cf. moteur PDF, phase 7).
 */
export const DATE_FORMATS = {
  DATE: 'DD/MM/YYYY',
  DATE_SHORT: 'DD/MM/YY',
  TIME: 'HH:mm',
  TIME_SECONDS: 'HH:mm:ss',
  DATETIME: 'DD/MM/YYYY HH:mm',
  DATETIME_FULL: 'dddd D MMMM YYYY [à] HH:mm',
  MONTH_KEY: 'YYYY-MM',
  ISO_DATE: 'YYYY-MM-DD',
};

/**
 * Normalise une valeur de date issue de Firestore, d'un formulaire ou du cache.
 * @param {Date|string|number|{toDate:()=>Date}|null|undefined} value
 * @returns {dayjs.Dayjs|null}
 */
export function toDay(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return dayjs(value.toDate());
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

/**
 * Formate une date selon un format normalisé.
 * @param {*} value
 * @param {string} [format=DATE_FORMATS.DATE]
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function formatDate(value, format = DATE_FORMATS.DATE, fallback = '—') {
  const day = toDay(value);
  return day ? day.format(format) : fallback;
}

/**
 * Formate une date/heure.
 * @param {*} value
 * @param {string} [fallback='—']
 */
export function formatDateTime(value, fallback = '—') {
  return formatDate(value, DATE_FORMATS.DATETIME, fallback);
}

/**
 * Durée relative (« il y a 3 minutes »).
 * @param {*} value
 * @param {string} [fallback='—']
 */
export function formatRelative(value, fallback = '—') {
  const day = toDay(value);
  return day ? day.fromNow() : fallback;
}

/**
 * Âge en années révolues — affiché sur chaque fiche citoyen.
 * @param {*} birthDate
 * @returns {number|null}
 */
export function computeAge(birthDate) {
  const day = toDay(birthDate);
  if (!day) return null;
  return dayjs().diff(day, 'year');
}

/**
 * Clé de regroupement mensuel utilisée par les statistiques (`stats/dashboard`).
 * @param {*} value
 * @returns {string}
 */
export function monthKey(value = new Date()) {
  return (toDay(value) ?? dayjs()).format(DATE_FORMATS.MONTH_KEY);
}

/**
 * Durée lisible à partir d'un nombre de jours (peines de prison).
 * @param {number} days
 * @returns {string}
 */
export function formatDurationDays(days) {
  if (!days || days <= 0) return 'Aucune';
  if (days < 30) return `${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  const rest = days % 30;
  const parts = [`${months} mois`];
  if (rest) parts.push(`${rest} j`);
  return parts.join(' ');
}

export { dayjs };
export default dayjs;
