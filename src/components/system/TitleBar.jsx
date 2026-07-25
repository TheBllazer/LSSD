import { Box, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { MdClose, MdOpenInNew, MdRemove } from 'react-icons/md';

/**
 * Barre de titre façon fenêtre Windows, utilisée par les modales « fiche » et
 * les fenêtres flottantes (`WindowFrame`).
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.actions]   Actions personnalisées (avant les boutons système)
 * @param {() => void} [props.onClose]
 * @param {() => void} [props.onMinimize]
 * @param {() => void} [props.onOpenInTab]    Ouvre la fiche dans un onglet interne
 * @param {boolean} [props.draggable]         Ajoute le curseur de déplacement
 */
export default function TitleBar({
  icon,
  title,
  subtitle,
  actions,
  onClose,
  onMinimize,
  onOpenInTab,
  draggable = false,
  ...rest
}) {
  return (
    <Stack
      className="scanlines"
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        position: 'relative',
        height: 32,
        flexShrink: 0,
        px: 1.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-750)',
        cursor: draggable ? 'move' : 'default',
        userSelect: 'none',
      }}
      {...rest}
    >
      {icon && (
        <Box sx={{ display: 'flex', color: 'primary.main', fontSize: 15 }}>{icon}</Box>
      )}

      <Typography
        variant="h6"
        sx={{ color: 'text.primary', lineHeight: 1, letterSpacing: '0.10em' }}
        noWrap
      >
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}

      <Box sx={{ flex: 1 }} />

      {actions}

      {onOpenInTab && (
        <Tooltip title="Ouvrir dans un onglet">
          <IconButton size="small" onClick={onOpenInTab} aria-label="Ouvrir dans un onglet">
            <MdOpenInNew size={14} />
          </IconButton>
        </Tooltip>
      )}

      {onMinimize && (
        <Tooltip title="Réduire">
          <IconButton size="small" onClick={onMinimize} aria-label="Réduire">
            <MdRemove size={16} />
          </IconButton>
        </Tooltip>
      )}

      {onClose && (
        <Tooltip title="Fermer (Échap)">
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Fermer"
            sx={{ '&:hover': { color: '#fff', bgcolor: 'error.main' } }}
          >
            <MdClose size={16} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
