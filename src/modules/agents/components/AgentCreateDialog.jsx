import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  MdPersonAdd,
  MdClose,
  MdCheck,
  MdShield,
  MdVpnKey,
  MdContentCopy,
  MdCheckCircle,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import TitleBar from '@/components/system/TitleBar';
import SectionCard from '@/components/system/SectionCard';
import PasswordField from '@/components/form/PasswordField';
import { useCreateAgent } from '@/hooks/data/useAgents';
import useAuth from '@/hooks/auth/useAuth';
import { ROLE_LABELS, ROLE_LEVELS, levelOf } from '@/utils/permissions';
import { RANK_LABELS, DIVISION_LABELS } from '@/types/agents';
import { generatePassword, validatePassword } from '@/utils/password';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

const EMPTY_FORM = {
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
};

/**
 * Récapitulatif affiché après création.
 *
 * Le mot de passe n'est récupérable nulle part une fois cette fenêtre fermée :
 * Firebase ne le restitue pas, et l'application ne le conserve pas. C'est donc
 * le seul et unique moment où il peut être relevé — l'écran le dit.
 */
function Credentials({ email, password, onClose }) {
  const copyBoth = async () => {
    try {
      await navigator.clipboard.writeText(`Identifiant : ${email}\nMot de passe : ${password}`);
      toast.success('Identifiants copiés.');
    } catch {
      toast.error('Copie impossible. Relevez les identifiants manuellement.');
    }
  };

  return (
    <>
      <DialogContent sx={{ p: 2 }}>
        <Alert severity="success" icon={<MdCheckCircle />} sx={{ mb: 2, fontSize: 12 }}>
          Compte créé. Transmettez ces identifiants à l'agent&nbsp;: le mot de
          passe ne sera plus affiché après la fermeture de cette fenêtre, et
          personne — pas même vous — ne pourra le relire.
        </Alert>

        <SectionCard title="Identifiants à transmettre">
          <Stack spacing={1.25}>
            <Box>
              <Typography sx={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'text.secondary' }}>
                IDENTIFIANT
              </Typography>
              <Typography className="mono" sx={{ fontSize: 14 }}>
                {email}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 10.5, letterSpacing: '0.18em', color: 'text.secondary' }}>
                MOT DE PASSE
              </Typography>
              <Typography
                className="mono"
                sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', userSelect: 'all' }}
              >
                {password}
              </Typography>
            </Box>
          </Stack>
        </SectionCard>

        <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mt: 1.5 }}>
          L'agent pourra le changer lui-même depuis sa fiche, une fois connecté.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<MdContentCopy />} onClick={copyBoth}>
          Copier
        </Button>
        <Button variant="contained" startIcon={<MdCheck />} onClick={onClose}>
          J'ai relevé les identifiants
        </Button>
      </DialogActions>
    </>
  );
}

/**
 * Création d'un compte agent.
 *
 * Deux garde-fous portés par l'interface, doublés par les règles Firestore : on
 * ne crée jamais un compte d'un rang supérieur ou égal au sien, et le rôle
 * choisi ne fixe que les permissions par défaut.
 *
 * Le mot de passe initial est **défini ici par le commandement**. Les adresses
 * de service ne correspondent à aucune boîte réelle : le courriel de
 * réinitialisation de Firebase — la voie normale — n'arriverait jamais nulle
 * part. Il reste proposé en option pour les rares adresses réelles.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export default function AgentCreateDialog({ open, onClose }) {
  const { role: myRole } = useAuth();
  const createAgent = useCreateAgent();

  const [form, setForm] = useState(EMPTY_FORM);
  const [password, setPassword] = useState(() => generatePassword());
  const [sendResetEmail, setSendResetEmail] = useState(false);
  /** Identifiants du compte créé, à transmettre. `null` tant qu'on saisit. */
  const [created, setCreated] = useState(null);

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
    form.badgeNumber.trim().length > 0 &&
    validatePassword(password).ok;

  const submit = async () => {
    if (!valid) return;
    await createAgent.mutateAsync({ profile: form, password, sendResetEmail });
    setCreated({ email: form.email.trim().toLowerCase(), password });
  };

  /** Referme et remet la fenêtre à zéro pour la création suivante. */
  const close = () => {
    onClose();
    setForm(EMPTY_FORM);
    setPassword(generatePassword());
    setSendResetEmail(false);
    setCreated(null);
  };

  return (
    <Dialog
      open={open}
      // Une fois le compte créé, la fermeture accidentelle ferait perdre le mot
      // de passe : on impose le bouton explicite.
      onClose={created ? undefined : close}
      maxWidth="sm"
      fullWidth
      keepMounted={false}
    >
      <TitleBar
        icon={<MdPersonAdd />}
        title={created ? 'Compte agent créé' : 'Créer un compte agent'}
        onClose={created ? undefined : close}
      />

      {created ? (
        <Credentials email={created.email} password={created.password} onClose={close} />
      ) : (
        <>
          <DialogContent sx={{ p: 2 }}>
            <Alert severity="info" icon={<MdShield />} sx={{ mb: 2, fontSize: 12 }}>
              Votre session reste ouverte : le compte est créé via une instance
              Firebase secondaire. Le mot de passe est transmis à Firebase puis
              oublié — il n'est écrit ni dans les dossiers, ni au journal d'audit.
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
                  helperText="Sert d'identifiant de connexion. L'adresse n'a pas à exister."
                />
                <TextField label="Téléphone" value={form.phone} onChange={set('phone')} sx={{ width: 170 }} />
              </Stack>
            </SectionCard>

            <SectionCard title="Accès au terminal" icon={<MdVpnKey size={13} />}>
              <PasswordField
                value={password}
                onChange={setPassword}
                label="Mot de passe initial"
                helperText="À transmettre à l'agent. Il pourra le changer lui-même une fois connecté."
              />

              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    size="small"
                    checked={sendResetEmail}
                    onChange={(event) => setSendResetEmail(event.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    Envoyer en plus un courriel de réinitialisation — sans effet
                    si l'adresse ne correspond à aucune boîte réelle.
                  </Typography>
                }
              />
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
            <Button variant="outlined" startIcon={<MdClose />} onClick={close}>
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
        </>
      )}
    </Dialog>
  );
}
