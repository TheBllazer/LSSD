import useAuth from '@/hooks/auth/useAuth';
import { hasAbility, hasAnyAbility, hasAllAbilities } from '@/utils/permissions';

/**
 * Rendu conditionnel selon les permissions de l'agent connecté.
 *
 * Ce composant relève de l'**ergonomie**, pas de la sécurité : il évite
 * d'afficher des actions qui échoueraient. L'autorité reste les règles
 * Firestore — un agent qui contournerait l'interface serait refusé côté serveur.
 *
 * @param {object} props
 * @param {string} [props.do]        Permission requise
 * @param {string[]} [props.any]     Au moins une de ces permissions
 * @param {string[]} [props.all]     Toutes ces permissions
 * @param {number} [props.level]     Niveau hiérarchique minimum
 * @param {React.ReactNode} [props.fallback] Rendu si l'accès est refusé
 * @param {React.ReactNode} props.children
 *
 * @example
 * <Can do={PERMISSIONS.CITIZENS_DELETE}>
 *   <DeleteButton />
 * </Can>
 */
export default function Can({
  do: permission,
  any,
  all,
  level: minimumLevel,
  fallback = null,
  children,
}) {
  const { abilities, level } = useAuth();

  const checks = [];
  if (permission) checks.push(hasAbility(abilities, permission));
  if (any) checks.push(hasAnyAbility(abilities, any));
  if (all) checks.push(hasAllAbilities(abilities, all));
  if (typeof minimumLevel === 'number') checks.push(level >= minimumLevel);

  // Aucun critère fourni : on n'affiche rien, c'est une erreur d'utilisation.
  const allowed = checks.length > 0 && checks.every(Boolean);

  return allowed ? children : fallback;
}
