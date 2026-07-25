import { Box, InputAdornment, Stack, TextField, Tooltip, IconButton } from '@mui/material';
import { MdSearch, MdClose, MdFilterAltOff, MdRefresh } from 'react-icons/md';

/**
 * Barre d'outils d'un registre : recherche instantanée, filtres et actions.
 *
 * La recherche est **contrôlée par le module** : elle filtre localement les
 * données déjà chargées (coût nul, réponse immédiate) et n'interroge le serveur
 * que lorsque le module le décide. Voir `useDebounce` et `matchesQuery`.
 *
 * @param {object} props
 * @param {string} props.search
 * @param {(value: string) => void} props.onSearchChange
 * @param {string} [props.placeholder]
 * @param {React.ReactNode} [props.filters]   Sélecteurs de filtre
 * @param {boolean} [props.hasActiveFilters]
 * @param {() => void} [props.onResetFilters]
 * @param {() => void} [props.onRefresh]
 * @param {React.ReactNode} [props.actions]   Actions alignées à droite
 * @param {number} [props.resultCount]
 */
export default function TableToolbar({
  search,
  onSearchChange,
  placeholder = 'Recherche instantanée…',
  filters,
  hasActiveFilters = false,
  onResetFilters,
  onRefresh,
  actions,
  resultCount,
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: 1.25,
        py: 0.875,
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-800)',
      }}
    >
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        sx={{ width: 320, flexShrink: 0 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <MdSearch size={15} color="var(--muted-dim)" />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange('')}
                  aria-label="Effacer la recherche"
                  sx={{ p: 0.25 }}
                >
                  <MdClose size={14} />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      {filters}

      {hasActiveFilters && onResetFilters && (
        <Tooltip title="Réinitialiser les filtres">
          <IconButton size="small" onClick={onResetFilters} aria-label="Réinitialiser les filtres">
            <MdFilterAltOff size={15} />
          </IconButton>
        </Tooltip>
      )}

      {typeof resultCount === 'number' && (
        <Box
          className="mono"
          sx={{
            px: 0.875,
            py: 0.25,
            fontSize: 11,
            color: 'primary.main',
            border: '1px solid',
            borderColor: 'primary.dark',
            borderRadius: '3px',
            bgcolor: 'rgba(45,125,210,0.10)',
            whiteSpace: 'nowrap',
          }}
        >
          {resultCount} résultat{resultCount > 1 ? 's' : ''}
        </Box>
      )}

      <Box sx={{ flex: 1 }} />

      {onRefresh && (
        <Tooltip title="Actualiser">
          <IconButton size="small" onClick={onRefresh} aria-label="Actualiser">
            <MdRefresh size={16} />
          </IconButton>
        </Tooltip>
      )}

      {actions}
    </Stack>
  );
}
