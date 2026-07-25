import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '@/hooks/auth/useAuth';
import { hasAbility, hasAnyAbility } from '@/utils/permissions';
import { logAccessDenied } from '@/services/audit.service';
import ForbiddenPage from '@/modules/system/pages/ForbiddenPage';

/**
 * Garde d'accès de second niveau : permission requise pour un module.
 *
 * Toute tentative refusée est journalisée dans `/auditLogs` — la traçabilité
 * des accès refusés fait partie des exigences d'un système de dossiers de
 * police.
 *
 * @param {object} props
 * @param {string} [props.permission]    Permission requise
 * @param {string[]} [props.any]         Au moins une de ces permissions
 * @param {React.ReactNode} props.children
 */
export default function RoleRoute({ permission, any, children }) {
  const { abilities, user, signature } = useAuth();
  const location = useLocation();
  const loggedPathRef = useRef(null);

  const allowed = permission
    ? hasAbility(abilities, permission)
    : any
      ? hasAnyAbility(abilities, any)
      : true;

  useEffect(() => {
    if (allowed || !user) return;
    // Une seule entrée par chemin refusé : évite d'inonder le journal lors
    // des rendus successifs.
    if (loggedPathRef.current === location.pathname) return;
    loggedPathRef.current = location.pathname;

    logAccessDenied(
      { uid: user.uid, name: signature },
      location.pathname,
      permission || any?.join(', ') || 'inconnue',
    );
  }, [allowed, user, signature, location.pathname, permission, any]);

  return allowed ? children : <ForbiddenPage />;
}
