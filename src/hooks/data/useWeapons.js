import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createEntityHooks } from './createEntityHooks';
import useAuth from '@/hooks/auth/useAuth';
import { weaponsService, assignHolder } from '@/services/weapons.service';

/**
 * Hooks du registre des armes.
 */

const hooks = createEntityHooks(weaponsService, {
  singular: "la fiche d'arme",
  created: 'Arme enregistrée.',
});

export const weaponKeys = hooks.keys;
export const useWeapons = hooks.useList;
export const useAllWeapons = hooks.useAll;
export const useWeapon = hooks.useItem;
export const useWeaponHistory = hooks.useHistory;
export const useCreateWeapon = hooks.useCreate;
export const useUpdateWeapon = hooks.useUpdate;
export const useRemoveWeapon = hooks.useRemove;
export const useRestoreWeapon = hooks.useRestore;

/** Identité de l'agent courant. */
function useActor() {
  const { user, signature } = useAuth();
  return { uid: user?.uid ?? null, name: signature || 'Agent' };
}

/** Change le détenteur d'une arme. */
export function useAssignWeaponHolder() {
  const queryClient = useQueryClient();
  const actor = useActor();

  return useMutation({
    mutationFn: ({ weapon, newOwner, previousOwner }) =>
      assignHolder({ weapon, newOwner, previousOwner, actor }),
    onSuccess: (_data, { weapon, newOwner }) => {
      queryClient.invalidateQueries({ queryKey: weaponKeys.detail(weapon.id) });
      queryClient.invalidateQueries({ queryKey: weaponKeys.history(weapon.id) });
      queryClient.invalidateQueries({ queryKey: weaponKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['citizen'] });
      toast.success(newOwner ? 'Détenteur enregistré.' : 'Détenteur retiré.');
    },
  });
}
