import { createContext } from 'react';

/**
 * États possibles de la session.
 *
 * Le cas `UNPROVISIONED` est propre à une application sans backend : un compte
 * peut exister dans Firebase Authentication sans document `/permissions/{uid}`.
 * Il est alors authentifié mais ne peut rien lire — on l'affiche explicitement
 * plutôt que de laisser l'agent face à des erreurs de permission.
 */
export const AUTH_STATUS = {
  /** Vérification de la session en cours (au démarrage). */
  INITIALIZING: 'INITIALIZING',
  /** Aucun agent connecté. */
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  /** Authentifié, chargement du profil et des droits. */
  LOADING_PROFILE: 'LOADING_PROFILE',
  /** Session complète et opérationnelle. */
  AUTHENTICATED: 'AUTHENTICATED',
  /** Compte sans document de permissions. */
  UNPROVISIONED: 'UNPROVISIONED',
  /** Compte désactivé par un administrateur. */
  DISABLED: 'DISABLED',
  /** Échec technique du chargement du profil. */
  ERROR: 'ERROR',
};

/** @type {React.Context<import('./AuthProvider').AuthContextValue|null>} */
export const AuthContext = createContext(null);
