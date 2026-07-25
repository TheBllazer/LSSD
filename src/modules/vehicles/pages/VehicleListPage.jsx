import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import {
  MdDirectionsCar,
  MdAddCircleOutline,
  MdOpenInNew,
  MdContentCopy,
  MdArchive,
  MdFileDownload,
  MdLaunch,
  MdPerson,
} from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import { DataTable, TableToolbar, BulkActionBar, BulkAction } from '@/components/data';
import Can from '@/components/auth/Can';
import VehicleFormDialog from '../components/VehicleFormDialog';
import { buildVehicleColumns } from '../columns';
import { useVehicles, useRemoveVehicle } from '@/hooks/data/useVehicles';
import useDebounce from '@/hooks/ui/useDebounce';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import useConfirm from '@/hooks/ui/useConfirm';
import { matchesQuery } from '@/utils/tokens';
import { downloadCsv } from '@/utils/csv';
import { PERMISSIONS } from '@/utils/permissions';
import { ENTITY_TYPES, PAGINATION } from '@/app/config/constants';
import {
  VEHICLE_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
  VEHICLE_FLAG_LABELS,
} from '@/types/vehicles';

/** Transforme un dictionnaire de libellés en options. */
const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const EMPTY_FILTERS = { type: '', registrationStatus: '', flag: '' };

/** Libellé complet d'un véhicule, utilisé dans les confirmations. */
function vehicleLabel(vehicle) {
  const model = [vehicle.make, vehicle.model].filter(Boolean).join(' ');
  return [vehicle.plate, model].filter(Boolean).join(' — ');
}

/**
 * Registre des véhicules.
 *
 * Même mécanique que le registre des citoyens : filtres à faible cardinalité
 * envoyés au serveur, recherche texte appliquée localement sur les fiches déjà
 * chargées.
 */
