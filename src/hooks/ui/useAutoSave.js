import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMING } from '@/app/config/constants';

/**
 * États successifs de l'enregistrement automatique.
 * Ils alimentent l'indicateur affiché en pied de fiche.
 */
export const SAVE_STATE = {
  IDLE: 'IDLE',
  DIRTY: 'DIRTY',
  SAVING: 'SAVING',
  SAVED: 'SAVED',
  ERROR: 'ERROR',
};

/**
 * Enregistrement automatique.
 *
 * Deux déclencheurs complémentaires :
 *  - après `delay` sans modification (l'agent a fini de taper) ;
 *  - toutes les `interval` millisecondes tant que la fiche est modifiée
 *    (filet de sécurité pour une saisie continue, typiquement un rapport).
 *
 * L'enregistrement en cours n'est jamais doublé : une modification survenue
 * pendant une écriture relance un cycle une fois celle-ci terminée.
 *
 * @param {(payload: unknown) => Promise<void>} save Fonction d'enregistrement
 * @param {object} [options]
 * @param {number} [options.delay=TIMING.AUTOSAVE_DELAY]
 * @param {number} [options.interval=TIMING.AUTOSAVE_INTERVAL]
 * @param {boolean} [options.enabled=true]
 * @returns {{
 *   state: string,
 *   savedAt: Date|null,
 *   error: Error|null,
 *   markDirty: (payload: unknown) => void,
 *   flush: () => Promise<void>,
 *   isDirty: boolean
 * }}
 */
export default function useAutoSave(save, options = {}) {
  const {
    delay = TIMING.AUTOSAVE_DELAY,
    interval = TIMING.AUTOSAVE_INTERVAL,
    enabled = true,
  } = options;

  const [state, setState] = useState(SAVE_STATE.IDLE);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  const saveRef = useRef(save);
  saveRef.current = save;

  const payloadRef = useRef(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const timeoutRef = useRef(null);

  /** Écrit immédiatement si nécessaire. */
  const flush = useCallback(async () => {
    if (!dirtyRef.current || savingRef.current) return;

    savingRef.current = true;
    dirtyRef.current = false;
    setState(SAVE_STATE.SAVING);

    try {
      await saveRef.current(payloadRef.current);
      setSavedAt(new Date());
      setError(null);
      // Une modification arrivée pendant l'écriture relance un cycle.
      setState(dirtyRef.current ? SAVE_STATE.DIRTY : SAVE_STATE.SAVED);
    } catch (saveError) {
      dirtyRef.current = true;
      setError(saveError);
      setState(SAVE_STATE.ERROR);
    } finally {
      savingRef.current = false;
    }
  }, []);

  /** Signale une modification à enregistrer. */
  const markDirty = useCallback(
    (payload) => {
      if (!enabled) return;
      payloadRef.current = payload;
      dirtyRef.current = true;
      setState(SAVE_STATE.DIRTY);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(flush, delay);
    },
    [enabled, delay, flush],
  );

  /** Filet de sécurité périodique. */
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => {
      if (dirtyRef.current) flush();
    }, interval);
    return () => clearInterval(timer);
  }, [enabled, interval, flush]);

  /** Dernière tentative d'écriture avant fermeture de l'onglet. */
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirtyRef.current) return;
      flush();
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [flush]);

  return {
    state,
    savedAt,
    error,
    markDirty,
    flush,
    isDirty: state === SAVE_STATE.DIRTY || state === SAVE_STATE.ERROR,
  };
}
