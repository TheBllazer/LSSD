import { Box } from '@mui/material';

/**
 * Représentation d'une touche de clavier.
 * Utilisé dans les infobulles, les menus et l'aide des raccourcis.
 *
 * @param {{ children: React.ReactNode, sx?: object }} props
 */
export default function Kbd({ children, sx }) {
  return (
    <Box
      component="kbd"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        px: 0.625,
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        lineHeight: 1,
        color: 'text.secondary',
        bgcolor: 'var(--navy-700)',
        border: '1px solid var(--line-strong)',
        borderBottomWidth: 2,
        borderRadius: '3px',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Combinaison de touches (« Ctrl + K »).
 * @param {{ combo: string }} props `combo` séparé par des « + »
 */
export function KbdCombo({ combo }) {
  const keys = combo.split('+').map((key) => key.trim());
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.375 }}>
      {keys.map((key, index) => (
        <Box key={key} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.375 }}>
          {index > 0 && (
            <Box component="span" sx={{ color: 'text.disabled', fontSize: 10 }}>
              +
            </Box>
          )}
          <Kbd>{key}</Kbd>
        </Box>
      ))}
    </Box>
  );
}
