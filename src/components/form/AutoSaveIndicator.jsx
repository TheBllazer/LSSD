import { Stack, Typography, CircularProgress, Tooltip } from '@mui/material';
import { MdCheckCircle, MdEdit, MdErrorOutline, MdSave } from 'react-icons/md';
import { SAVE_STATE } from '@/hooks/ui/useAutoSave';
import { formatDate, DATE_FORMATS } from '@/utils/dates';

/** Apparence de chaque état d'enregistrement. */
const VARIANTS = {
  [SAVE_STATE.IDLE]: { icon: MdSave, color: 'var(--muted-dim)', label: 'Aucune modification' },
  [SAVE_STATE.DIRTY]: { icon: MdEdit, color: 'var(--warn)', label: 'Modifications en attente' },
  [SAVE_STATE.SAVING]: { icon: null, color: 'var(--accent)', label: 'Enregistrement…' },
  [SAVE_STATE.SAVED]: { icon: MdCheckCircle, color: 'var(--ok)', label: 'Enregistré' },
  [SAVE_STATE.ERROR]: { icon: MdErrorOutline, color: 'var(--danger)', label: 'Échec de l\'enregistrement' },
};

/**
 * Indicateur d'enregistrement automatique.
 *
 * Toujours visible en pied de fiche : l'agent doit savoir en permanence si son
 * travail est en sécurité, sans avoir à chercher un bouton « Enregistrer ».
 *
 * @param {object} props
 * @param {string} props.state    Valeur de `SAVE_STATE`
 * @param {Date|null} [props.savedAt]
 * @param {Error|null} [props.error]
 */
export default function AutoSaveIndicator({ state, savedAt, error }) {
  const variant = VARIANTS[state] ?? VARIANTS[SAVE_STATE.IDLE];
  const Icon = variant.icon;

  const label =
    state === SAVE_STATE.SAVED && savedAt
      ? `Enregistré à ${formatDate(savedAt, DATE_FORMATS.TIME_SECONDS)}`
      : variant.label;

  const content = (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: variant.color }}>
      {Icon ? (
        <Icon size={13} />
      ) : (
        <CircularProgress size={11} thickness={6} sx={{ color: variant.color }} />
      )}
      <Typography sx={{ fontSize: 11, color: 'inherit' }}>{label}</Typography>
    </Stack>
  );

  return state === SAVE_STATE.ERROR && error ? (
    <Tooltip title={error.message}>{content}</Tooltip>
  ) : (
    content
  );
}
