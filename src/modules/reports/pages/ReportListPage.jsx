import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import {
  MdDescription,
  MdPostAdd,
  MdOpenInNew,
  MdContentCopy,
  MdArchive,
  MdFileDownload,
  MdLaunch,
} from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import { DataTable, TableToolbar, BulkActionBar, BulkAction } from '@/components/data';
import Can from '@/components/auth/Can';
import { buildReportColumns } from '../columns';
import { useReports, useCreateReport, useRemoveReport } from '@/hooks/data/useReports';
import useDebounce from '@/hooks/ui/useDebounce';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import useConfirm from '@/hooks/ui/useConfirm';
import useAuth from '@/hooks/auth/useAuth';
import { matchesQuery } from '@/utils/tokens';
import { downloadCsv } from '@/utils/csv';
import { formatDateTime } from '@/utils/dates';
import { PERMISSIONS } from '@/utils/permissions';
import { ENTITY_TYPES, PAGINATION } from '@/app/config/constants';
import { emptyReport } from '../schemas/reportSchema';
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  REPORT_CLASSIFICATION_LABELS,
  REPORT_PRIORITY_LABELS,
  AGENT_ROLES,
  visibleClassifications,
} from '@/types/reports';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const EMPTY_FILTERS = { type: '', status: '', priority: '' };

/**
 * Registre des rapports d'incident.
 *
 * La création n'ouvre pas de formulaire : elle réserve immédiatement un numéro
 * officiel et bascule dans l'éditeur, comme un dossier qu'on ouvre avant de le
 * remplir. C'est le fonctionnement des RMS américains — le numéro existe dès
 * l'intervention, le contenu vient après.
 */
