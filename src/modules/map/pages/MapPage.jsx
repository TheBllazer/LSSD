import { useCallback, useMemo, useState } from 'react';
import {
  MapContainer,
  ImageOverlay,
  useMapEvents,
  Circle,
  Polyline,
  Marker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  MdMap,
  MdNearMe,
  MdPlace,
  MdRadioButtonUnchecked,
  MdCropSquare,
  MdTimeline,
  MdPentagon,
  MdDelete,
  MdLayers,
  MdSave,
} from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import Toolbar, { ToolbarButton, ToolbarSeparator, ToolbarSpacer } from '@/components/system/Toolbar';
import Panel from '@/components/system/Panel';
import EmptyState from '@/components/data/EmptyState';
import Can from '@/components/auth/Can';
import FeatureRenderer from '../components/FeatureRenderer';
import { toLatLng, toPoint } from '../coordinates';
import {
  useMapFeatures,
  useCreateMapFeature,
  useUpdateMapFeature,
  useRemoveMapFeature,
} from '@/hooks/data/useMapFeatures';
import useConfirm from '@/hooks/ui/useConfirm';
import useHotkeys from '@/hooks/ui/useHotkeys';
import usePermission from '@/hooks/auth/usePermission';
import { PERMISSIONS } from '@/utils/permissions';
import { env } from '@/app/config/env';
import {
  FEATURE_KINDS,
  FEATURE_KIND_LABELS,
  FEATURE_CATEGORIES,
  FEATURE_CATEGORY_LABELS,
  FEATURE_CATEGORY_COLORS,
  FEATURE_VISIBILITY,
  FEATURE_VISIBILITY_LABELS,
  MAP_BOUNDS,
  MAP_ZOOM,
} from '@/types/map';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** Nombre de points requis pour clore chaque géométrie. */
const REQUIRED_POINTS = {
  [FEATURE_KINDS.POINT]: 1,
  [FEATURE_KINDS.CIRCLE]: 2,
  [FEATURE_KINDS.RECTANGLE]: 2,
};

/**
 * Capture les clics sur le fond de carte pendant un tracé.
 *
 * Composant sans rendu : `useMapEvents` doit vivre à l'intérieur du
 * `MapContainer` pour accéder à l'instance Leaflet.
 */
function DrawController({ tool, onPoint, onFinish, onMove }) {
  useMapEvents({
    click: (event) => {
      if (tool === 'select') return;
      onPoint(toPoint(event.latlng));
    },
    dblclick: () => {
      if (tool === 'select') return;
      onFinish();
    },
    mousemove: (event) => onMove(toPoint(event.latlng)),
  });
  return null;
}

/**
 * Système d'information géographique.
 *
 * Projection plane (`L.CRS.Simple`) sur le fond de carte de Los Santos : les
 * coordonnées manipulées sont des pixels de l'image, ce qui permet de changer
 * de fond sans réécrire une seule entité.
 *
 * Le tracé est une machine à états volontairement simple : on choisit un
 * outil, on clique, et la géométrie se referme d'elle-même quand elle a assez
 * de points — ou au double-clic pour les tracés libres.
 */
