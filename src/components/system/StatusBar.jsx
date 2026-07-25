import { Box, Stack, Tooltip, Typography } from '@mui/material';

/**
 * Barre d'état inférieure, présente en permanence — signature visuelle des
 * logiciels de dispatch et de RMS.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function StatusBar({ children }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      component="footer"
      sx={{
        height: 'var(--statusbar-h)',
        flexShrink: 0,
        px: 1,
        gap: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-850)',
        fontSize: 11,
        color: 'text.secondary',
        userSelect: 'none',
      }}
    >
      {children}
    </Stack>
  );
}

/**
 * Élément de barre d'état, séparé par un filet vertical.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.children
 * @param {string} [props.tooltip]
 * @param {boolean} [props.mono]
 * @param {string} [props.color]     Couleur du texte (statuts, alertes)
 * @param {() => void} [props.onClick]
 */
export function StatusItem({ icon, children, tooltip, mono = false, color, onClick }) {
  const content = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.625}
      className={mono ? 'mono' : undefined}
      onClick={onClick}
      sx={{
        px: 1,
        height: '100%',
        borderRight: '1px solid',
        borderColor: 'var(--line-soft)',
        color: color || 'inherit',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 120ms ease',
        '&:hover': onClick ? { bgcolor: 'rgba(45,125,210,0.10)' } : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <Box sx={{ display: 'flex', fontSize: 12 }}>{icon}</Box>}
      <Typography component="span" sx={{ fontSize: 11, lineHeight: 1 }}>
        {children}
      </Typography>
    </Stack>
  );

  return tooltip ? <Tooltip title={tooltip}>{content}</Tooltip> : content;
}

/** Espace élastique poussant les éléments suivants à droite. */
export function StatusSpacer() {
  return <Box sx={{ flex: 1 }} />;
}
