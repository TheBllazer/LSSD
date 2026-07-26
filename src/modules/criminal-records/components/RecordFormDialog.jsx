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
} from '@mui/material';
import { MdGavel, MdClose, MdCheck } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import SectionCard from '@/components/system/SectionCard';
import { CitizenAutocomplete } from '@/components/form/CitizenPicker';
import ChargesEditor from './ChargesEditor';
import { emptyRecord } from '../schemas/recordSchema';
import { useCreateRecord } from '@/hooks/data/useCriminalRecords';
import { formatDate } from '@/utils/dates';
import {
  RECORD_TYPE_LABELS,
  DISPOSITION_LABELS,
  RECORD_STATUS_LABELS,
  COURTS,
  citizenStatusFromRecord,
} from '@/types/records';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Ouverture d'un casier judiciaire.
 *
 * Le titulaire est obligatoire et choisi dans le registre : un casier sans
 * personne rattachée n'aurait aucune valeur. L'écran annonce à l'avance l'effet
 * sur la fiche du citoyen — c'est une modification de son statut judiciaire,
 * elle ne doit pas être une surprise.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} [props.citizen]  Titulaire pré-sélectionné
 * @param {(record: object) => void} [props.onCreated]
 */
export default function RecordFormDialog({ open, onClose, citizen: presetCitizen, onCreated }) {
  const createRecord = useCreateRecord();
  const [citizen, setCitizen] = useState(presetCitizen ?? null);
  const [form, setForm] = useState(emptyRecord());

  const set = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const setSentence = (field) => (event) =>
    setForm((current) => ({
      ...current,
      sentence: {
        ...current.sentence,
        [field]: event.target.value === '' ? null : Number(event.target.value),
      },
    }));

  const projectedStatus = citizenStatusFromRecord(form);
  const valid = Boolean(citizen) && form.charges.length > 0;

  const submit = async () => {
    if (!valid) return;
    const created = await createRecord.mutateAsync({
      data: { ...form, citizenId: citizen.id },
      citizen,
    });
    onClose();
    onCreated?.(created);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth keepMounted={false}>
      <TitleBar icon={<MdGavel />} title="Ouvrir un casier judiciaire" onClose={onClose} />

      <DialogContent sx={{ p: 2 }}>
        <SectionCard title="Titulaire">
          <CitizenAutocomplete
            value={citizen}
            onChange={setCitizen}
            label="Citoyen concerné"
            disabled={Boolean(presetCitizen)}
            helperText="Le casier sera rattaché définitivement à cette fiche."
          />
        </SectionCard>

        <SectionCard title="Procédure">
          <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
            <TextField
              type="date"
              label="Date des faits"
              value={formatDate(form.date, 'YYYY-MM-DD', '')}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  date: event.target.value ? new Date(event.target.value) : null,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField select label="Nature" value={form.type} onChange={set('type')}>
              {toOptions(RECORD_TYPE_LABELS).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1.25} sx={{ mb: 1.5 }}>
            <TextField
              select
              label="Disposition"
              value={form.disposition}
              onChange={set('disposition')}
            >
              {toOptions(DISPOSITION_LABELS).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="État" value={form.status} onChange={set('status')}>
              {toOptions(RECORD_STATUS_LABELS).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Juridiction" value={form.court} onChange={set('court')}>
              <MenuItem value="">Non précisée</MenuItem>
              {COURTS.map((court) => (
                <MenuItem key={court} value={court}>
                  {court}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </SectionCard>

        <ChargesEditor
          charges={form.charges}
          onChange={(charges) => setForm((current) => ({ ...current, charges }))}
        />

        <SectionCard title="Peine prononcée">
          <Stack direction="row" spacing={1.25}>
            <TextField
              type="number"
              label="Prison"
              value={form.sentence.prisonDays ?? ''}
              onChange={setSentence('prisonDays')}
              slotProps={{ input: { endAdornment: <Box sx={{ fontSize: 11 }}>jours</Box> } }}
            />
            <TextField
              type="number"
              label="Probation"
              value={form.sentence.probationDays ?? ''}
              onChange={setSentence('probationDays')}
              slotProps={{ input: { endAdornment: <Box sx={{ fontSize: 11 }}>jours</Box> } }}
            />
            <TextField
              type="number"
              label="TIG"
              value={form.sentence.communityServiceHours ?? ''}
              onChange={setSentence('communityServiceHours')}
              slotProps={{ input: { endAdornment: <Box sx={{ fontSize: 11 }}>heures</Box> } }}
            />
            <TextField
              type="number"
              label="Amende"
              value={form.sentence.fineAmount ?? ''}
              onChange={setSentence('fineAmount')}
              slotProps={{ input: { endAdornment: <Box sx={{ fontSize: 11 }}>$</Box> } }}
            />
          </Stack>
        </SectionCard>

        {projectedStatus && citizen && (
          <Alert severity="warning" sx={{ fontSize: 12.5 }}>
            L'ouverture de ce casier portera le statut de{' '}
            <strong>{citizen.lastName?.toUpperCase()}</strong> à{' '}
            <strong>{projectedStatus}</strong> et écrira un événement dans sa chronologie.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button variant="outlined" startIcon={<MdClose />} onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="contained"
          startIcon={<MdCheck />}
          onClick={submit}
          disabled={!valid || createRecord.isPending}
        >
          {createRecord.isPending ? 'Ouverture…' : 'Ouvrir le casier'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
