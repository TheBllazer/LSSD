import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEntityHooks } from './createEntityHooks';
import useAuth from '@/hooks/auth/useAuth';
import { vehiclesService, assignOwner, setImpound } from '@/services/vehicles.service';

/**
 * Hooks du registre des véhicules.
 */

const hooks = createEntityHooks(vehiclesService, {
  singular: 'la fiche véhicule',
  created: 'Véhicule enregistré.',
});

export const vehicleKeys = hooks.keys;
export const useVehicles = hooks.useList;
export const useAllVehicles = hooks.useAll;
export const useVehicle = hooks.useItem;
export const useVehicleHistory = hooks.useHistory;
export const useCreateVehicle = hooks.useCreate;
export const useUpdateVehicle = hooks.useUpdate;
export const useRemoveVehicle = hooks.useRemove;
export const useRestoreVehicle = hooks.useRestore;

/** Identité de l'agent courant. */
function useActor() {
  const { user, signature } = useAuth();
  return { uid: user?.uid ?? null, name: signature || 'Agent' };
}

/**
 * Change le propriétaire d'un véhicule.
 *
 * L'invalidation touche les deux registres : la fiche du citoyen concerné voit
 * son compteur et sa chronologie changer en même temps que le véhicule.
 */
export function useAssignVehicleOwner() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ vehicle, newOwner, previousOwner }) =>
      assignOwner({ vehicle, newOwner, previousOwner, actor }),
    onSuccess: (_data, { vehicle, newOwner, previousOwner }) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(vehicle.id) });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.history(vehicle.id) });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      // Les fiches citoyens des deux côtés du transfert.
      queryClient.invalidateQueries({ queryKey: ['citizen'] });
      toast.success(
        newOwner
          ? `Propriétaire enregistré : ${newOwner.lastName?.toUpperCase() ?? ''}`
          : `Propriétaire retiré${previousOwner ? '' : ''}.`,
      );
    },
  });
}

/** Met un véhicule en fourrière ou l'en sort. */
export function useSetImpound() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ vehicle, impounded, lot, reason }) =>
      setImpound({ vehicle, impounded, lot, reason, actor }),
    onSuccess: (_data, { vehicle, impounded }) => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(vehicle.id) });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.history(vehicle.id) });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
      toast.success(impounded ? 'Véhicule placé en fourrière.' : 'Véhicule sorti de fourrière.');
    },
  });
}
