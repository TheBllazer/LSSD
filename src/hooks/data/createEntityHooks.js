import { useMemo } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useAuth from '@/hooks/auth/useAuth';
import { CACHE, PAGINATION } from '@/app/config/constants';

/**
 * Fabrique de hooks de données.
 *
 * À partir d'un service CRUD, produit l'ensemble des hooks TanStack Query d'un
 * module : liste paginée, fiche, historique et mutations. Les modules n'ont
 * ainsi plus qu'à décrire leur métier — la stratégie de cache, l'invalidation,
 * les notifications et l'injection de l'agent courant sont mutualisées.
 *
 * Conventions de clés de cache :
 *   ['citizen']                         → tout le module
 *   ['citizen', 'list', paramètres]     → une liste
 *   ['citizen', 'detail', id]           → une fiche
 *   ['citizen', 'history', id]          → un historique
 *
 * @param {ReturnType<import('@/services/base/crudFactory').createCrudService>} service
 * @param {object} [labels]
 * @param {string} [labels.singular]  « le citoyen »
 * @param {string} [labels.created]   Message de succès de création
 */
export function createEntityHooks(service, labels = {}) {
  const root = service.entityType;
  const singular = labels.singular ?? 'la fiche';

  const keys = {
    all: [root],
    lists: () => [root, 'list'],
    list: (params) => [root, 'list', params],
    details: () => [root, 'detail'],
    detail: (id) => [root, 'detail', id],
    history: (id) => [root, 'history', id],
  };

  /**
   * Liste paginée à défilement continu.
   *
   * @param {object} [params] Filtres, recherche, tri, taille de page
   * @param {object} [options] Options TanStack Query (`enabled`…)
   */
  function useList(params = {}, options = {}) {
    // Les paramètres arrivent souvent sous forme d'objet littéral recréé à
    // chaque rendu : on les stabilise par leur sérialisation, sinon la requête
    // se relancerait indéfiniment.
    const serialized = JSON.stringify(params);
    const stableParams = useMemo(() => JSON.parse(serialized), [serialized]);

    const queryResult = useInfiniteQuery({
      queryKey: keys.list(stableParams),
      queryFn: ({ pageParam }) =>
        service.listPage({
          ...stableParams,
          cursor: pageParam ?? null,
          pageSize: stableParams.pageSize ?? PAGINATION.DEFAULT_PAGE_SIZE,
        }),
      initialPageParam: null,
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.cursor : undefined),
      staleTime: CACHE.STALE_TIME,
      ...options,
    });

    // Les pages sont aplaties une seule fois : les tableaux consomment une
    // liste simple sans se soucier de la pagination sous-jacente.
    const items = useMemo(
      () => queryResult.data?.pages.flatMap((page) => page.items) ?? [],
      [queryResult.data],
    );

    return { ...queryResult, items };
  }

  /**
   * Liste complète, sans pagination — sélecteurs et listes déroulantes.
   * @param {object} [params]
   * @param {object} [options]
   */
  function useAll(params = {}, options = {}) {
    const serialized = JSON.stringify(params);
    const stableParams = useMemo(() => JSON.parse(serialized), [serialized]);

    return useQuery({
      queryKey: keys.list({ ...stableParams, all: true }),
      queryFn: () => service.listAll(stableParams),
      staleTime: CACHE.STALE_TIME,
      ...options,
    });
  }

  /**
   * Une fiche par identifiant.
   * @param {string|null|undefined} id
   * @param {object} [options]
   */
  function useItem(id, options = {}) {
    return useQuery({
      queryKey: keys.detail(id),
      queryFn: () => service.get(id),
      enabled: Boolean(id),
      staleTime: CACHE.STALE_TIME,
      ...options,
    });
  }

  /**
   * Historique d'une fiche.
   * @param {string|null|undefined} id
   * @param {object} [options]
   */
  function useHistory(id, options = {}) {
    return useQuery({
      queryKey: keys.history(id),
      queryFn: () => service.history(id),
      enabled: Boolean(id),
      staleTime: CACHE.STALE_TIME,
      ...options,
    });
  }

  /** Identité de l'agent courant, telle qu'attendue par le service. */
  function useActor() {
    const { user, signature } = useAuth();
    return useMemo(
      () => ({ uid: user?.uid ?? null, name: signature || 'Agent' }),
      [user?.uid, signature],
    );
  }

  /** Création. */
  function useCreate() {
    const queryClient = useQueryClient();
    const actor = useActor();

    return useMutation({
      mutationFn: (data) => service.create(data, { actor }),
      onSuccess: (created) => {
        queryClient.invalidateQueries({ queryKey: keys.lists() });
        queryClient.setQueryData(keys.detail(created.id), created);
        toast.success(labels.created ?? `${capitalize(singular)} a été créée.`);
      },
    });
  }

  /**
   * Modification.
   *
   * Mise à jour optimiste : la fiche affichée reflète la saisie immédiatement,
   * ce qui rend l'enregistrement automatique imperceptible. En cas d'échec,
   * l'état précédent est restauré.
   */
  function useUpdate() {
    const queryClient = useQueryClient();
    const actor = useActor();

    return useMutation({
      mutationFn: ({ id, patch, previous }) =>
        service.update(id, patch, { actor, previous }),

      onMutate: async ({ id, patch }) => {
        await queryClient.cancelQueries({ queryKey: keys.detail(id) });
        const snapshot = queryClient.getQueryData(keys.detail(id));
        if (snapshot) {
          queryClient.setQueryData(keys.detail(id), { ...snapshot, ...patch });
        }
        return { snapshot };
      },

      onError: (_error, { id }, context) => {
        if (context?.snapshot) {
          queryClient.setQueryData(keys.detail(id), context.snapshot);
        }
      },

      onSettled: (_data, _error, { id }) => {
        queryClient.invalidateQueries({ queryKey: keys.detail(id) });
        queryClient.invalidateQueries({ queryKey: keys.history(id) });
        queryClient.invalidateQueries({ queryKey: keys.lists() });
      },
    });
  }

  /** Archivage (suppression logique). */
  function useRemove() {
    const queryClient = useQueryClient();
    const actor = useActor();

    return useMutation({
      mutationFn: ({ id, reason, previous }) =>
        service.remove(id, { actor, reason, previous }),
      onSuccess: (_data, { id }) => {
        queryClient.invalidateQueries({ queryKey: keys.lists() });
        queryClient.removeQueries({ queryKey: keys.detail(id) });
        toast.success(`${capitalize(singular)} a été archivée.`);
      },
    });
  }

  /** Restauration d'une fiche archivée. */
  function useRestore() {
    const queryClient = useQueryClient();
    const actor = useActor();

    return useMutation({
      mutationFn: ({ id, previous }) => service.restore(id, { actor, previous }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: keys.all });
        toast.success(`${capitalize(singular)} a été restaurée.`);
      },
    });
  }

  return {
    keys,
    useList,
    useAll,
    useItem,
    useHistory,
    useCreate,
    useUpdate,
    useRemove,
    useRestore,
  };
}

/**
 * Met la première lettre en majuscule.
 * @param {string} value
 * @returns {string}
 */
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default createEntityHooks;
