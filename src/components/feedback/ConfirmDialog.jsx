import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
  LinearProgress,
} from '@mui/material';
import { MdWarningAmber, MdDeleteForever, MdCheck, MdClose } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import { TIMING } from '@/app/config/constants';

/**
 * Boîte de confirmation.
 *
 * Deux niveaux :
 *  - confirmation simple (quitter sans enregistrer, changer un statut) ;
 *  - confirmation destructive (`danger`), avec un délai de déverrouillage du
 *    bouton et, si demandé, la saisie obligatoire d'un motif qui sera
 *    enregistré dans le journal d'audit.
 *
 * Le délai n'est pas décoratif : il évite l'archivage d'une fiche par un
 * double-clic parti trop vite, cas classique sur les tableaux à sélection
 * multiple.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {object} props.request  Descripteur passé à `confirm()`
 * @param {(result: {confirmed: boolean, reason: string}) => void} props.onClose
 */
export default function ConfirmDialog({ open, request, onClose }) {
  const {
    title = 'Confirmation',
    message,
    entityLabel,
    entityType,
    danger = false,
    requireReason = false,
    confirmLabel,
    cancelLabel = 'Annuler',
  } = request ?? {};

  const [reason, setReason] = useState('');
  const [locked, setLocked] = useState(danger);

  /** Réinitialise et arme le verrou à chaque ouverture. */
  useEffect(() => {
    if (!open) return undefined;

    setReason('');
    if (!danger) {
      setLocked(false);
      return undefined;
    }

    setLocked(true);
    const timer = setTimeout(() => setLocked(false), TIMING.CONFIRM_UNLOCK);
    return () => clearTimeout(timer);
  }, [open, danger]);

  const reasonMissing = requireReason && reason.trim().length < 3;
  const disabled = locked || reasonMissing;

  const handleConfirm = () => {
    if (disabled) return;
    onClose({ confirmed: true, reason: reason.trim() });
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose({ confirmed: false, reason: '' })}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { sx: { borderColor: danger ? 'error.main' : 'var(--line-strong)' } },
      }}
    >
      <TitleBar
        icon={danger ? <MdDeleteForever /> : <MdWarningAmber />}
        title={title}
        onClose={() => onClose({ confirmed: false, reason: '' })}
      />

      <DialogContent sx={{ p: 2 }}>
        {message && (
          <Typography variant="body2" sx={{ mb: entityLabel ? 1.5 : 0 }}>
            {message}
          </Typography>
        )}

        {entityLabel && (
          <Box
            sx={{
              p: 1.25,
              mb: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderLeft: '3px solid',
              borderLeftColor: danger ? 'error.main' : 'primary.main',
              borderRadius: '3px',
              bgcolor: 'var(--navy-850)',
            }}
          >
            {entityType && (
              <Typography className="label-caps" sx={{ display: 'block', mb: 0.25 }}>
                {entityType}
              </Typography>
            )}
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{entityLabel}</Typography>
          </Box>
        )}

        {danger && (
          <Typography variant="caption" sx={{ display: 'block', mb: 1.5 }}>
            La fiche est archivée, pas effacée : elle reste consultable par un
            administrateur et les liens existants sont préservés.
          </Typography>
        )}

        {requireReason && (
          <TextField
            label="Motif"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Doublon, erreur de saisie, décision de commandement…"
            multiline
            minRows={2}
            autoFocus
            helperText="Le motif est enregistré dans le journal d'audit."
          />
        )}
      </DialogContent>

      <Box sx={{ height: 2 }}>{locked && <LinearProgress />}</Box>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            startIcon={<MdClose />}
            onClick={() => onClose({ confirmed: false, reason: '' })}
            fullWidth
          >
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            color={danger ? 'error' : 'primary'}
            startIcon={danger ? <MdDeleteForever /> : <MdCheck />}
            onClick={handleConfirm}
            disabled={disabled}
            fullWidth
          >
            {locked
              ? 'Patientez…'
              : (confirmLabel ?? (danger ? 'Archiver' : 'Confirmer'))}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
