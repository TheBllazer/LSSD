import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import {
  MdPeopleAlt,
  MdPersonAdd,
  MdOpenInNew,
  MdContentCopy,
  MdArchive,
  MdFileDownload,
  MdLaunch,
} from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import { DataTable, TableToolbar, BulkActionBar, BulkAction } from '@/components/data';
import Can from '@/components/auth/Can';
import CitizenFormDialog from '../components/CitizenFormDialog';
import { buildCitizenColumns } from '../columns';
import { useCitizens, useRemoveCitizen } from '@/hooks/data/useCitizens';
import useDebounce from '@/hooks/ui/useDebounce';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import useConfirm from '@/hooks/ui/useConfirm';
import { matchesQuery } from '@/utils/tokens';
import { registryName } from '@/utils/format';
import { formatDate } from '@/utils/dates';
import { downloadCsv } from '@/utils/csv';
import { PERMISSIONS } from '@/utils/permissions';
import { ENTITY_TYPES, PAGINATION } from '@/app/config/constants';
import {
  CITIZEN_STATUS_LABELS,
  CITIZEN_FLAG_LABELS,
  SEX_LABELS,
  toOptions,
} from '@/types/citizens';

/** Filtres vides — sert aussi de référence pour détecter un filtre actif. */
const EMPTY_FILTERS = { status: '', sex: '', flag: '' };

/**
 * Registre des citoyens.
 *
 * La recherche filtre **localement** les fiches déjà chargées : la réponse est
 * immédiate et ne coûte aucune lecture Firestore. Les pages suivantes sont
 * chargées à la demande — c'est le compromis qui tient à la fois la promesse de
 * recherche instantanée et la maîtrise de la facture.
 */
