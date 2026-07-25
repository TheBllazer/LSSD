import { Box, Skeleton, Stack } from '@mui/material';

/**
 * Squelette de chargement d'un tableau.
 *
 * Les largeurs sont dérivées des colonnes réelles : au moment où les données
 * arrivent, aucune ligne ne se décale. C'est ce détail qui fait la différence
 * entre un chargement « propre » et un écran qui saute.
 *
 * @param {object} props
 * @param {{field: string, width?: number, flex?: number}[]} [props.columns]
 * @param {number} [props.rows=12]
 * @param {number} [props.rowHeight=34]
 */
export default function TableSkeleton({ columns = [], rows = 12, rowHeight = 34 }) {
  const cells =
    columns.length > 0
      ? columns
      : [{ width: 40 }, { flex: 2 }, { flex: 1 }, { flex: 1 }, { flex: 1 }, { width: 80 }];

  return (
    <Box sx={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Stack
          key={rowIndex}
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: 1.25,
            height: rowHeight,
            borderBottom: '1px solid',
            borderColor: 'var(--line-soft)',
            // Dégradé d'opacité : la liste « s'estompe » vers le bas plutôt
            // que de s'arrêter net.
            opacity: Math.max(0.25, 1 - rowIndex * 0.06),
          }}
        >
          {cells.map((cell, cellIndex) => (
            <Box
              key={cellIndex}
              sx={{
                width: cell.width ?? undefined,
                flex: cell.width ? '0 0 auto' : (cell.flex ?? 1),
                minWidth: 0,
              }}
            >
              <Skeleton variant="text" width={`${60 + ((rowIndex * 7 + cellIndex * 13) % 35)}%`} />
            </Box>
          ))}
        </Stack>
      ))}
    </Box>
  );
}
