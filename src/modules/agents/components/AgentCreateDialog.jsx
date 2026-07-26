import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MdPersonAdd, MdClose, MdCheck, MdShield } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import SectionCard from '@/components/system/SectionCard';
import { useCreateAgent } from '@/hooks/data/useAgents';
import useAuth from '@/hooks/auth/useAuth';
import { ROLE_LABELS, ROLE_LEVELS, levelOf } from '@/utils/permissions';
import { RANK_LABELS, DIVISION_LABELS } from '@/types/agents';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** Mot de passe provisoire, jamais affiché ni conservé. */
function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return `Lssd!${Array.from(bytes, (b) => b.toString(36)).join('').slice(0, 20)}`;
}

/**
 * Création d'un compte agent.
 *
 * Deux garde-fous portés par l'interface, doublés par les règles Firestore :
 * on ne crée jamais un compte d'un rang supérieur ou égal au sien, et le mot
 * de passe initial n'est ni choisi ni affiché — l'agent le définit lui-même
 * via le courriel de réinitialisation.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export default function AgentCreateDialog({ open, onClose }) {
  const { role: myRole } = useAuth();
  const createAgent = useCreateAgent();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    badgeNumber: '',
    rank: 'DEPUTY',
    role: 'DEPUTY',
    division: 'PATROL',
    service: '',
    callsign: '',
    phone: '',
    photoUrl: '',
  });

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  // Un administrateur ne peut créer que des comptes strictement inférieurs à
  // son propre rang : c'est la même règle que côté Firestore.
  const assignableRoles = toOptions(ROLE_LABELS).filter(
    (option) => ROLE_LEVELS[option.value] < levelOf(myRole),
  );

  const valid =
    form.firstName.trim().length > 1 &&
    form.lastName.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.badgeNumber.trim().length > 0;

  const submit = async () => {
    if (!valid) return;
    await createAgent.mutateAsync({ profile: form, password: temporaryPassword() });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted={false}>
      <TitleBar icon={<MdPersonAdd />} title="Créer un compte agent" onClose={onClose} />

      <DialogContent sx={{ p: 2 }}>
        <Alert severity="info" icon={<MdShield />} sx={{ mb: 2, fontSize: 12 }}>
          Votre session reste ouverte : le compte est créé via une instance
          Firebase secondaire. L'agent recevra un courriel pour définir son mot
          de passe — aucun mot de passe n'est communiqué ni conservé.
        </Alert>

        <SectionCard title="Identité">
          <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
            <TextField label="Nom" value={form.lastName} onChange={set('lastName')} autoFocus />
            <TextField label="Prénom" value={form.firstName} onChange={set('firstName')} />
            <TextField
              label="Matricule"
              value={form.badgeNumber}
              onChange={set('badgeNumber')}
              sx={{ width: 130 }}
              slotProps={{ input: { sx: { fontFamily: 'var(--font-mono)' } } }}
            />
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <TextField
              label="Adresse e-mail de service"
              value={form.email}
              onChange={set('email')}
              helperText="Sert d'identifiant de connexion."
            />
            <TextField label="Téléphone" value={form.phone} onChange={set('phone')} sx={{ width: 170 }} />
          </Stack>
        </SectionCard>

        <SectionCard title="Affectation">
          <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
            <TextField select label="Grade" value={form.rank} onChange={set('rank')}>
              {toOptions(RANK_LABELS).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Division" value={form.division} onChange={set('division')}>
              {toOptions(DIVISION_LABELS).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1.25}>
            <TextField label="Affectation" value={form.service} onChange={set('service')} />
            <TextField
              label="Indicatif"
              value={form.callsign}
              onChange={set('callsign')}
              sx={{ width: 170 }}
            />
          </Stack>
        </SectionCard>

        <SectionCard title="Habilitation">
          <TextField
            select
            label="Rôle"
            value={form.role}
            onChange={set('role')}
            helperText="Détermine les permissions par défaut. Ajustables ensuite sur la fiche."
          >
            {assignableRoles.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {assignableRoles.length === 0 && (
            <Typography sx={{ fontSize: 11.5, color: 'warning.main', mt: 1 }}>
              Votre habilitation ne permet de créer aucun rôle.
            </Typography>
          )}
        </SectionCard>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<MdClose />} onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="contained"
          startIcon={<MdCheck />}
          onClick={submit}
          disabled={!valid || createAgent.isPending || assignableRoles.length === 0}
        >
          {createAgent.isPending ? 'Création…' : 'Créer le compte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
