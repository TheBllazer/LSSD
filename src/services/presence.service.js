import { docRef, col, setDoc, onSnapshot, serverTimestamp } from '@/firebase/db';
import { COLLECTIONS } from '@/firebase/paths';
import { PRESENCE_STATUS } from '@/types/agents';
import { TIMING } from '@/app/config/constants';

/**
 * Présence des agents.
 *
 * Sans backend, la présence repose sur un battement de cœur : chaque terminal
 * connecté rafraîchit son document `/presence/{uid}` toutes les 60 secondes.
 * Un agent est considéré en ligne si son dernier battement date de moins de
 * deux intervalles et demi — ce qui absorbe une latence ou un onglet en veille
 * sans le faire disparaître de la liste.
 */

/** Délai au-delà duquel un agent est considéré hors ligne (ms). */
export const STALE_AFTER = TIMING.PRESENCE_HEARTBEAT * 2.5;

/**
 * Écrit un battement de présence.
 *
 * @param {object} agent Fiche agent courante
 * @param {string} [status=PRESENCE_STATUS.ONLINE]
 * @returns {Promise<void>}
 */
export async function beat(agent, status = PRESENCE_STATUS.ONLINE) {
  if (!agent?.uid) return;

  await setDoc(docRef(COLLECTIONS.PRESENCE, agent.uid), {
    uid: agent.uid,
    firstName: agent.firstName ?? '',
    lastName: agent.lastName ?? '',
    badgeNumber: agent.badgeNumber ?? null,
    rank: agent.rank ?? null,
    division: agent.division ?? null,
    callsign: agent.callsign ?? null,
    photoUrl: agent.photoUrl ?? null,
    status,
    lastHeartbeat: serverTimestamp(),
  });
}

/**
 * Marque l'agent hors ligne (déconnexion explicite ou fermeture d'onglet).
 * @param {object} agent
 * @returns {Promise<void>}
 */
export function goOffline(agent) {
  return beat(agent, PRESENCE_STATUS.OFFLINE).catch(() => {
    // Une fermeture d'onglet peut annuler la requête : sans conséquence,
    // le battement expirera de lui-même.
  });
}

/**
 * Démarre le battement de présence.
 *
 * @param {object} agent
 * @returns {() => void} Fonction d'arrêt (à appeler au démontage)
 */
export function startHeartbeat(agent) {
  if (!agent?.uid) return () => {};

  let stopped = false;

  const tick = () => {
    if (stopped) return;
    beat(agent).catch((error) => {
      console.warn('[LSSD] Battement de présence impossible :', error);
    });
  };

  tick();
  const interval = setInterval(tick, TIMING.PRESENCE_HEARTBEAT);

  /** Repasse en ligne dès que l'agent revient sur l'onglet. */
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') tick();
  };

  const handleUnload = () => {
    goOffline(agent);
  };

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pagehide', handleUnload);

  return () => {
    stopped = true;
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pagehide', handleUnload);
  };
}

/**
 * Détermine si un document de présence est encore valide.
 * @param {{status?: string, lastHeartbeat?: Date}} presence
 * @returns {boolean}
 */
export function isOnline(presence) {
  if (!presence || presence.status === PRESENCE_STATUS.OFFLINE) return false;
  const last = presence.lastHeartbeat;
  if (!last) return false;
  const time = last instanceof Date ? last.getTime() : new Date(last).getTime();
  return Date.now() - time < STALE_AFTER;
}

/**
 * S'abonne à la liste des agents connectés.
 *
 * La collection `/presence` contient au plus un document par agent : on écoute
 * l'ensemble et on filtre côté client, ce qui évite une requête dont le seuil
 * temporel vieillirait au fil de l'abonnement.
 *
 * @param {(agents: object[]) => void} callback
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} Fonction de désabonnement
 */
export function watchOnlineAgents(callback, onError) {
  return onSnapshot(
    col(COLLECTIONS.PRESENCE),
    (snapshot) => {
      const agents = snapshot.docs
        .map((document) => document.data())
        .filter(isOnline)
        .sort((a, b) => `${a.lastName}`.localeCompare(`${b.lastName}`));
      callback(agents);
    },
    (error) => {
      console.warn('[LSSD] Abonnement à la présence interrompu :', error);
      onError?.(error);
    },
  );
}
