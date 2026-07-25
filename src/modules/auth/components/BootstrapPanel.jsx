import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MdRocketLaunch, MdShield } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import {
  provisionFirstAdministrator,
  seedReferenceData,
} from '@/services/bootstrap.service';
import { RANK_LABELS, DIVISION_LABELS } from '@/types/agents';

/** Transforme un dictionnaire de libellés en options. */
const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Amorçage du système : création du premier administrateur.
 *
 * Affiché uniquement lorsque `/settings/bootstrap` est absent, c'est-à-dire
 * sur une installation neuve. Une fois l'amorçage effectué, la sentinelle
 * existe et cet écran ne réapparaît jamais — les règles de sécurité refusent
 * alors toute nouvelle auto-attribution de droits.
 *
 * @param {object} props
 * @param {import('firebase/auth').User} props.user
 * @param {() => Promise<void>} props.onDone Recharge la session
 */
export default function BootstrapPanel({ user, onDone }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    badgeNumber: '0001',
    rank: 'SHERIFF',
    division: 'ADMIN',
    service: 'Station centrale',
    callsign: '1-ADAM-1',
    phone: '',
    photoUrl: '',
  });
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState(null);

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const complete =
    form.firstName.trim().length > 1 &&
    form.lastName.trim().length > 1 &&
    form.badgeNumber.trim().length > 0;

  const submit = async () => {
    if (!complete || busy) return;

    setBusy(true);
    setError(null);

    try {
      setStep('Création des habilitations et de la fiche agent…');
      await provisionFirstAdministrator({ user, profile: form });

      // Les référentiels exigent la permission admin.settings : ils ne peuvent
      // être écrits qu'une fois le document de permissions en place.
      setStep('Création des référentiels et des compteurs…');
      await seedReferenceData(user.uid);

      setStep('Ouverture de la session…');
      await onDone();
    } catch (bootstrapError) {
      setError(bootstrapError.message ?? "L'amorçage a échoué.");
      setBusy(false);
      setStep('');
    }
  };

  return (
    <Box
      sx={{
        width: 560,
        border: '1px solid',
        borderColor: 'secondary.main',
        borderRadius: '4px',
        bgcolor: 'var(--navy-800)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
        overflow: 'hidden',
      }}
    >
      <TitleBar icon={<MdRocketLaunch />} title="Amorçage du système" />

      <Box sx={{ p: 2.5 }}>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Aucun administrateur n'existe encore sur ce projet. Votre compte peut
          être provisionné comme <strong>administrateur initial</strong>, ce qui
          créera votre fiche agent, vos habilitations et les référentiels du
          service.
        </Typography>

        <Alert
          severity="warning"
          icon={<MdShield />}
          sx={{ mb: 2, fontSize: 12, alignItems: 'center' }}
        >
          Cette opération n'est possible <strong>qu'une seule fois</strong>. Elle
          scelle définitivement la procédure : les comptes suivants devront être
          créés depuis le module Agents.
        </Alert>

        <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
          <TextField
            label="Nom"
            value={form.lastName}
            onChange={set('lastName')}
            disabled={busy}
            autoFocus
          />
          <TextField
            label="Prénom"
            value={form.firstName}
            onChange={set('firstName')}
            disabled={busy}
          />
          <TextField
            label="Matricule"
            value={form.badgeNumber}
            onChange={set('badgeNumber')}
            disabled={busy}
            sx={{ width: 130 }}
            slotProps={{ input: { sx: { fontFamily: 'var(--font-mono)' } } }}
          />
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
          <TextField select label="Grade" value={form.rank} onChange={set('rank')} disabled={busy}>
            {toOptions(RANK_LABELS).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Division"
            value={form.division}
            onChange={set('division')}
            disabled={busy}
          >
            {toOptions(DIVISION_LABELS).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{ mb: 2 }}>
          <TextField
            label="Affectation"
            value={form.service}
            onChange={set('service')}
            disabled={busy}
          />
          <TextField
            label="Indicatif"
            value={form.callsign}
            onChange={set('callsign')}
            disabled={busy}
            sx={{ width: 160 }}
          />
          <TextField
            label="Téléphone"
            value={form.phone}
            onChange={set('phone')}
            disabled={busy}
            sx={{ width: 160 }}
          />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ height: 2, mb: 1.5 }}>{busy && <LinearProgress />}</Box>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="caption" sx={{ flex: 1 }}>
            {busy ? step : `Compte : ${user.email}`}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<MdRocketLaunch />}
            onClick={submit}
            disabled={!complete || busy}
          >
            {busy ? 'Amorçage…' : 'Amorcer le système'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
