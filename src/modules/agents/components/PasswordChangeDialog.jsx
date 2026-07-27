import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MdVpnKey, MdClose, MdCheck } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import PasswordField from '@/components/form/PasswordField';
import { useChangeOwnPassword } from '@/hooks/data/useAgents';
import { validatePassword } from '@/utils/password';

/**
 * Changement de son propre mot de passe.
 *
 * Firebase exige de rejouer les identifiants actuels avant toute modification
 * sensible. Cette contrainte est ici une protection utile : un terminal laissé
 * déverrouillé ne suffit pas à confisquer un compte.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.email  Identifiant de l'agent, affiché pour lever le doute
 */
export default function PasswordChangeDialog({ open, onClose, email }) {
  const changePassword = useChangeOwnPassword();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const check = validatePassword(next);
  const mismatch = confirmation.length > 0 && confirmation !== next;
  const valid = current.length > 0 && check.ok && confirmation === next;

  const close = () => {
    onClose();
    setCurrent('');
    setNext('');
    setConfirmation('');
    changePassword.reset();
  };

  const submit = async () => {
    if (!valid) return;
    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      close();
    } catch {
      // Le message est affiché dans la fenêtre : on la laisse ouverte pour que
      // la correction se fasse sans tout ressaisir.
    }
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth keepMounted={false}>
      <TitleBar icon={<MdVpnKey />} title="Changer mon mot de passe" onClose={close} />

      <DialogContent sx={{ p: 2 }}>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1.75 }}>
          Compte&nbsp;: <span className="mono">{email}</span>
        </Typography>

        {changePassword.isError && (
          <Alert severity="error" sx={{ mb: 1.75, fontSize: 12 }}>
            {changePassword.error?.friendlyMessage ?? 'Modification impossible.'}
          </Alert>
        )}

        <Stack spacing={1.75}>
          <TextField
            label="Mot de passe actuel"
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
            autoFocus
            fullWidth
            slotProps={{ input: { sx: { fontFamily: 'var(--font-mono)' } } }}
          />

          <PasswordField
            value={next}
            onChange={setNext}
            label="Nouveau mot de passe"
            helperText="8 caractères minimum."
          />

          <TextField
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            error={mismatch}
            helperText={mismatch ? 'Les deux saisies diffèrent.' : ' '}
            fullWidth
            slotProps={{ input: { sx: { fontFamily: 'var(--font-mono)' } } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<MdClose />} onClick={close}>
          Annuler
        </Button>
        <Button
          variant="contained"
          startIcon={<MdCheck />}
          onClick={submit}
          disabled={!valid || changePassword.isPending}
        >
          {changePassword.isPending ? 'Modification…' : 'Modifier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
