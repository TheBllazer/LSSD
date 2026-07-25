import { useCallback, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, Stack, Typography } from '@mui/material';
import { MdExpandMore } from 'react-icons/md';
import EmptyState from './EmptyState';
import TableSkeleton from './TableSkeleton';
import useLocalStorage from '@/hooks/ui/useLocalStorage';
import useContextMenu from '@/hooks/ui/useContextMenu';
import { STORAGE_KEYS } from '@/app/config/constants';

/**
 * Tableau de registre.
 *
 * Enveloppe `@mui/x-data-grid` pour lui donner le comportement attendu d'un
 * logiciel métier :
 *  - double-clic pour ouvrir une fiche ;
 *  - clic droit pour le menu contextuel ;
 *  - sélection multiple exposée comme un simple tableau d'identifiants ;
 *  - visibilité des colonnes mémorisée par registre ;
 *  - squelette calé sur les colonnes réelles, états vides distincts ;
 *  - chargement de la page suivante en pied de tableau.
 *
 * La virtualisation des lignes est assurée par le DataGrid : un registre de
 * plusieurs milliers de fiches ne rend que les lignes visibles.
 *
 * @param {object} props
 * @param {object[]} props.rows
 * @param {import('@mui/x-data-grid').GridColDef[]} props.columns
 * @param {boolean} [props.loading]
 * @param {string} props.storageKey             Clé de persistance des colonnes
 * @param {string[]} [props.selection]          Identifiants sélectionnés
 * @param {(ids: string[]) => void} [props.onSelectionChange]
 * @param {(row: object) => void} [props.onRowOpen]      Double-clic
 * @param {(row: object) => object[]} [props.contextMenuItems]
 * @param {object} [props.emptyState]           `{ title, message, icon, action }`
 * @param {boolean} [props.filtered]            Un filtre est actif
 * @param {() => void} [props.onResetFilters]
 * @param {boolean} [props.hasMore]
 * @param {boolean} [props.loadingMore]
 * @param {() => void} [props.onLoadMore]
 * @param {'compact'|'standard'|'comfortable'} [props.density]
 */
export default function DataTable({
  rows = [],
  columns,
  loading = false,
  storageKey,
  selection = [],
  onSelectionChange,
  onRowOpen,
  contextMenuItems,
  emptyState,
  filtered = false,
  onResetFilters,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  density = 'compact',
  ...rest
}) {
  const { openMenu } = useContextMenu();
  const [columnPrefs, setColumnPrefs] = useLocalStorage(STORAGE_KEYS.COLUMN_PREFS, {});

  const visibilityModel = columnPrefs[storageKey] ?? {};

  const handleVisibilityChange = useCallback(
    (model) => setColumnPrefs((current) => ({ ...current, [storageKey]: model })),
    [setColumnPrefs, storageKey],
  );

  /**
   * Le DataGrid v8 exprime la sélection sous forme `{ type, ids: Set }`.
   * On la traduit dans les deux sens pour que les modules manipulent un
   * simple tableau d'identifiants.
   */
  const selectionModel = useMemo(
    () => ({ type: 'include', ids: new Set(selection) }),
    [selection],
  );

  const handleSelectionChange = useCallback(
    (model) => {
      if (!onSelectionChange) return;
      if (model.type === 'exclude') {
        // Sélection « tout sauf » : on la matérialise à partir des lignes.
        const excluded = model.ids;
        onSelectionChange(rows.map((row) => row.id).filter((id) => !excluded.has(id)));
        return;
      }
      onSelectionChange([...model.ids]);
    },
    [onSelectionChange, rows],
  );

  const handleContextMenu = useCallback(
    (event) => {
      if (!contextMenuItems) return;
      const rowId = event.currentTarget?.getAttribute('data-id');
      const row = rows.find((item) => String(item.id) === String(rowId));
      if (!row) return;
      openMenu(event, contextMenuItems(row));
    },
    [contextMenuItems, rows, openMenu],
  );

  /** Squelette pendant le premier chargement, état vide ensuite. */
  const NoRowsOverlay = useCallback(
    () =>
      loading ? (
        <TableSkeleton columns={columns} />
      ) : (
        <EmptyState
          icon={emptyState?.icon}
          title={emptyState?.title ?? 'Aucun enregistrement'}
          message={
            filtered
              ? 'Aucun enregistrement ne correspond aux critères actuels.'
              : emptyState?.message
          }
          action={emptyState?.action}
          filtered={filtered}
          onReset={onResetFilters}
        />
      ),
    [loading, columns, emptyState, filtered, onResetFilters],
  );

  const LoadingOverlay = useCallback(
    () => (
      <Box sx={{ pt: 0.5, bgcolor: 'background.paper', height: '100%' }}>
        <TableSkeleton columns={columns} />
      </Box>
    ),
    [columns],
  );

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '3px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        density={density}
        rowHeight={34}
        columnHeaderHeight={32}
        checkboxSelection={Boolean(onSelectionChange)}
        disableRowSelectionOnClick
        rowSelectionModel={selectionModel}
        onRowSelectionModelChange={handleSelectionChange}
        columnVisibilityModel={visibilityModel}
        onColumnVisibilityModelChange={handleVisibilityChange}
        onRowDoubleClick={(params) => onRowOpen?.(params.row)}
        hideFooter
        disableColumnMenu={false}
        slots={{ noRowsOverlay: NoRowsOverlay, loadingOverlay: LoadingOverlay }}
        slotProps={{ row: { onContextMenu: handleContextMenu } }}
        sx={{
          border: 'none',
          flex: 1,
          minHeight: 0,
          '--DataGrid-overlayHeight': '260px',
          '& .MuiDataGrid-columnHeaders': { bgcolor: 'var(--navy-750)' },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          },
          '& .MuiDataGrid-cell': {
            fontSize: 12,
            borderColor: 'var(--line-soft)',
            outline: 'none !important',
          },
          '& .MuiDataGrid-row': {
            cursor: onRowOpen ? 'pointer' : 'default',
            '&:hover': { bgcolor: 'rgba(45,125,210,0.07)' },
            '&.Mui-selected': {
              bgcolor: 'rgba(45,125,210,0.16)',
              '&:hover': { bgcolor: 'rgba(45,125,210,0.20)' },
            },
          },
          '& .MuiDataGrid-columnSeparator': { color: 'var(--line)' },
          '& .MuiDataGrid-filler': { display: 'none' },
          '& .MuiDataGrid-scrollbar': { zIndex: 1 },
        }}
        {...rest}
      />

      {/* Pagination par curseur : on charge la suite à la demande plutôt que
          de numéroter des pages, ce qui colle au modèle Firestore. */}
      {(hasMore || rows.length > 0) && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: 1.25,
            height: 30,
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'var(--navy-850)',
          }}
        >
          <Typography className="mono" sx={{ fontSize: 11, color: 'text.secondary' }}>
            {rows.length} enregistrement{rows.length > 1 ? 's' : ''}
            {hasMore ? ' chargés' : ''}
          </Typography>

          {selection.length > 0 && (
            <Typography sx={{ fontSize: 11, color: 'primary.main' }}>
              · {selection.length} sélectionné{selection.length > 1 ? 's' : ''}
            </Typography>
          )}

          <Box sx={{ flex: 1 }} />

          {hasMore && (
            <Button
              size="small"
              variant="text"
              startIcon={<MdExpandMore />}
              onClick={onLoadMore}
              disabled={loadingMore}
              sx={{ minHeight: 22, fontSize: 11 }}
            >
              {loadingMore ? 'Chargement…' : 'Charger la suite'}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
