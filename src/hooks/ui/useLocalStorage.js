import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * État React synchronisé avec `localStorage`.
 *
 * - Lecture paresseuse (une seule fois au montage) ;
 * - Écriture tolérante aux erreurs (mode navigation privée, quota dépassé) ;
 * - Synchronisation entre onglets via l'événement `storage`.
 *
 * @template T
 * @param {string} key           Clé issue de `STORAGE_KEYS`
 * @param {T} initialValue       Valeur par défaut
 * @returns {[T, (value: T | ((previous: T) => T)) => void]}
 */
export default function useLocalStorage(key, initialValue) {
  const initialRef = useRef(initialValue);

  const read = useCallback(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialRef.current : JSON.parse(raw);
    } catch {
      return initialRef.current;
    }
  }, [key]);

  const [value, setValue] = useState(read);

  const write = useCallback(
    (next) => {
      setValue((previous) => {
        const resolved = typeof next === 'function' ? next(previous) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Stockage indisponible : l'état reste en mémoire pour la session.
        }
        return resolved;
      });
    },
    [key],
  );

  useEffect(() => {
    /** @param {StorageEvent} event */
    const handleStorage = (event) => {
      if (event.key !== key) return;
      try {
        setValue(event.newValue === null ? initialRef.current : JSON.parse(event.newValue));
      } catch {
        /* valeur illisible : on conserve l'état courant */
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [value, write];
}
