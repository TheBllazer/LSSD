import { Box, Button, Stack, Typography } from '@mui/material';
import { MdInbox } from 'react-icons/md';

/**
 * État vide d'un registre ou d'une liste.
 *
 * Distingue systématiquement « aucune donnée » de « aucun résultat pour ce
 * filtre » : ce sont deux situations différentes, et confondre les deux fait
 * croire à une base vide alors qu'un filtre est actif.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon]
 * @param {string} props.title
 * @param {string} [props.message]
 * @param {React.ReactNode} [props.action]
 * @param {boolean} [props.filtered] Un filtre ou une recherche est actif
 * @param {() => void} [props.onReset]
 */
export default function EmptyState({
  icon,
  title,
  message,
  action,
  filtered = false,
  onReset,
}) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.25}
      sx={{ height: '100%', minHeight: 220, p: 4, textAlign: 'center' }}
    >
      <Box
        sx={{
          display: 'flex',
          fontSize: 30,
          color: 'text.disabled',
          opacity: 0.5,
        }}
      >
        {icon ?? <MdInbox />}
      </Box>

      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
        {title}
      </Typography>

      {message && (
        <Typography variant="caption" sx={{ maxWidth: 380 }}>
          {message}
        </Typography>
      )}

      <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
        {filtered && onReset && (
          <Button variant="outlined" size="small" onClick={onReset}>
            Réinitialiser les filtres
          </Button>
        )}
        {action}
      </Stack>
    </Stack>
  );
}
