/**
 * Référentiels du système d'information géographique.
 */

/** Nature géométrique d'une entité. */
export const FEATURE_KINDS = {
  POINT: 'POINT',
  CIRCLE: 'CIRCLE',
  RECTANGLE: 'RECTANGLE',
  POLYGON: 'POLYGON',
  POLYLINE: 'POLYLINE',
};

export const FEATURE_KIND_LABELS = {
  [FEATURE_KINDS.POINT]: 'Point',
  [FEATURE_KINDS.CIRCLE]: 'Cercle',
  [FEATURE_KINDS.RECTANGLE]: 'Rectangle',
  [FEATURE_KINDS.POLYGON]: 'Polygone',
  [FEATURE_KINDS.POLYLINE]: 'Tracé',
};

/** Catégorie opérationnelle. */
export const FEATURE_CATEGORIES = {
  PATROL_ZONE: 'PATROL_ZONE',
  CRIME_SCENE: 'CRIME_SCENE',
  GANG_TERRITORY: 'GANG_TERRITORY',
  CHECKPOINT: 'CHECKPOINT',
  SAFE_HOUSE: 'SAFE_HOUSE',
  EVIDENCE: 'EVIDENCE',
  INCIDENT: 'INCIDENT',
  POI: 'POI',
};

export const FEATURE_CATEGORY_LABELS = {
  [FEATURE_CATEGORIES.PATROL_ZONE]: 'Zone de patrouille',
  [FEATURE_CATEGORIES.CRIME_SCENE]: 'Scène de crime',
  [FEATURE_CATEGORIES.GANG_TERRITORY]: 'Territoire de gang',
  [FEATURE_CATEGORIES.CHECKPOINT]: 'Point de contrôle',
  [FEATURE_CATEGORIES.SAFE_HOUSE]: 'Planque',
  [FEATURE_CATEGORIES.EVIDENCE]: 'Indice',
  [FEATURE_CATEGORIES.INCIDENT]: 'Intervention',
  [FEATURE_CATEGORIES.POI]: "Point d'intérêt",
};

/**
 * Couleur par défaut de chaque catégorie.
 * Un agent doit reconnaître la nature d'une entité sans lire son libellé.
 */
export const FEATURE_CATEGORY_COLORS = {
  [FEATURE_CATEGORIES.PATROL_ZONE]: '#2D7DD2',
  [FEATURE_CATEGORIES.CRIME_SCENE]: '#C0392B',
  [FEATURE_CATEGORIES.GANG_TERRITORY]: '#7D3C98',
  [FEATURE_CATEGORIES.CHECKPOINT]: '#D68910',
  [FEATURE_CATEGORIES.SAFE_HOUSE]: '#1E8E5A',
  [FEATURE_CATEGORIES.EVIDENCE]: '#C9A227',
  [FEATURE_CATEGORIES.INCIDENT]: '#E36258',
  [FEATURE_CATEGORIES.POI]: '#8A9AB4',
};

/** Portée de diffusion d'une entité. */
export const FEATURE_VISIBILITY = {
  ALL: 'ALL',
  DIVISION: 'DIVISION',
  PRIVATE: 'PRIVATE',
};

export const FEATURE_VISIBILITY_LABELS = {
  [FEATURE_VISIBILITY.ALL]: 'Tout le service',
  [FEATURE_VISIBILITY.DIVISION]: 'Ma division',
  [FEATURE_VISIBILITY.PRIVATE]: 'Moi seul',
};

/**
 * Dimensions du fond de carte, en pixels de l'image rastérisée.
 *
 * Le SIG travaille en projection plane (`L.CRS.Simple`) : les coordonnées
 * sont donc des pixels de cette image, pas des latitudes. Changer de fond de
 * carte impose de mettre à jour ces valeurs — et elles seules.
 */
export const MAP_DIMENSIONS = { width: 3000, height: 3734 };

/** Bornes de l'image dans le repère Leaflet, en `[y, x]`. */
export const MAP_BOUNDS = [
  [0, 0],
  [MAP_DIMENSIONS.height, MAP_DIMENSIONS.width],
];

/** Niveaux de zoom autorisés. */
export const MAP_ZOOM = { min: -3, max: 2, initial: -2 };
