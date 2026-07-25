import { Box, Stack, Tooltip, IconButton, Divider, ToggleButtonGroup, ToggleButton } from '@mui/material';

/**
 * Barre d'outils dense, façon ruban de logiciel métier.
 * @param {{ children: React.ReactNode, dense?: boolean, sx?: object }} props
 */
export default function Toolbar({ children, dense = false, sx }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        px: 0.75,
        height: dense ? 30 : 36,
        flexShrink: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-800)',
        ...sx,
      }}
    >
      {children}
    </Stack>
  );
}

/**
 * Bouton d'outil : icône seule, infobulle obligatoire, état actif marqué.
 *
 * @param {object} props
 * @param {React.ReactNode} props.icon
 * @param {string} props.label      Texte de l'infobulle (accessibilité)
 * @param {boolean} [props.active]
 * @param {boolean} [props.disabled]
 * @param {string} [props.shortcut] Raccourci affiché dans l'infobulle
 * @param {() => void} props.onClick
 */
export function ToolbarButton({ icon, label, active = false, disabled = false, shortcut, onClick }) {
  return (
    <Tooltip title={shortcut ? `${label} (${shortcut})` : label}>
      <span>
        <IconButton
          size="small"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          sx={{
            borderRadius: '3px',
            width: 26,
            height: 26,
            color: active ? 'primary.main' : 'text.secondary',
            bgcolor: active ? 'rgba(45,125,210,0.14)' : 'transparent',
            '&:hover': { color: 'text.primary' },
          }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** Séparateur vertical entre groupes d'outils. */
export function ToolbarSeparator() {
  return <Divider orientation="vertical" flexItem sx={{ my: 0.75, mx: 0.25 }} />;
}

/** Espace élastique poussant les éléments suivants à droite. */
export function ToolbarSpacer() {
  return <Box sx={{ flex: 1 }} />;
}

/**
 * Groupe de bascules exclusives (densité, mode d'affichage…).
 *
 * @param {object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {{ value: string, label: string, icon: React.ReactNode }[]} props.options
 */
export function ToolbarToggleGroup({ value, onChange, options }) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_event, next) => next && onChange(next)}
      sx={{
        '& .MuiToggleButton-root': {
          height: 26,
          px: 1,
          border: '1px solid var(--line)',
          color: 'text.secondary',
          '&.Mui-selected': {
            color: 'primary.main',
            bgcolor: 'rgba(45,125,210,0.14)',
          },
        },
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} aria-label={option.label}>
          {option.icon}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
