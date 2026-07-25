import { useState, lazy, Suspense } from 'react';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import toast from 'react-hot-toast';
import { CACHE, STORAGE_KEYS } from '@/app/config/constants';
import { env } from '@/app/config/env';

/** Outils de développement chargés uniquement hors production. */
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
);

/**
 * Persistance du cache dans IndexedDB.
 * Objectif : réouvrir l'application sur des registres déjà peuplés (zéro écran
 * vide, zéro lecture Firestore facturée au démarrage).
 */
const idbPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: STORAGE_KEYS.QUERY_CACHE,
  throttleTime: 1000,
});

/**
 * Traduit une erreur Firestore en message opérationnel.
 * @param {unknown} error
 * @returns {string}
 */
function describeQueryError(error) {
  const code = typeof error === 'object' && error !== null ? error.code : '';
  if (code === 'permission-denied') return "Accès refusé : permissions insuffisantes.";
  if (code === 'unavailable') return 'Service indisponible. Nouvelle tentative en cours…';
  if (code === 'failed-precondition') {
    // Firestore emploie le même code pour un index absent et un index en cours
    // de construction — deux situations très différentes pour l'exploitant.
    return /currently building/i.test(error?.message ?? '')
      ? 'Index Firestore en cours de construction. Réessayez dans quelques minutes.'
      : "Index Firestore manquant pour cette requête (npm run rules:deploy).";
  }
  return error?.message || 'Erreur inattendue lors de la communication serveur.';
}

/**
 * Fabrique le QueryClient de l'application.
 *
 * Choix :
 *  - `staleTime` 60 s : les registres ne changent pas à la seconde ; on évite
 *    les refetch systématiques (et la facture de lectures associée).
 *  - Pas de refetch au focus : une application métier ne doit pas « clignoter »
 *    quand l'agent revient sur l'onglet.
 *  - Les erreurs de mutation remontent en toast ; celles de requête sont
 *    silencieuses (les composants affichent leur propre état d'erreur).
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE.STALE_TIME,
        gcTime: CACHE.GC_TIME,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          if (error?.code === 'permission-denied') return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: 0,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Seules les requêtes déjà affichées signalent leur échec :
        // un premier chargement gère son erreur dans le composant.
        if (query.state.data !== undefined) {
          toast.error(describeQueryError(error));
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => toast.error(describeQueryError(error)),
    }),
  });
}

/**
 * Fournit le client TanStack Query, avec restauration du cache persisté.
 * @param {{ children: React.ReactNode }} props
 */
export default function QueryProvider({ children }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: idbPersister,
        maxAge: CACHE.GC_TIME,
        // Le cache est invalidé à chaque version applicative : évite de
        // restaurer des formes de données obsolètes après un déploiement.
        buster: env.app.version,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && !query.queryKey.includes('live'),
        },
      }}
    >
      {children}
      {env.isDev && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        </Suspense>
      )}
    </PersistQueryClientProvider>
  );
}
