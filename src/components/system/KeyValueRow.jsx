import { Box, Stack, Typography } from '@mui/material';

/**
 * Ligne « libellé / valeur » des fiches.
 * Libellé en petites majuscules à largeur fixe, valeur alignée à gauche :
 * la colonne reste parfaitement régulière d'une fiche à l'autre.
 *
 * @param {object} props
 * @param {React.ReactNode} props.label
 * @param {React.ReactNode} [props.value]     Valeur affichée ; « — » si vide
 * @param {number} [props.labelWidth=132]
 * @param {boolean} [props.mono]              Police à chasse fixe (IDs, plaques)
 * @param {React.ReactNode} [props.action]    Action alignée à droite
 * @param {object} [props.sx]
 */
export default function KeyValueRow({
  label,
  value,
  labelWidth = 132,
  mono = false,
  action,
  sx,
}) {
  const isEmpty = value === null || value === undefined || value === '';

  return (
    <Stack
      direction="row"
      alignItems="baseline"
      spacing={1.25}
      sx={{
        py: 0.5,
        borderBottom: '1px dashed',
        borderColor: 'var(--line-soft)',
        '&:last-of-type': { borderBottom: 'none' },
        ...sx,
      }}
    >
      <Typography
        className="label-caps"
        sx={{ width: labelWidth, flexShrink: 0, pt: '1px' }}
      >
        {label}
      </Typography>

      <Box
        className={mono ? 'mono selectable' : 'selectable'}
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: 12.5,
          color: isEmpty ? 'text.disabled' : 'text.primary',
          wordBreak: 'break-word',
        }}
      >
        {isEmpty ? '—' : value}
      </Box>

      {action}
    </Stack>
  );
}
