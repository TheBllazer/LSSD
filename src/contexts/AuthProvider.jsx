import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  watchAuthState,
  describeAuthError,
} from '@/firebase/auth';
import { fetchPermissions, fetchAgent, touchLastLogin } from '@/services/agents.service';
import { logLogin, logLogout } from '@/services/audit.service';
import { startHeartbeat, goOffline } from '@/services/presence.service';
import { hasAbility, hasAnyAbility, levelOf } from '@/utils/permissions';
import { agentSignature } from '@/utils/format';
import { AuthContext, AUTH_STATUS } from './authContext';

/**
 * @typedef {object} AuthContextValue
 * @property {string} status          Valeur de `AUTH_STATUS`
 * @property {object|null} user       Utilisateur Firebase Auth
 * @property {object|null} agent      Fiche `/agents/{uid}`
 * @property {object|null} permissions Document `/permissions/{uid}`
 * @property {string[]} abilities     Permissions effectives
 * @property {string|null} role
 * @property {number} level
 * @property {string} signature       « SGT J. Marston #1042 »
 * @property {string|null} error
 * @property {(permission: string) => boolean} can
 * @property {(permissions: string[]) => boolean} canAny
 * @property {(email: string, password: string, remember?: boolean) => Promise<void>} login
 * @property {() => Promise<void>} logout
 * @property {() => Promise<void>} refresh
 */