export default function CitizenListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selection, setSelection] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search);
  const openRecord = useOpenRecord();
  const confirm = useConfirm();
  const removeCitizen = useRemoveCitizen();

  // Les filtres à faible cardinalité partent au serveur : ils réduisent le
  // volume transféré. Le texte, lui, reste local.
  const queryFilters = useMemo(() => {
    const list = [];
    if (filters.status) list.push({ field: 'status', op: '==', value: filters.status });
    if (filters.sex) list.push({ field: 'sex', op: '==', value: filters.sex });
    if (filters.flag) {
      list.push({ field: 'flags', op: 'array-contains', value: filters.flag });
    }
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
  } = useCitizens({ filters: queryFilters, pageSize: PAGINATION.DEFAULT_PAGE_SIZE });

  const columns = useMemo(buildCitizenColumns, []);

  const rows = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((citizen) =>
      matchesQuery(debouncedSearch, [
        citizen.firstName,
        citizen.lastName,
        ...(citizen.aliases ?? []),
        citizen.phone,
        citizen.email,
        citizen.address?.street,
        citizen.address?.district,
        citizen.occupation,
        citizen.employer,
      ]),
    );
  }, [items, debouncedSearch]);

  const hasActiveFilters =
    Boolean(debouncedSearch) || Object.values(filters).some(Boolean);

  const resetFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  /** Ouvre une fiche dans un onglet interne. */
  const open = (citizen, background = false) =>
    openRecord(
      {
        type: ENTITY_TYPES.CITIZEN,
        id: citizen.id,
        title: registryName(citizen),
        subtitle: formatDate(citizen.birthDate),
      },
      { background },
    );

  /** Archive une fiche après confirmation motivée. */
  const archive = async (citizen) => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver la fiche citoyen',
      message: 'Cette fiche ne remontera plus dans les registres ni la recherche.',
      entityType: 'Citoyen',
      entityLabel: registryName(citizen),
      danger: true,
      requireReason: true,
    });
    if (confirmed) {
      removeCitizen.mutate({ id: citizen.id, reason, previous: citizen });
    }
  };

  /** Archivage groupé — une seule confirmation pour toute la sélection. */
  const archiveSelection = async () => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver les fiches sélectionnées',
      message: `${selection.length} fiches seront archivées.`,
      entityType: 'Citoyens',
      entityLabel: `${selection.length} fiche(s)`,
      danger: true,
      requireReason: true,
    });
    if (!confirmed) return;

    for (const id of selection) {
      const citizen = items.find((item) => item.id === id);
      await removeCitizen.mutateAsync({ id, reason, previous: citizen });
    }
    setSelection([]);
  };

  /** Export CSV des lignes affichées (ou de la seule sélection). */
  const exportCsv = () => {
    const source = selection.length > 0 ? rows.filter((row) => selection.includes(row.id)) : rows;
    downloadCsv(
      `citoyens-${new Date().toISOString().slice(0, 10)}.csv`,
      source.map((citizen) => ({
        Nom: citizen.lastName,
        Prénom: citizen.firstName,
        Alias: (citizen.aliases ?? []).join(' / '),
        Naissance: formatDate(citizen.birthDate, 'DD/MM/YYYY', ''),
        Sexe: citizen.sex,
        Téléphone: citizen.phone ?? '',
        Email: citizen.email ?? '',
        Adresse: citizen.address?.street ?? '',
        District: citizen.address?.district ?? '',
        Profession: citizen.occupation ?? '',
        Employeur: citizen.employer ?? '',
        Statut: CITIZEN_STATUS_LABELS[citizen.status] ?? citizen.status,
        Signalements: (citizen.flags ?? []).join(' / '),
      })),
    );
  };

  const contextMenuItems = (citizen) => [
    {
      id: 'open',
      label: 'Ouvrir la fiche',
      icon: <MdLaunch size={14} />,
      onClick: () => open(citizen),
    },
    {
      id: 'open-bg',
      label: 'Ouvrir dans un onglet',
      icon: <MdOpenInNew size={14} />,
      onClick: () => open(citizen, true),
    },
    { id: 'sep-1', divider: true },
    {
      id: 'copy',
      label: 'Copier le nom',
      icon: <MdContentCopy size={14} />,
      onClick: () => navigator.clipboard?.writeText(registryName(citizen)),
    },
    { id: 'sep-2', divider: true },
    {
      id: 'archive',
      label: 'Archiver la fiche',
      icon: <MdArchive size={14} />,
      danger: true,
      onClick: () => archive(citizen),
    },
  ];

  return (
    <ModuleLayout
      title="Registre des citoyens"
      icon={<MdPeopleAlt />}
      count={rows.length}
      padded={false}
      scroll={false}
      actions={
        <Can do={PERMISSIONS.CITIZENS_CREATE}>
          <Button
            variant="contained"
            startIcon={<MdPersonAdd />}
            onClick={() => setFormOpen(true)}
          >
            Nouveau citoyen
          </Button>
        </Can>
      }
      toolbar={
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Nom, alias, téléphone, adresse, employeur…"
          resultCount={debouncedSearch ? rows.length : undefined}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onRefresh={refetch}
          filters={
            <>
              <TextField
                select
                label="Statut"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value }))
                }
                sx={{ width: 170 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(CITIZEN_STATUS_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Sexe"
                value={filters.sex}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, sex: event.target.value }))
                }
                sx={{ width: 130 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(SEX_LABELS).map((option) => (
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
                sx={{ width: 190 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(CITIZEN_FLAG_LABELS).map((option) => (
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
          storageKey="citizens"
          selection={selection}
          onSelectionChange={setSelection}
          onRowOpen={(citizen) => open(citizen)}
          contextMenuItems={contextMenuItems}
          filtered={hasActiveFilters}
          onResetFilters={resetFilters}
          hasMore={Boolean(hasNextPage)}
          loadingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          emptyState={{
            icon: <MdPeopleAlt />,
            title: error ? 'Registre inaccessible' : 'Registre vide',
            message: error
              ? error.message
              : "Aucune fiche n'a encore été enregistrée dans ce registre.",
          }}
        />

        <BulkActionBar
          count={selection.length}
          onClear={() => setSelection([])}
          label="citoyen"
        >
          <BulkAction
            icon={<MdFileDownload size={14} />}
            label="Exporter"
            onClick={exportCsv}
          />
          <Can do={PERMISSIONS.CITIZENS_DELETE}>
            <BulkAction
              icon={<MdArchive size={14} />}
              label="Archiver"
              onClick={archiveSelection}
              danger
            />
          </Can>
        </BulkActionBar>
      </Box>

      <CitizenFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(citizen) => open(citizen)}
      />
    </ModuleLayout>
  );
}
