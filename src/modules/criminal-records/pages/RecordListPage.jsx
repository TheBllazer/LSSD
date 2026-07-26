import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import {
  MdGavel,
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
import RecordFormDialog from '../components/RecordFormDialog';
import { buildRecordColumns } from '../columns';
import { useRecords, useRemoveRecord } from '@/hooks/data/useCriminalRecords';
import useDebounce from '@/hooks/ui/useDebounce';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import useConfirm from '@/hooks/ui/useConfirm';
import { matchesQuery } from '@/utils/tokens';
import { downloadCsv } from '@/utils/csv';
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';
import { PERMISSIONS } from '@/utils/permissions';
import { ENTITY_TYPES, PAGINATION } from '@/app/config/constants';
import {
  RECORD_TYPE_LABELS,
  DISPOSITION_LABELS,
  RECORD_STATUS_LABELS,
} from '@/types/records';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const EMPTY_FILTERS = { type: '', disposition: '', status: '' };

/**
 * Registre des casiers judiciaires.
 */
export default function RecordListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selection, setSelection] = useState([]);
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search);
  const openRecordTab = useOpenRecord();
  const confirm = useConfirm();
  const removeRecord = useRemoveRecord();

  const queryFilters = useMemo(() => {
    const list = [];
    if (filters.type) list.push({ field: 'type', op: '==', value: filters.type });
    if (filters.disposition) {
      list.push({ field: 'disposition', op: '==', value: filters.disposition });
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
  } = useRecords({ filters: queryFilters, pageSize: PAGINATION.DEFAULT_PAGE_SIZE });

  const columns = useMemo(buildRecordColumns, []);

  const rows = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((record) =>
      matchesQuery(debouncedSearch, [
        record.number,
        record.citizenSnapshot?.label,
        record.court,
        record.judge,
        ...(record.charges ?? []).flatMap((charge) => [charge.code, charge.label]),
      ]),
    );
  }, [items, debouncedSearch]);

  const hasActiveFilters =
    Boolean(debouncedSearch) || Object.values(filters).some(Boolean);

  const resetFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  };

  const open = (record, background = false) =>
    openRecordTab(
      {
        type: ENTITY_TYPES.RECORD,
        id: record.id,
        title: record.number,
        subtitle: record.citizenSnapshot?.label,
      },
      { background },
    );

  const archive = async (record) => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver le casier',
      message: 'Le casier ne remontera plus dans le registre. Le citoyen conserve son statut.',
      entityType: 'Casier',
      entityLabel: `${record.number} — ${record.citizenSnapshot?.label ?? ''}`,
      danger: true,
      requireReason: true,
    });
    if (confirmed) removeRecord.mutate({ id: record.id, reason, previous: record });
  };

  const exportCsv = () => {
    const source =
      selection.length > 0 ? rows.filter((row) => selection.includes(row.id)) : rows;
    downloadCsv(
      `casiers-${new Date().toISOString().slice(0, 10)}.csv`,
      source.map((record) => ({
        Numéro: record.number,
        Titulaire: record.citizenSnapshot?.label ?? '',
        Date: formatDate(record.date, 'DD/MM/YYYY', ''),
        Nature: RECORD_TYPE_LABELS[record.type] ?? record.type,
        'Chefs d\'accusation': (record.charges ?? [])
          .map((charge) => `${charge.code} ${charge.label}`)
          .join(' / '),
        Disposition: DISPOSITION_LABELS[record.disposition] ?? record.disposition,
        'Prison (jours)': record.sentence?.prisonDays ?? '',
        'Probation (jours)': record.sentence?.probationDays ?? '',
        Amende: record.sentence?.fineAmount ? formatCurrency(record.sentence.fineAmount) : '',
        Juridiction: record.court ?? '',
        État: RECORD_STATUS_LABELS[record.status] ?? record.status,
      })),
    );
  };

  const contextMenuItems = (record) => [
    {
      id: 'open',
      label: 'Ouvrir le casier',
      icon: <MdLaunch size={14} />,
      onClick: () => open(record),
    },
    {
      id: 'open-bg',
      label: 'Ouvrir dans un onglet',
      icon: <MdOpenInNew size={14} />,
      onClick: () => open(record, true),
    },
    {
      id: 'citizen',
      label: 'Ouvrir le titulaire',
      icon: <MdPerson size={14} />,
      disabled: !record.citizenSnapshot,
      onClick: () =>
        openRecordTab({
          type: ENTITY_TYPES.CITIZEN,
          id: record.citizenSnapshot.id,
          title: record.citizenSnapshot.label,
        }),
    },
    { id: 'sep-1', divider: true },
    {
      id: 'copy',
      label: 'Copier le numéro',
      icon: <MdContentCopy size={14} />,
      onClick: () => navigator.clipboard?.writeText(record.number),
    },
    { id: 'sep-2', divider: true },
    {
      id: 'archive',
      label: 'Archiver',
      icon: <MdArchive size={14} />,
      danger: true,
      onClick: () => archive(record),
    },
  ];

  return (
    <ModuleLayout
      title="Casiers judiciaires"
      icon={<MdGavel />}
      count={rows.length}
      padded={false}
      scroll={false}
      actions={
        <Can do={PERMISSIONS.RECORDS_CREATE}>
          <Button
            variant="contained"
            startIcon={<MdAddCircleOutline />}
            onClick={() => setFormOpen(true)}
          >
            Ouvrir un casier
          </Button>
        </Can>
      }
      toolbar={
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Numéro, titulaire, chef d'accusation, juridiction…"
          resultCount={debouncedSearch ? rows.length : undefined}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onRefresh={refetch}
          filters={
            <>
              <TextField
                select
                label="Nature"
                value={filters.type}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, type: event.target.value }))
                }
                sx={{ width: 195 }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {toOptions(RECORD_TYPE_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Disposition"
                value={filters.disposition}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, disposition: event.target.value }))
                }
                sx={{ width: 190 }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {toOptions(DISPOSITION_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="État"
                value={filters.status}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value }))
                }
                sx={{ width: 160 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(RECORD_STATUS_LABELS).map((option) => (
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
          storageKey="records"
          selection={selection}
          onSelectionChange={setSelection}
          onRowOpen={(record) => open(record)}
          contextMenuItems={contextMenuItems}
          filtered={hasActiveFilters}
          onResetFilters={resetFilters}
          hasMore={Boolean(hasNextPage)}
          loadingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          emptyState={{
            icon: <MdGavel />,
            title: error ? 'Registre inaccessible' : 'Aucun casier',
            message: error
              ? error.message
              : "Aucun casier judiciaire n'a encore été ouvert.",
          }}
        />

        <BulkActionBar count={selection.length} onClear={() => setSelection([])} label="casier">
          <BulkAction icon={<MdFileDownload size={14} />} label="Exporter" onClick={exportCsv} />
        </BulkActionBar>
      </Box>

      <RecordFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(record) => open(record)}
      />
    </ModuleLayout>
  );
}
