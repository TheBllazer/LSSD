import { useQuery } from '@tanstack/react-query';
import { docRef, getDoc } from '@/firebase/db';
import { COLLECTIONS, DOC_IDS } from '@/firebase/paths';

/**
 * Agrégats du tableau de bord.
 *
 * Une seule lecture pour tous les compteurs du service : ils sont incrémentés
 * de façon atomique par la couche de données à chaque création ou archivage,
 * plutôt que recalculés par des `count()` sur cinq collections.
 *
 * `staleTime` court : c'est l'écran d'accueil, il doit refléter l'activité du
 * service sans qu'on ait à le rafraîchir à la main.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: async () => {
      const snapshot = await getDoc(docRef(COLLECTIONS.STATS, DOC_IDS.DASHBOARD_STATS));
      return snapshot.exists() ? snapshot.data() : null;
    },
    staleTime: 20_000,
    refetchInterval: 60_000,
  });
}

export default useDashboardStats;
