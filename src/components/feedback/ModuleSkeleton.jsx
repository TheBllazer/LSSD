import { Box, Skeleton, Stack } from '@mui/material';

/**
 * Squelette affiché pendant le chargement différé (`React.lazy`) d'un module.
 *
 * Il reproduit la structure générique d'un écran de registre — en-tête, barre
 * de filtres, tableau — pour qu'aucun saut de mise en page ne se produise quand
 * le contenu réel arrive.
 */
export default function ModuleSkeleton({ rows = 10 }) {
  return (
    <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* En-tête de module */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Skeleton variant="rectangular" width={22} height={22} />
        <Skeleton variant="text" width={220} height={22} />
        <Box sx={{ flex: 1 }} />
        <Skeleton variant="rectangular" width={140} height={30} />
        <Skeleton variant="rectangular" width={96} height={30} />
      </Stack>

      {/* Barre de filtres */}
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rectangular" width={320} height={30} />
        <Skeleton variant="rectangular" width={120} height={30} />
        <Skeleton variant="rectangular" width={120} height={30} />
        <Skeleton variant="rectangular" width={120} height={30} />
      </Stack>

      {/* Tableau */}
      <Box
        sx={{
          flex: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: 32,
            bgcolor: 'var(--navy-750)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        />
        {Array.from({ length: rows }).map((_, index) => (
          <Stack
            key={index}
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              px: 1.5,
              height: 34,
              borderBottom: '1px solid',
              borderColor: 'var(--line-soft)',
              opacity: 1 - index * 0.06,
            }}
          >
            <Skeleton variant="rectangular" width={14} height={14} />
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width="18%" />
            <Skeleton variant="text" width="12%" />
            <Skeleton variant="text" width="10%" />
            <Skeleton variant="text" width="16%" />
            <Box sx={{ flex: 1 }} />
            <Skeleton variant="rectangular" width={64} height={18} />
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
