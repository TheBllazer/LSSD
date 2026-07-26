import { useMemo } from 'react';
import { createEntityHooks } from './createEntityHooks';
import useAuth from '@/hooks/auth/useAuth';
import { FEATURE_VISIBILITY } from '@/types/map';
import { mapFeaturesService } from '@/services/mapFeatures.service';

/**
 * Hooks du système d'information géographique.
 *
 * La carte charge l'ensemble des entités en une fois plutôt que par pages :
 * un fond de carte partiellement peuplé n'aurait aucun sens, et le volume
 * reste modeste (quelques centaines de zones tout au plus).
 */

const hooks = createEntityHooks(mapFeaturesService, {
  singular: "l'entité cartographique",
  created: 'Entité enregistrée sur la carte.',
});

export const mapFeatureKeys = hooks.keys;
const useFeatureQuery = hooks.useAll;
export const useMapFeature = hooks.useItem;

/**
 * Entités visibles par l'agent courant.
 *
 * Deux requêtes plutôt qu'une : les règles Firestore autorisent la lecture
 * d'une entité si elle est partagée **ou** si l'agent en est l'auteur. Un
 * « ou » de ce genre n'est pas exprimable en une seule requête, et une liste
 * non contrainte serait refusée en bloc — les règles ne sont pas des filtres.
 *
 * @param {{ max?: number }} [options]
 */
export function useMapFeatures({ max = 500 } = {}) {
  const { user, level } = useAuth();

  // Les entités partagées, accessibles à tout agent en service.
  const scopes =
    level >= 30
      ? [FEATURE_VISIBILITY.ALL, FEATURE_VISIBILITY.DIVISION]
      : [FEATURE_VISIBILITY.ALL];

  const shared = useFeatureQuery({
    filters: [{ field: 'visibility', op: 'in', value: scopes }],
    max,
  });

  // Les entités personnelles de l'agent, quelle que soit leur portée.
  const own = useFeatureQuery(
    {
      filters: [{ field: 'createdBy', op: '==', value: user?.uid ?? '' }],
      max,
    },
    { enabled: Boolean(user?.uid) },
  );

  const data = useMemo(() => {
    const byId = new Map();
    for (const feature of [...(shared.data ?? []), ...(own.data ?? [])]) {
      byId.set(feature.id, feature);
    }
    return [...byId.values()];
  }, [shared.data, own.data]);

  return {
    data,
    isLoading: shared.isLoading || own.isLoading,
    error: shared.error ?? own.error ?? null,
  };
}
export const useCreateMapFeature = hooks.useCreate;
export const useUpdateMapFeature = hooks.useUpdate;
export const useRemoveMapFeature = hooks.useRemove;