export default function MapPage() {
  const confirm = useConfirm();
  const canCreate = usePermission(PERMISSIONS.MAP_CREATE);
  const canUpdate = usePermission(PERMISSIONS.MAP_UPDATE);
  const canDelete = usePermission(PERMISSIONS.MAP_DELETE);

  const { data: features = [], isLoading, error } = useMapFeatures({ max: 500 });
  const createFeature = useCreateMapFeature();
  const updateFeature = useUpdateMapFeature();
  const removeFeature = useRemoveMapFeature();

  const [tool, setTool] = useState('select');
  const [draft, setDraft] = useState([]);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [hidden, setHidden] = useState([]);

  /** Entités visibles après filtrage par couche. */
  const visible = useMemo(
    () => features.filter((feature) => !hidden.includes(feature.category)),
    [features, hidden],
  );

  /** Réinitialise le tracé en cours. */
  const cancelDraw = useCallback(() => {
    setDraft([]);
    setTool('select');
  }, []);

  /**
   * Enregistre la géométrie tracée.
   * Le nom et la catégorie sont ajustés ensuite dans le panneau de propriétés.
   */
  const commit = useCallback(
    async (kind, points) => {
      const geometry =
        kind === FEATURE_KINDS.CIRCLE
          ? {
              center: points[0],
              radius: Math.round(
                Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),
              ),
              points: [],
            }
          : kind === FEATURE_KINDS.POINT
            ? { center: points[0], radius: null, points: [] }
            : { center: null, radius: null, points };

      const created = await createFeature.mutateAsync({
        name: `${FEATURE_KIND_LABELS[kind]} sans nom`,
        kind,
        category: FEATURE_CATEGORIES.POI,
        geometry,
        style: {
          color: FEATURE_CATEGORY_COLORS[FEATURE_CATEGORIES.POI],
          fillOpacity: 0.22,
          weight: 2,
        },
        description: '',
        visibility: FEATURE_VISIBILITY.ALL,
        linkedType: null,
        linkedId: null,
      });

      setDraft([]);
      setTool('select');
      setSelected(created);
    },
    [createFeature],
  );

  /** Ajoute un point au tracé, et referme la géométrie si elle est complète. */
  const handlePoint = useCallback(
    (point) => {
      const next = [...draft, point];
      const required = REQUIRED_POINTS[tool];

      if (required && next.length >= required) {
        commit(tool, next);
        return;
      }
      setDraft(next);
    },
    [draft, tool, commit],
  );

  /** Clôt un polygone ou une polyligne au double-clic. */
  const handleFinish = useCallback(() => {
    const minimum = tool === FEATURE_KINDS.POLYGON ? 3 : 2;
    if (draft.length >= minimum) commit(tool, draft);
    else cancelDraw();
  }, [tool, draft, commit, cancelDraw]);

  const deleteSelected = useCallback(async () => {
    if (!selected) return;
    const { confirmed, reason } = await confirm({
      title: "Supprimer l'entité",
      entityType: FEATURE_KIND_LABELS[selected.kind],
      entityLabel: selected.name,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;
    await removeFeature.mutateAsync({ id: selected.id, reason, previous: selected });
    setSelected(null);
  }, [selected, confirm, removeFeature]);

  useHotkeys({
    escape: cancelDraw,
    enter: () => tool !== 'select' && handleFinish(),
    delete: () => canDelete && deleteSelected(),
  });

  /** Met à jour un champ de l'entité sélectionnée. */
  const patchSelected = (patch) => {
    if (!selected) return;
    const next = { ...selected, ...patch };
    setSelected(next);
    updateFeature.mutate({ id: selected.id, patch, previous: selected });
  };

  const tools = [
    { id: 'select', icon: <MdNearMe size={16} />, label: 'Sélection' },
    { id: FEATURE_KINDS.POINT, icon: <MdPlace size={16} />, label: 'Point' },
    { id: FEATURE_KINDS.CIRCLE, icon: <MdRadioButtonUnchecked size={16} />, label: 'Cercle' },
    { id: FEATURE_KINDS.RECTANGLE, icon: <MdCropSquare size={16} />, label: 'Rectangle' },
    { id: FEATURE_KINDS.POLYGON, icon: <MdPentagon size={16} />, label: 'Polygone' },
    { id: FEATURE_KINDS.POLYLINE, icon: <MdTimeline size={16} />, label: 'Tracé' },
  ];

  return (
    <ModuleLayout
      title="Système d'information géographique"
      icon={<MdMap />}
      count={visible.length}
      padded={false}
      scroll={false}
      toolbar={
        <Toolbar dense>
          {tools.map((item) => (
            <ToolbarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={tool === item.id}
              disabled={item.id !== 'select' && !canCreate}
              onClick={() => {
                setDraft([]);
                setTool(item.id);
                setSelected(null);
              }}
            />
          ))}

          <ToolbarSeparator />

          <ToolbarButton
            icon={<MdDelete size={16} />}
            label="Supprimer la sélection"
            shortcut="Suppr"
            disabled={!selected || !canDelete}
            onClick={deleteSelected}
          />

          <ToolbarSpacer />

          {tool !== 'select' && (
            <Typography sx={{ fontSize: 11, color: 'warning.main', mr: 1.5 }}>
              {REQUIRED_POINTS[tool]
                ? `Cliquez ${REQUIRED_POINTS[tool] - draft.length} fois de plus`
                : `${draft.length} point(s) — double-clic pour terminer, Échap pour annuler`}
            </Typography>
          )}

          <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.disabled' }}>
            X {cursor.x} · Y {cursor.y}
          </Typography>
        </Toolbar>
      }
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Canevas */}
        <Box sx={{ flex: 1, minWidth: 0, position: 'relative', bgcolor: 'var(--navy-950)' }}>
          {error ? (
            <EmptyState
              icon={<MdMap />}
              title="Carte indisponible"
              message={error.message}
            />
          ) : (
            <MapContainer
              crs={L.CRS.Simple}
              bounds={MAP_BOUNDS}
              minZoom={MAP_ZOOM.min}
              maxZoom={MAP_ZOOM.max}
              zoom={MAP_ZOOM.initial}
              // Le double-clic sert à clore un tracé : il ne doit pas zoomer.
              doubleClickZoom={false}
              attributionControl={false}
              style={{ width: '100%', height: '100%', background: '#060A12' }}
            >
              <ImageOverlay url={`${env.basePath}map/los-santos.png`} bounds={MAP_BOUNDS} />

              <DrawController
                tool={tool}
                onPoint={handlePoint}
                onFinish={handleFinish}
                onMove={setCursor}
              />

              {visible.map((feature) => (
                <FeatureRenderer
                  key={feature.id}
                  feature={feature}
                  selected={selected?.id === feature.id}
                  onSelect={setSelected}
                />
              ))}

              {/* Aperçu du tracé en cours */}
              {draft.length > 0 && tool === FEATURE_KINDS.CIRCLE && (
                <Circle
                  center={toLatLng(draft[0])}
                  radius={Math.hypot(cursor.x - draft[0].x, cursor.y - draft[0].y)}
                  pathOptions={{ color: '#FFFFFF', dashArray: '4 4', fillOpacity: 0.08 }}
                />
              )}
              {draft.length > 0 &&
                (tool === FEATURE_KINDS.POLYGON || tool === FEATURE_KINDS.POLYLINE) && (
                  <Polyline
                    positions={[...draft, cursor].map(toLatLng)}
                    pathOptions={{ color: '#FFFFFF', dashArray: '4 4' }}
                  />
                )}
              {draft.map((point, index) => (
                <Marker
                  key={index}
                  position={toLatLng(point)}
                  icon={L.divIcon({
                    className: '',
                    iconSize: [8, 8],
                    iconAnchor: [4, 4],
                    html: '<div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>',
                  })}
                />
              ))}
            </MapContainer>
          )}
        </Box>

        {/* Panneau latéral */}
        <Box
          className="scroll-compact"
          sx={{
            width: 320,
            flexShrink: 0,
            overflow: 'auto',
            p: 1.5,
            borderLeft: '1px solid',
            borderColor: 'divider',
            bgcolor: 'var(--navy-850)',
          }}
        >
          <Panel title="Couches" icon={<MdLayers />} dense sx={{ mb: 1.5 }}>
            {toOptions(FEATURE_CATEGORY_LABELS).map((option) => {
              const count = features.filter((f) => f.category === option.value).length;
              return (
                <FormControlLabel
                  key={option.value}
                  sx={{ display: 'flex', ml: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={!hidden.includes(option.value)}
                      onChange={(event) =>
                        setHidden((current) =>
                          event.target.checked
                            ? current.filter((value) => value !== option.value)
                            : [...current, option.value],
                        )
                      }
                      sx={{ color: FEATURE_CATEGORY_COLORS[option.value] }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: 11.5 }}>
                      {option.label}
                      {count > 0 ? ` (${count})` : ''}
                    </Typography>
                  }
                />
              );
            })}
          </Panel>

          {selected ? (
            <Panel title="Propriétés" icon={<MdSave />} dense>
              <Stack spacing={1.25}>
                <TextField
                  label="Nom"
                  value={selected.name ?? ''}
                  onChange={(event) => patchSelected({ name: event.target.value })}
                  disabled={!canUpdate}
                />

                <TextField
                  select
                  label="Catégorie"
                  value={selected.category}
                  onChange={(event) =>
                    patchSelected({
                      category: event.target.value,
                      style: {
                        ...selected.style,
                        color: FEATURE_CATEGORY_COLORS[event.target.value],
                      },
                    })
                  }
                  disabled={!canUpdate}
                >
                  {toOptions(FEATURE_CATEGORY_LABELS).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Visibilité"
                  value={selected.visibility}
                  onChange={(event) => patchSelected({ visibility: event.target.value })}
                  disabled={!canUpdate}
                >
                  {toOptions(FEATURE_VISIBILITY_LABELS).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Description"
                  value={selected.description ?? ''}
                  onChange={(event) => patchSelected({ description: event.target.value })}
                  disabled={!canUpdate}
                  multiline
                  minRows={3}
                />

                <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                  {FEATURE_KIND_LABELS[selected.kind]}
                  {selected.geometry?.radius ? ` · rayon ${selected.geometry.radius} px` : ''}
                  {selected.geometry?.points?.length
                    ? ` · ${selected.geometry.points.length} sommets`
                    : ''}
                </Typography>

                <Can do={PERMISSIONS.MAP_DELETE}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<MdDelete />}
                    onClick={deleteSelected}
                    size="small"
                  >
                    Supprimer
                  </Button>
                </Can>
              </Stack>
            </Panel>
          ) : (
            <Panel title="Entités" dense>
              {isLoading ? (
                <Typography variant="caption">Chargement…</Typography>
              ) : visible.length === 0 ? (
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                  Aucune entité tracée. Choisissez un outil et cliquez sur la carte.
                </Typography>
              ) : (
                <Stack spacing={0.25}>
                  {visible.map((feature) => (
                    <Stack
                      key={feature.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      onClick={() => setSelected(feature)}
                      sx={{
                        py: 0.5,
                        px: 0.5,
                        cursor: 'pointer',
                        borderRadius: '3px',
                        '&:hover': { bgcolor: 'rgba(45,125,210,0.10)' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          flexShrink: 0,
                          bgcolor:
                            feature.style?.color ??
                            FEATURE_CATEGORY_COLORS[feature.category],
                        }}
                      />
                      <Typography sx={{ fontSize: 11.5, flex: 1 }} noWrap>
                        {feature.name}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
                        {FEATURE_KIND_LABELS[feature.kind]}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Panel>
          )}
        </Box>
      </Box>
    </ModuleLayout>
  );
}
