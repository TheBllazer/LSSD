import { useMemo } from 'react';
import useAuth from './useAuth';
import { hasAbility, hasAnyAbility, hasAllAbilities } from '@/utils/permissions';

/**
 * Teste une permission de l'agent connecté.
 *
 * @param {string} permission Code issu de `PERMISSIONS`
 * @returns {boolean}
 *
 * @example
 * const canEdit = usePermission(PERMISSIONS.CITIZENS_UPDATE);
 */
export default function usePermission(permission) {
  const { abilities } = useAuth();
  return useMemo(() => hasAbility(abilities, permission), [abilities, permission]);
}

/**
 * Teste plusieurs permissions d'un coup.
 *
 * @param {string[]} permissions
 * @param {{ mode?: 'any'|'all' }} [options]
 * @returns {boolean}
 */
export function usePermissions(permissions, { mode = 'any' } = {}) {
  const { abilities } = useAuth();
  return useMemo(
    () =>
      mode === 'all'
        ? hasAllAbilities(abilities, permissions)
        : hasAnyAbility(abilities, permissions),
    [abilities, permissions, mode],
  );
}

/**
 * Compare le niveau hiérarchique de l'agent à un seuil.
 * Utilisé pour les décisions qui ne se résument pas à une permission
 * (lecture d'un rapport scellé, modification de la note d'un tiers…).
 *
 * @param {number} minimum
 * @returns {boolean}
 */
export function useMinimumLevel(minimum) {
  const { level } = useAuth();
  return level >= minimum;
}
