import { Box, Chip } from '@mui/material';
import { resolveTone } from '@/utils/statusTones';

/**
 * Puce de statut : pastille lumineuse + libellé en majuscules.
 * La table des tonalités vit dans `@/utils/statusTones`.
 *
 * @param {object} props
 * @param {string} props.status       Valeur métier (clé de STATUS_TONE)
 * @param {string} [props.label]      Libellé affiché (par défaut le statut brut)
 * @param {string} [props.tone]       Force une tonalité
 * @param {boolean} [props.dot=true]  Affiche la pastille
 * @param {object} [props.sx]
 */
export default function StatusChip({ status, label, tone, dot = true, sx }) {
  const palette = resolveTone(status, tone);

  return (
    <Chip
      size="small"
      variant="filled"
      label={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625 }}>
          {dot && (
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: palette.color,
                boxShadow: `0 0 6px ${palette.color}`,
                flexShrink: 0,
              }}
            />
          )}
          {label ?? status}
        </Box>
      }
      sx={{
        color: palette.color,
        bgcolor: palette.bg,
        border: `1px solid ${palette.color}33`,
        '& .MuiChip-label': { px: 0.875 },
        ...sx,
      }}
    />
  );
}

/**
 * Puce de sévérité pour les signalements (armé et dangereux, BOLO, volé…).
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} [props.tone='danger']
 * @param {React.ReactNode} [props.icon]
 */
export function SeverityChip({ label, tone = 'danger', icon }) {
  const palette = resolveTone(null, tone);

  return (
    <Chip
      size="small"
      icon={icon ? <Box sx={{ display: 'flex', ml: 0.5 }}>{icon}</Box> : undefined}
      label={label}
      sx={{
        color: palette.color,
        bgcolor: palette.bg,
        border: `1px solid ${palette.color}55`,
        fontWeight: 700,
        letterSpacing: '0.06em',
      }}
    />
  );
}
