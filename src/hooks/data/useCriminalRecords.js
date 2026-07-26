import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEntityHooks } from './createEntityHooks';
import useAuth from '@/hooks/auth/useAuth';
import { recordsService, createRecord, updateRecord } from '@/services/criminalRecords.service';

/**
 * Hooks du module Casiers judiciaires.
 *
 * Création et mise à jour passent par des fonctions dédiées : un casier
 * modifie la fiche du citoyen (compteur, statut, chronologie) et les compteurs
 * du tableau de bord.
 */

const hooks = createEntityHooks(recordsService, { singular: 'le casier' });

export const recordKeys = hooks.keys;
export const useRecords = hooks.useList;
export const useAllRecords = hooks.useAll;
export const useRecord = hooks.useItem;
export const useRemoveRecord = hooks.useRemove;

/** Identité de l'agent courant. */
function useActor() {
  const { user, signature } = useAuth();
  return { uid: user?.uid ?? null, name: signature || 'Agent' };
}

/** Ouverture d'un casier. */
export function useCreateRecord() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ data, citizen }) => createRecord({ data, citizen, actor }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: recordKeys.lists() });
      // La fiche du citoyen a changé : compteur, statut, chronologie.
      queryClient.invalidateQueries({ queryKey: ['citizen'] });
      queryClient.setQueryData(recordKeys.detail(created.id), created);
      toast.success(`Casier ${created.number} ouvert.`);
    },
  });
}

/** Mise à jour d'un casier. */
export function useUpdateRecord() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ id, patch, previous, citizen }) =>
      updateRecord({ id, patch, previous, citizen, actor }),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: recordKeys.detail(id) });
      const snapshot = queryClient.getQueryData(recordKeys.detail(id));
      if (snapshot) {
        queryClient.setQueryData(recordKeys.detail(id), { ...snapshot, ...patch });
      }
      return { snapshot };
    },
    onError: (_error, { id }, context) => {
      if (context?.snapshot) queryClient.setQueryData(recordKeys.detail(id), context.snapshot);
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: recordKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['citizen'] });
    },
  });
}
