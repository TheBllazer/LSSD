import { Box, Button, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { MdClose } from 'react-icons/md';

/**
 * Barre d'actions groupées.
 *
 * Apparaît par le bas dès qu'une sélection existe, à la manière des clients de
 * messagerie et des explorateurs de fichiers. Elle flotte au-dessus du tableau
 * plutôt que de le décaler : aucune ligne ne bouge sous le curseur.
 *
 * @param {object} props
 * @param {number} props.count            Nombre d'éléments sélectionnés
 * @param {() => void} props.onClear
 * @param {React.ReactNode} props.children Boutons d'action
 * @param {string} [props.label='sélectionné']
 */
export default function BulkActionBar({ count, onClear, children, label = 'sélectionné' }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <Box
          component={motion.div}
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 48, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{
              px: 1.5,
              py: 0.875,
              border: '1px solid',
              borderColor: 'var(--line-strong)',
              borderRadius: '4px',
              bgcolor: 'var(--navy-750)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
            }}
          >
            <Box
              className="mono"
              sx={{
                px: 0.875,
                py: 0.125,
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                bgcolor: 'primary.main',
                borderRadius: '3px',
              }}
            >
              {count}
            </Box>

            <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {label}
              {count > 1 ? 's' : ''}
            </Typography>

            <Box sx={{ width: 1, height: 18, bgcolor: 'divider' }} />

            <Stack direction="row" spacing={0.5}>
              {children}
            </Stack>

            <Box sx={{ width: 1, height: 18, bgcolor: 'divider' }} />

            <Tooltip title="Annuler la sélection (Échap)">
              <IconButton size="small" onClick={onClear} aria-label="Annuler la sélection">
                <MdClose size={15} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      )}
    </AnimatePresence>
  );
}

/**
 * Bouton d'action groupée, calibré pour la barre.
 * @param {object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.label
 * @param {() => void} props.onClick
 * @param {boolean} [props.danger]
 * @param {boolean} [props.disabled]
 */
export function BulkAction({ icon, label, onClick, danger = false, disabled = false }) {
  return (
    <Button
      size="small"
      variant="text"
      startIcon={icon}
      onClick={onClick}
      disabled={disabled}
      color={danger ? 'error' : 'primary'}
      sx={{ minHeight: 26, fontSize: 11.5, whiteSpace: 'nowrap' }}
    >
      {label}
    </Button>
  );
}
