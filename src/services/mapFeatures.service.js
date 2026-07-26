import { createCrudService } from './base/crudFactory';
import { COLLECTIONS } from '@/firebase/paths';
import { ENTITY_TYPES } from '@/app/config/constants';
import { FEATURE_KIND_LABELS, FEATURE_CATEGORY_LABELS } from '@/types/map';

/**
 * Service des entités cartographiques.
 *
 * Les géométries sont stockées en coordonnées de l'image du fond de carte
 * (projection plane), pas en latitude/longitude : c'est ce qui permet de
 * changer de fond sans réécrire les données, en ne touchant qu'aux dimensions
 * déclarées dans `types/map.js`.
 */

/** Libellé d'une entité. */
function labelOf(feature) {
  return feature.name || FEATURE_KIND_LABELS[feature.kind] || 'Entité sans nom';
}

/** Champs indexés pour la recherche. */
function tokensOf(feature) {
  return [
    feature.name,
    feature.description,
    FEATURE_CATEGORY_LABELS[feature.category],
    feature.linkedLabel,
  ];
}

function subtitleOf(feature) {
  return [
    FEATURE_CATEGORY_LABELS[feature.category] ?? feature.category,
    FEATURE_KIND_LABELS[feature.kind] ?? feature.kind,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const mapFeaturesService = createCrudService({
  collection: COLLECTIONS.MAP_FEATURES,
  entityType: ENTITY_TYPES.MAP_FEATURE,
  labelOf,
  tokensOf,
  subtitleOf,
  photoOf: () => null,
  defaultOrder: { field: 'updatedAt', direction: 'desc' },
  searchOrderField: 'updatedAt',
});

export default mapFeaturesService;