/**
 * Fournisseur de session.
 *
 * Séquence au démarrage :
 *   1. `onAuthStateChanged` donne l'utilisateur Firebase (ou `null`) ;
 *   2. lecture de `/permissions/{uid}` — obligatoire, les règles Firestore
 *      l'exigent avant toute autre lecture ;
 *   3. si le compte est désactivé, déconnexion immédiate ;
 *   4. lecture de `/agents/{uid}` pour le profil affiché ;
 *   5. démarrage du battement de présence.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AuthProvider({ children }) {
  const [status, setStatus] = useState(AUTH_STATUS.INITIALIZING);
  const [user, setUser] = useState(null);
  const [agent, setAgent] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [error, setError] = useState(null);

  /** Jeton de chargement : ignore le résultat d'un profil devenu obsolète. */
  const loadTokenRef = useRef(0);
  /** Fonction d'arrêt du battement de présence. */
  const stopHeartbeatRef = useRef(null);
  /** Évite de journaliser deux connexions pour une même session. */
  const loggedInUidRef = useRef(null);

  const stopHeartbeat = useCallback(() => {
    stopHeartbeatRef.current?.();
    stopHeartbeatRef.current = null;
  }, []);

  const resetSession = useCallback(() => {
    stopHeartbeat();
    loggedInUidRef.current = null;
    setUser(null);
    setAgent(null);
    setPermissions(null);
  }, [stopHeartbeat]);

  /**
   * Charge le profil complet d'un utilisateur authentifié.
   * @param {import('firebase/auth').User} firebaseUser
   * @param {boolean} isFreshLogin Journalise la connexion si vrai
   */
  const loadProfile = useCallback(
    async (firebaseUser, isFreshLogin) => {
      const token = ++loadTokenRef.current;
      setStatus(AUTH_STATUS.LOADING_PROFILE);
      setError(null);

      try {
        const permissionDoc = await fetchPermissions(firebaseUser.uid);
        if (token !== loadTokenRef.current) return;

        // Compte créé dans Firebase Auth mais jamais provisionné dans le RMS.
        if (!permissionDoc) {
          setUser(firebaseUser);
          setPermissions(null);
          setAgent(null);
          setStatus(AUTH_STATUS.UNPROVISIONED);
          return;
        }

        // Coupe-circuit : la désactivation prend effet sans attendre
        // l'expiration du jeton d'authentification.
        if (permissionDoc.disabled) {
          setStatus(AUTH_STATUS.DISABLED);
          setPermissions(permissionDoc);
          setUser(firebaseUser);
          await firebaseSignOut().catch(() => {});
          return;
        }

        const agentDoc = await fetchAgent(firebaseUser.uid);
        if (token !== loadTokenRef.current) return;

        const profile = agentDoc ?? {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: '',
          lastName: firebaseUser.email?.split('@')[0] ?? 'Agent',
        };

        setUser(firebaseUser);
        setPermissions(permissionDoc);
        setAgent(profile);
        setStatus(AUTH_STATUS.AUTHENTICATED);

        // Présence temps réel.
        stopHeartbeat();
        stopHeartbeatRef.current = startHeartbeat(profile);

        // Journal et compteur de connexion, une seule fois par session.
        if (isFreshLogin && loggedInUidRef.current !== firebaseUser.uid) {
          loggedInUidRef.current = firebaseUser.uid;
          const actor = { uid: firebaseUser.uid, name: agentSignature(profile) };
          logLogin(actor);
          touchLastLogin(firebaseUser.uid);
        }
      } catch (loadError) {
        if (token !== loadTokenRef.current) return;
        console.error('[LSSD] Chargement du profil impossible :', loadError);
        setError(
          loadError?.code === 'permission-denied'
            ? "Votre compte n'est pas autorisé à accéder au système."
            : 'Impossible de charger votre profil. Vérifiez votre connexion.',
        );
        setStatus(AUTH_STATUS.ERROR);
      }
    },
    [stopHeartbeat],
  );

  /** Abonnement à l'état d'authentification Firebase. */
  useEffect(() => {
    const unsubscribe = watchAuthState((firebaseUser) => {
      if (!firebaseUser) {
        loadTokenRef.current += 1;
        resetSession();
        setStatus(AUTH_STATUS.UNAUTHENTICATED);
        return;
      }
      // `isFreshLogin` vaut faux ici : une session restaurée au rechargement
      // ne doit pas produire une nouvelle entrée « connexion ».
      loadProfile(firebaseUser, false);
    });

    return () => {
      unsubscribe();
      stopHeartbeat();
    };
  }, [loadProfile, resetSession, stopHeartbeat]);

  /**
   * Authentifie un agent.
   * @param {string} email
   * @param {string} password
   * @param {boolean} [remember=true]
   */
  const login = useCallback(
    async (email, password, remember = true) => {
      setError(null);
      try {
        const firebaseUser = await firebaseSignIn(email, password, remember);
        await loadProfile(firebaseUser, true);
      } catch (signInError) {
        const message = describeAuthError(signInError);
        setError(message);
        setStatus(AUTH_STATUS.UNAUTHENTICATED);
        throw new Error(message);
      }
    },
    [loadProfile],
  );

  /** Déconnecte l'agent courant. */
  const logout = useCallback(async () => {
    if (agent && user) {
      await Promise.allSettled([
        logLogout({ uid: user.uid, name: agentSignature(agent) }),
        goOffline(agent),
      ]);
    }
    stopHeartbeat();
    await firebaseSignOut();
  }, [agent, user, stopHeartbeat]);

  /** Recharge profil et droits (après modification par un administrateur). */
  const refresh = useCallback(async () => {
    if (user) await loadProfile(user, false);
  }, [user, loadProfile]);

  const abilities = useMemo(() => permissions?.abilities ?? [], [permissions]);

  const value = useMemo(() => {
    const role = permissions?.role ?? null;

    return {
      status,
      user,
      agent,
      permissions,
      abilities,
      role,
      level: permissions?.level ?? levelOf(role),
      signature: agentSignature(agent, ''),
      error,
      isAuthenticated: status === AUTH_STATUS.AUTHENTICATED,
      can: (permission) => hasAbility(abilities, permission),
      canAny: (list) => hasAnyAbility(abilities, list),
      login,
      logout,
      refresh,
    };
  }, [status, user, agent, permissions, abilities, error, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