export default function VehicleListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selection, setSelection] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search);
  const openRecord = useOpenRecord();
  const confirm = useConfirm();
  const removeVehicle = useRemoveVehicle();

  const queryFilters = useMemo(() => {
    const list = [];
    if (filters.type) list.push({ field: 'type', op: '==', value: filters.type });
    if (filters.registrationStatus) {
      list.push({
        field: 'registrationStatus',
        op: '==',
        value: filters.registrationStatus,
      });
    }
    if (filters.flag) list.push({ field: 'flags', op: 'array-contains', value: filters.flag });
    return list;
  }, [filters]);

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useVehicles({ filters: queryFilters, pageSize: PAGINATION.DEFAULT_PAGE_SIZE });

  const columns = useMemo(buildVehicleColumns, []);

  const rows = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((vehicle) =>
      matchesQuery(debouncedSearch, [
        vehicle.plate,
        vehicle.vin,
        vehicle.make,
        vehicle.model,
        vehicle.color,
        vehicle.ownerSnapshot?.label,
      ]),
    );
  }, [items, debouncedSearch]);

  const hasActiveFilters =
    Boolean(debouncedSearch) || Object.values(filters).some(Boolean);

  const resetFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  const open = (vehicle, background = false) =>
    openRecord(
      {
        type: ENTITY_TYPES.VEHICLE,
        id: vehicle.id,
        title: vehicle.plate,
        subtitle: [vehicle.make, vehicle.model].filter(Boolean).join(' '),
      },
      { background },
    );

  const openOwner = (vehicle) => {
    if (!vehicle.ownerSnapshot) return;
    openRecord({
      type: ENTITY_TYPES.CITIZEN,
      id: vehicle.ownerSnapshot.id,
      title: vehicle.ownerSnapshot.label,
    });
  };

  const archive = async (vehicle) => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver la fiche véhicule',
      message: 'Ce véhicule ne remontera plus dans le registre ni la recherche.',
      entityType: 'Véhicule',
      entityLabel: vehicleLabel(vehicle),
      danger: true,
      requireReason: true,
    });
    if (confirmed) removeVehicle.mutate({ id: vehicle.id, reason, previous: vehicle });
  };

  const archiveSelection = async () => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver les véhicules sélectionnés',
      entityType: 'Véhicules',
      entityLabel: `${selection.length} fiche(s)`,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    for (const id of selection) {
      await removeVehicle.mutateAsync({
        id,
        reason,
        previous: items.find((item) => item.id === id),
      });
    }
    setSelection([]);
  };

  const exportCsv = () => {
    const source =
      selection.length > 0 ? rows.filter((row) => selection.includes(row.id)) : rows;
    downloadCsv(
      `vehicules-${new Date().toISOString().slice(0, 10)}.csv`,
      source.map((vehicle) => ({
        Plaque: vehicle.plate,
        VIN: vehicle.vin ?? '',
        Marque: vehicle.make,
        Modèle: vehicle.model,
        Année: vehicle.year ?? '',
        Couleur: vehicle.color ?? '',
        Type: VEHICLE_TYPE_LABELS[vehicle.type] ?? vehicle.type,
        Propriétaire: vehicle.ownerSnapshot?.label ?? '',
        Immatriculation:
          REGISTRATION_STATUS_LABELS[vehicle.registrationStatus] ??
          vehicle.registrationStatus,
        Assurance: vehicle.insurance?.status ?? '',
        Fourrière: vehicle.impound?.isImpounded ? 'Oui' : 'Non',
        Signalements: (vehicle.flags ?? []).join(' / '),
      })),
    );
  };

  const contextMenuItems = (vehicle) => [
    {
      id: 'open',
      label: 'Ouvrir la fiche',
      icon: <MdLaunch size={14} />,
      onClick: () => open(vehicle),
    },
    {
      id: 'open-bg',
      label: 'Ouvrir dans un onglet',
      icon: <MdOpenInNew size={14} />,
      onClick: () => open(vehicle, true),
    },
    {
      id: 'owner',
      label: 'Ouvrir le propriétaire',
      icon: <MdPerson size={14} />,
      disabled: !vehicle.ownerSnapshot,
      onClick: () => openOwner(vehicle),
    },
    { id: 'sep-1', divider: true },
    {
      id: 'copy',
      label: 'Copier la plaque',
      icon: <MdContentCopy size={14} />,
      onClick: () => navigator.clipboard?.writeText(vehicle.plate),
    },
    { id: 'sep-2', divider: true },
    {
      id: 'archive',
      label: 'Archiver la fiche',
      icon: <MdArchive size={14} />,
      danger: true,
      onClick: () => archive(vehicle),
    },
  ];

  return (
    <ModuleLayout
      title="Registre des véhicules"
      icon={<MdDirectionsCar />}
      count={rows.length}
      padded={false}
      scroll={false}
      actions={
        <Can do={PERMISSIONS.VEHICLES_CREATE}>
          <Button
            variant="contained"
            startIcon={<MdAddCircleOutline />}
            onClick={() => setFormOpen(true)}
          >
            Nouveau véhicule
          </Button>
        </Can>
      }
      toolbar={
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Plaque, VIN, marque, modèle, propriétaire…"
          resultCount={debouncedSearch ? rows.length : undefined}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onRefresh={refetch}
          filters={
            <>
              <TextField
                select
                label="Type"
                value={filters.type}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, type: event.target.value }))
                }
                sx={{ width: 165 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(VEHICLE_TYPE_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Immatriculation"
                value={filters.registrationStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    registrationStatus: event.target.value,
                  }))
                }
                sx={{ width: 200 }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {toOptions(REGISTRATION_STATUS_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Signalement"
                value={filters.flag}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, flag: event.target.value }))
                }
                sx={{ width: 180 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(VEHICLE_FLAG_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </>
          }
          actions={
            <Button
              variant="outlined"
              startIcon={<MdFileDownload />}
              onClick={exportCsv}
              disabled={rows.length === 0}
            >
              Export CSV
            </Button>
          }
        />
      }
    >
      <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', p: 1.5 }}>
        <DataTable
          rows={rows}
          columns={columns}
          loading={isLoading}
          storageKey="vehicles"
          selection={selection}
          onSelectionChange={setSelection}
          onRowOpen={(vehicle) => open(vehicle)}
          contextMenuItems={contextMenuItems}
          filtered={hasActiveFilters}
          onResetFilters={resetFilters}
          hasMore={Boolean(hasNextPage)}
          loadingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          emptyState={{
            icon: <MdDirectionsCar />,
            title: error ? 'Registre inaccessible' : 'Registre vide',
            message: error
              ? error.message
              : "Aucun véhicule n'a encore été enregistré dans ce registre.",
          }}
        />

        <BulkActionBar
          count={selection.length}
          onClear={() => setSelection([])}
          label="véhicule"
        >
          <BulkAction icon={<MdFileDownload size={14} />} label="Exporter" onClick={exportCsv} />
          <Can do={PERMISSIONS.VEHICLES_DELETE}>
            <BulkAction
              icon={<MdArchive size={14} />}
              label="Archiver"
              onClick={archiveSelection}
              danger
            />
          </Can>
        </BulkActionBar>
      </Box>

      <VehicleFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(vehicle) => open(vehicle)}
      />
    </ModuleLayout>
  );
}
