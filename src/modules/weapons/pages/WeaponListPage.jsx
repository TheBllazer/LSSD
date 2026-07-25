import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import {
  MdAddCircleOutline,
  MdOpenInNew,
  MdContentCopy,
  MdArchive,
  MdFileDownload,
  MdLaunch,
  MdPerson,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import ModuleLayout from '@/layouts/ModuleLayout';
import { DataTable, TableToolbar, BulkActionBar, BulkAction } from '@/components/data';
import Can from '@/components/auth/Can';
import WeaponFormDialog from '../components/WeaponFormDialog';
import { buildWeaponColumns } from '../columns';
import { useWeapons, useRemoveWeapon } from '@/hooks/data/useWeapons';
import useDebounce from '@/hooks/ui/useDebounce';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import useConfirm from '@/hooks/ui/useConfirm';
import { matchesQuery } from '@/utils/tokens';
import { downloadCsv } from '@/utils/csv';
import { formatDate } from '@/utils/dates';
import { PERMISSIONS } from '@/utils/permissions';
import { ENTITY_TYPES, PAGINATION } from '@/app/config/constants';
import {
  WEAPON_CATEGORY_LABELS,
  WEAPON_CLASSIFICATION_LABELS,
  WEAPON_STATUS_LABELS,
} from '@/types/weapons';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const EMPTY_FILTERS = { category: '', classification: '', status: '' };

/** Libellé complet d'une arme, utilisé dans les confirmations. */
function weaponLabel(weapon) {
  const model = [weapon.make, weapon.model].filter(Boolean).join(' ');
  return [weapon.serialNumber, model].filter(Boolean).join(' — ');
}

/**
 * Registre des armes.
 */
export default function WeaponListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selection, setSelection] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search);
  const openRecord = useOpenRecord();
  const confirm = useConfirm();
  const removeWeapon = useRemoveWeapon();

  const queryFilters = useMemo(() => {
    const list = [];
    if (filters.category) list.push({ field: 'category', op: '==', value: filters.category });
    if (filters.classification) {
      list.push({ field: 'classification', op: '==', value: filters.classification });
    }
    if (filters.status) list.push({ field: 'status', op: '==', value: filters.status });
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
  } = useWeapons({ filters: queryFilters, pageSize: PAGINATION.DEFAULT_PAGE_SIZE });

  const columns = useMemo(buildWeaponColumns, []);

  const rows = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((weapon) =>
      matchesQuery(debouncedSearch, [
        weapon.serialNumber,
        weapon.make,
        weapon.model,
        weapon.caliber,
        weapon.ownerSnapshot?.label,
      ]),
    );
  }, [items, debouncedSearch]);

  const hasActiveFilters =
    Boolean(debouncedSearch) || Object.values(filters).some(Boolean);

  const resetFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  const open = (weapon, background = false) =>
    openRecord(
      {
        type: ENTITY_TYPES.WEAPON,
        id: weapon.id,
        title: weapon.serialNumber,
        subtitle: [weapon.make, weapon.model].filter(Boolean).join(' '),
      },
      { background },
    );

  const archive = async (weapon) => {
    const { confirmed, reason } = await confirm({
      title: "Archiver la fiche d'arme",
      entityType: 'Arme',
      entityLabel: weaponLabel(weapon),
      danger: true,
      requireReason: true,
    });
    if (confirmed) removeWeapon.mutate({ id: weapon.id, reason, previous: weapon });
  };

  const archiveSelection = async () => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver les armes sélectionnées',
      entityType: 'Armes',
      entityLabel: `${selection.length} fiche(s)`,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    for (const id of selection) {
      await removeWeapon.mutateAsync({
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
      `armes-${new Date().toISOString().slice(0, 10)}.csv`,
      source.map((weapon) => ({
        'N° de série': weapon.serialNumber,
        Marque: weapon.make,
        Modèle: weapon.model,
        Calibre: weapon.caliber ?? '',
        Catégorie: WEAPON_CATEGORY_LABELS[weapon.category] ?? weapon.category,
        Classification:
          WEAPON_CLASSIFICATION_LABELS[weapon.classification] ?? weapon.classification,
        Détenteur: weapon.ownerSnapshot?.label ?? '',
        Enregistrement: formatDate(weapon.registeredAt, 'DD/MM/YYYY', ''),
        Statut: WEAPON_STATUS_LABELS[weapon.status] ?? weapon.status,
      })),
    );
  };

  const contextMenuItems = (weapon) => [
    {
      id: 'open',
      label: 'Ouvrir la fiche',
      icon: <MdLaunch size={14} />,
      onClick: () => open(weapon),
    },
    {
      id: 'open-bg',
      label: 'Ouvrir dans un onglet',
      icon: <MdOpenInNew size={14} />,
      onClick: () => open(weapon, true),
    },
    {
      id: 'owner',
      label: 'Ouvrir le détenteur',
      icon: <MdPerson size={14} />,
      disabled: !weapon.ownerSnapshot,
      onClick: () =>
        openRecord({
          type: ENTITY_TYPES.CITIZEN,
          id: weapon.ownerSnapshot.id,
          title: weapon.ownerSnapshot.label,
        }),
    },
    { id: 'sep-1', divider: true },
    {
      id: 'copy',
      label: 'Copier le numéro de série',
      icon: <MdContentCopy size={14} />,
      onClick: () => navigator.clipboard?.writeText(weapon.serialNumber),
    },
    { id: 'sep-2', divider: true },
    {
      id: 'archive',
      label: 'Archiver la fiche',
      icon: <MdArchive size={14} />,
      danger: true,
      onClick: () => archive(weapon),
    },
  ];

  return (
    <ModuleLayout
      title="Registre des armes"
      icon={<GiPistolGun />}
      count={rows.length}
      padded={false}
      scroll={false}
      actions={
        <Can do={PERMISSIONS.WEAPONS_CREATE}>
          <Button
            variant="contained"
            startIcon={<MdAddCircleOutline />}
            onClick={() => setFormOpen(true)}
          >
            Enregistrer une arme
          </Button>
        </Can>
      }
      toolbar={
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="N° de série, marque, modèle, détenteur…"
          resultCount={debouncedSearch ? rows.length : undefined}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onRefresh={refetch}
          filters={
            <>
              <TextField
                select
                label="Catégorie"
                value={filters.category}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, category: event.target.value }))
                }
                sx={{ width: 185 }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {toOptions(WEAPON_CATEGORY_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Classification"
                value={filters.classification}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    classification: event.target.value,
                  }))
                }
                sx={{ width: 210 }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {toOptions(WEAPON_CLASSIFICATION_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Statut"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value }))
                }
                sx={{ width: 165 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(WEAPON_STATUS_LABELS).map((option) => (
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
          storageKey="weapons"
          selection={selection}
          onSelectionChange={setSelection}
          onRowOpen={(weapon) => open(weapon)}
          contextMenuItems={contextMenuItems}
          filtered={hasActiveFilters}
          onResetFilters={resetFilters}
          hasMore={Boolean(hasNextPage)}
          loadingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          emptyState={{
            icon: <GiPistolGun />,
            title: error ? 'Registre inaccessible' : 'Registre vide',
            message: error
              ? error.message
              : "Aucune arme n'a encore été enregistrée dans ce registre.",
          }}
        />

        <BulkActionBar count={selection.length} onClear={() => setSelection([])} label="arme">
          <BulkAction icon={<MdFileDownload size={14} />} label="Exporter" onClick={exportCsv} />
          <Can do={PERMISSIONS.WEAPONS_DELETE}>
            <BulkAction
              icon={<MdArchive size={14} />}
              label="Archiver"
              onClick={archiveSelection}
              danger
            />
          </Can>
        </BulkActionBar>
      </Box>

      <WeaponFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(weapon) => open(weapon)}
      />
    </ModuleLayout>
  );
}