export default function ReportListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selection, setSelection] = useState([]);
  const [onlyMine, setOnlyMine] = useState(false);

  const debouncedSearch = useDebounce(search);
  const openRecord = useOpenRecord();
  const confirm = useConfirm();
  const { user, agent, signature, level } = useAuth();

  const createReport = useCreateReport();
  const removeReport = useRemoveReport();

  const queryFilters = useMemo(() => {
    // Contrainte de confidentialité portée par la requête elle-même : sans
    // elle, Firestore refuse la liste entière dès qu'un rapport dépasse
    // l'habilitation de l'agent (cf. `visibleClassifications`).
    const list = [
      { field: 'classification', op: 'in', value: visibleClassifications(level) },
    ];
    if (filters.type) list.push({ field: 'type', op: '==', value: filters.type });
    if (filters.status) list.push({ field: 'status', op: '==', value: filters.status });
    if (filters.priority) list.push({ field: 'priority', op: '==', value: filters.priority });
    if (onlyMine && user?.uid) {
      list.push({ field: 'createdBy', op: '==', value: user.uid });
    }
    return list;
  }, [filters, onlyMine, user?.uid, level]);

  const {
    items,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error,
  } = useReports({ filters: queryFilters, pageSize: PAGINATION.DEFAULT_PAGE_SIZE });

  const columns = useMemo(buildReportColumns, []);

  const rows = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((report) =>
      matchesQuery(debouncedSearch, [
        report.number,
        report.title,
        report.summary,
        report.location?.label,
        ...(report.involvedCitizens ?? []).map((party) => party.label),
      ]),
    );
  }, [items, debouncedSearch]);

  const hasActiveFilters =
    Boolean(debouncedSearch) || onlyMine || Object.values(filters).some(Boolean);

  const resetFilters = () => {
    setSearch('');
    setFilters(EMPTY_FILTERS);
    setOnlyMine(false);
  };

  const open = (report, background = false) =>
    openRecord(
      {
        type: ENTITY_TYPES.REPORT,
        id: report.id,
        title: report.number,
        subtitle: report.title,
      },
      { background },
    );

  /** Ouvre un nouveau dossier : numéro réservé, agent rédacteur pré-rempli. */
  const createDraft = async () => {
    const draft = {
      ...emptyReport(),
      title: 'Rapport sans titre',
      involvedAgents: [
        {
          id: user.uid,
          label: signature || 'Agent',
          badge: agent?.badgeNumber ?? null,
          photoUrl: agent?.photoUrl ?? null,
          role: AGENT_ROLES.PRIMARY,
        },
      ],
    };
    const created = await createReport.mutateAsync(draft);
    open(created);
  };

  const archive = async (report) => {
    const { confirmed, reason } = await confirm({
      title: 'Archiver le rapport',
      entityType: 'Rapport',
      entityLabel: `${report.number} — ${report.title}`,
      danger: true,
      requireReason: true,
    });
    if (confirmed) removeReport.mutate({ id: report.id, reason, previous: report });
  };

  const exportCsv = () => {
    const source =
      selection.length > 0 ? rows.filter((row) => selection.includes(row.id)) : rows;
    downloadCsv(
      `rapports-${new Date().toISOString().slice(0, 10)}.csv`,
      source.map((report) => ({
        Numéro: report.number,
        Titre: report.title,
        Type: REPORT_TYPE_LABELS[report.type] ?? report.type,
        'Date des faits': formatDateTime(report.occurredAt, ''),
        Lieu: report.location?.label ?? '',
        Classification:
          REPORT_CLASSIFICATION_LABELS[report.classification] ?? report.classification,
        Priorité: REPORT_PRIORITY_LABELS[report.priority] ?? report.priority,
        Statut: REPORT_STATUS_LABELS[report.status] ?? report.status,
        'Citoyens impliqués': (report.involvedCitizens ?? [])
          .map((party) => party.label)
          .join(' / '),
      })),
    );
  };

  const contextMenuItems = (report) => [
    {
      id: 'open',
      label: 'Ouvrir le rapport',
      icon: <MdLaunch size={14} />,
      onClick: () => open(report),
    },
    {
      id: 'open-bg',
      label: 'Ouvrir dans un onglet',
      icon: <MdOpenInNew size={14} />,
      onClick: () => open(report, true),
    },
    { id: 'sep-1', divider: true },
    {
      id: 'copy',
      label: 'Copier le numéro',
      icon: <MdContentCopy size={14} />,
      onClick: () => navigator.clipboard?.writeText(report.number),
    },
    { id: 'sep-2', divider: true },
    {
      id: 'archive',
      label: 'Archiver',
      icon: <MdArchive size={14} />,
      danger: true,
      onClick: () => archive(report),
    },
  ];

  return (
    <ModuleLayout
      title="Rapports d'incident"
      icon={<MdDescription />}
      count={rows.length}
      padded={false}
      scroll={false}
      actions={
        <Can do={PERMISSIONS.REPORTS_CREATE}>
          <Button
            variant="contained"
            startIcon={<MdPostAdd />}
            onClick={createDraft}
            disabled={createReport.isPending}
          >
            {createReport.isPending ? 'Ouverture…' : 'Nouveau rapport'}
          </Button>
        </Can>
      }
      toolbar={
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Numéro, titre, résumé, lieu, citoyen…"
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
                sx={{ width: 190 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(REPORT_TYPE_LABELS).map((option) => (
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
                sx={{ width: 175 }}
              >
                <MenuItem value="">Tous</MenuItem>
                {toOptions(REPORT_STATUS_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Priorité"
                value={filters.priority}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, priority: event.target.value }))
                }
                sx={{ width: 140 }}
              >
                <MenuItem value="">Toutes</MenuItem>
                {toOptions(REPORT_PRIORITY_LABELS).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant={onlyMine ? 'contained' : 'outlined'}
                onClick={() => setOnlyMine((value) => !value)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Mes rapports
              </Button>
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
          storageKey="reports"
          selection={selection}
          onSelectionChange={setSelection}
          onRowOpen={(report) => open(report)}
          contextMenuItems={contextMenuItems}
          filtered={hasActiveFilters}
          onResetFilters={resetFilters}
          hasMore={Boolean(hasNextPage)}
          loadingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          emptyState={{
            icon: <MdDescription />,
            title: error ? 'Registre inaccessible' : 'Aucun rapport',
            message: error
              ? error.message
              : "Aucun rapport n'a encore été rédigé dans ce service.",
          }}
        />

        <BulkActionBar count={selection.length} onClear={() => setSelection([])} label="rapport">
          <BulkAction icon={<MdFileDownload size={14} />} label="Exporter" onClick={exportCsv} />
        </BulkActionBar>
      </Box>
    </ModuleLayout>
  );
}
