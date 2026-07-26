import { Circle, Marker, Polygon, Polyline, Rectangle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { FEATURE_KINDS, FEATURE_CATEGORY_COLORS } from '@/types/map';
import { toLatLng } from '../coordinates';

/** Icône d'un point, colorée selon sa catégorie. */
function pointIcon(color, selected) {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};
      border:2px solid ${selected ? '#FFFFFF' : 'rgba(0,0,0,0.6)'};
      box-shadow:0 0 ${selected ? 10 : 4}px ${color};
    "></div>`,
  });
}

/**
 * Rendu d'une entité cartographique, quelle que soit sa géométrie.
 *
 * @param {object} props
 * @param {object} props.feature
 * @param {boolean} props.selected
 * @param {(feature: object) => void} props.onSelect
 */
export default function FeatureRenderer({ feature, selected, onSelect }) {
  const color = feature.style?.color || FEATURE_CATEGORY_COLORS[feature.category] || '#2D7DD2';

  const pathOptions = {
    color,
    weight: selected ? 4 : (feature.style?.weight ?? 2),
    fillColor: color,
    fillOpacity: feature.style?.fillOpacity ?? 0.22,
    // Le contour clignote légèrement à la sélection plutôt que de changer de
    // couleur : la catégorie reste identifiable pendant l'édition.
    dashArray: selected ? '6 4' : undefined,
  };

  const handlers = { click: () => onSelect(feature) };

  const label = (
    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
      <strong>{feature.name || 'Sans nom'}</strong>
    </Tooltip>
  );

  const geometry = feature.geometry ?? {};

  switch (feature.kind) {
    case FEATURE_KINDS.POINT:
      return geometry.center ? (
        <Marker
          position={toLatLng(geometry.center)}
          icon={pointIcon(color, selected)}
          eventHandlers={handlers}
        >
          {label}
        </Marker>
      ) : null;

    case FEATURE_KINDS.CIRCLE:
      return geometry.center ? (
        <Circle
          center={toLatLng(geometry.center)}
          radius={geometry.radius ?? 50}
          pathOptions={pathOptions}
          eventHandlers={handlers}
        >
          {label}
        </Circle>
      ) : null;

    case FEATURE_KINDS.RECTANGLE:
      return (geometry.points ?? []).length === 2 ? (
        <Rectangle
          bounds={geometry.points.map(toLatLng)}
          pathOptions={pathOptions}
          eventHandlers={handlers}
        >
          {label}
        </Rectangle>
      ) : null;

    case FEATURE_KINDS.POLYGON:
      return (geometry.points ?? []).length >= 3 ? (
        <Polygon
          positions={geometry.points.map(toLatLng)}
          pathOptions={pathOptions}
          eventHandlers={handlers}
        >
          {label}
        </Polygon>
      ) : null;

    case FEATURE_KINDS.POLYLINE:
      return (geometry.points ?? []).length >= 2 ? (
        <Polyline
          positions={geometry.points.map(toLatLng)}
          pathOptions={{ ...pathOptions, fillOpacity: 0 }}
          eventHandlers={handlers}
        >
          {label}
        </Polyline>
      ) : null;

    default:
      return null;
  }
}
