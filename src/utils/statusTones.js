/**
 * Tonalités visuelles des statuts métier.
 *
 * Séparé du composant `StatusChip` pour deux raisons :
 *  - le Fast Refresh de React n'accepte qu'un type d'export par module ;
 *  - la table est réutilisée par les tableaux, les filtres et le moteur PDF.
 */

/** Couleurs par tonalité (texte / fond). */
export const TONES = {
  neutral: { color: '#8A9AB4', bg: 'rgba(138,154,180,0.14)' },
  ok: { color: '#31C48D', bg: 'rgba(30,142,90,0.18)' },
  info: { color: '#5AA9F0', bg: 'rgba(45,125,210,0.18)' },
  warn: { color: '#E8A33D', bg: 'rgba(214,137,16,0.18)' },
  danger: { color: '#E36258', bg: 'rgba(192,57,43,0.20)' },
  purple: { color: '#B07CD6', bg: 'rgba(125,60,152,0.22)' },
  gold: { color: '#D9B742', bg: 'rgba(201,162,39,0.18)' },
};

/**
 * Correspondance statut métier → tonalité.
 * Complétée au fil des modules ; toute valeur inconnue retombe sur `neutral`.
 */
export const STATUS_TONE = {
  // Citoyens
  CLEAR: 'ok',
  WANTED: 'danger',
  INCARCERATED: 'purple',
  PROBATION: 'warn',
  DECEASED: 'neutral',
  MISSING: 'info',

  // Véhicules et armes
  VALID: 'ok',
  EXPIRED: 'warn',
  SUSPENDED: 'warn',
  REVOKED: 'danger',
  STOLEN: 'danger',
  IMPOUNDED: 'purple',
  DESTROYED: 'neutral',
  REGISTERED: 'ok',
  SEIZED: 'warn',
  LOST: 'neutral',
  NONE: 'neutral',

  // Rapports
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warn',
  APPROVED: 'ok',
  REJECTED: 'danger',
  CLOSED: 'neutral',

  // Agents
  ACTIVE: 'ok',
  LEAVE: 'warn',
  INACTIVE: 'neutral',

  // Priorités et classifications
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warn',
  CRITICAL: 'danger',
  PUBLIC: 'neutral',
  RESTRICTED: 'info',
  CONFIDENTIAL: 'warn',
  SEALED: 'danger',
};

/**
 * Résout la tonalité d'un statut.
 * @param {string} status
 * @param {keyof TONES} [forced] Tonalité imposée
 * @returns {{ color: string, bg: string }}
 */
export function resolveTone(status, forced) {
  return TONES[forced || STATUS_TONE[status] || 'neutral'];
}
