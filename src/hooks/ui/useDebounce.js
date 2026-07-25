import { useEffect, useRef, useState } from 'react';
import { TIMING } from '@/app/config/constants';

/**
 * Valeur retardée.
 *
 * Utilisé par la recherche instantanée : l'affichage réagit à chaque frappe,
 * mais la requête (ou le filtrage lourd) n'est déclenchée qu'une fois la
 * saisie stabilisée.
 *
 * @template T
 * @param {T} value
 * @param {number} [delay=TIMING.SEARCH_DEBOUNCE]
 * @returns {T}
 */
export default function useDebounce(value, delay = TIMING.SEARCH_DEBOUNCE) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

/**
 * Fonction retardée, stable entre les rendus.
 *
 * @param {(...args: unknown[]) => void} callback
 * @param {number} [delay=TIMING.SEARCH_DEBOUNCE]
 * @returns {(...args: unknown[]) => void}
 */
export function useDebouncedCallback(callback, delay = TIMING.SEARCH_DEBOUNCE) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return useRef((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
  }).current;
}
