import { RANK_ABBR } from '@/types/agents';

/**
 * Fonctions de formatage partagées par l'interface et les documents PDF.
 * Aucune dépendance React : réutilisables partout.
 */

/**
 * Nom affiché d'une personne.
 * @param {{firstName?: string, lastName?: string}|null|undefined} person
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function fullName(person, fallback = '—') {
  if (!person) return fallback;
  const parts = [person.firstName, person.lastName].filter(Boolean);
  return parts.length ? parts.join(' ') : fallback;
}

/**
 * Nom au format registre : « DE SANTA, Michael ».
 * C'est la convention d'affichage des listes officielles américaines.
 *
 * @param {{firstName?: string, lastName?: string}|null|undefined} person
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function registryName(person, fallback = '—') {
  if (!person?.lastName && !person?.firstName) return fallback;
  const last = (person.lastName || '').toUpperCase();
  const first = person.firstName || '';
  if (!last) return first;
  if (!first) return last;
  return `${last}, ${first}`;
}

/**
 * Identité complète d'un agent : « SGT J. Marston #1042 ».
 * @param {object|null|undefined} agent
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function agentSignature(agent, fallback = '—') {
  if (!agent) return fallback;
  const rank = RANK_ABBR[agent.rank] || '';
  const initial = agent.firstName ? `${agent.firstName.charAt(0)}.` : '';
  const last = agent.lastName || '';
  const badge = agent.badgeNumber ? `#${agent.badgeNumber}` : '';
  const value = [rank, initial, last, badge].filter(Boolean).join(' ');
  return value || fallback;
}

/**
 * Initiales, utilisées comme repli d'avatar quand aucune photo n'est fournie.
 * @param {{firstName?: string, lastName?: string}|null|undefined} person
 * @returns {string}
 */
export function initials(person) {
  if (!person) return '??';
  const first = person.firstName?.charAt(0) || '';
  const last = person.lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || '??';
}

/**
 * Numéro de badge sur 4 chiffres.
 * @param {string|number|null|undefined} badgeNumber
 * @returns {string}
 */
export function formatBadge(badgeNumber) {
  if (badgeNumber === null || badgeNumber === undefined || badgeNumber === '') return '—';
  return String(badgeNumber).padStart(4, '0');
}

/**
 * Plaque d'immatriculation normalisée (majuscules, sans espace).
 * @param {string|null|undefined} plate
 * @returns {string}
 */
export function normalizePlate(plate) {
  return (plate || '').toUpperCase().replace(/\s+/g, '');
}

/**
 * Montant en dollars, format américain.
 * @param {number|null|undefined} amount
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function formatCurrency(amount, fallback = '—') {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return fallback;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Nombre avec séparateur de milliers.
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Numéro de téléphone au format 555-0199.
 * @param {string|null|undefined} phone
 * @param {string} [fallback='—']
 * @returns {string}
 */
export function formatPhone(phone, fallback = '—') {
  if (!phone) return fallback;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Tronque un texte en préservant les mots.
 * @param {string|null|undefined} text
 * @param {number} [max=120]
 * @returns {string}
 */
export function truncate(text, max = 120) {
  if (!text) return '';
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut}…`;
}
