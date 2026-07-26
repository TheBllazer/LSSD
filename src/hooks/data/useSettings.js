import { useQuery } from '@tanstack/react-query';
import { docRef, getDoc } from '@/firebase/db';
import { COLLECTIONS, DOC_IDS } from '@/firebase/paths';
import { CACHE } from '@/app/config/constants';

/**
 * Référentiels de l'application (`/settings/app`).
 *
 * Codes pénaux, districts, en-têtes PDF : des données lues partout et modifiées
 * rarement. Le cache est donc long — une modification en administration reste
 * répercutée par l'invalidation explicite.
 *
 * @param {object} [options]
 */
export function useSettings(options = {}) {
  return useQuery({
    queryKey: ['settings', 'app'],
    queryFn: async () => {
      const snapshot = await getDoc(docRef(COLLECTIONS.SETTINGS, DOC_IDS.APP_SETTINGS));
      return snapshot.exists() ? snapshot.data() : null;
    },
    staleTime: CACHE.GC_TIME,
    ...options,
  });
}

export default useSettings;
