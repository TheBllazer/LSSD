import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MdAdd, MdDelete, MdGavel } from 'react-icons/md';
import SectionCard from '@/components/system/SectionCard';
import { useSettings } from '@/hooks/data/useSettings';

/**
 * Éditeur de chefs d'accusation.
 *
 * Les codes proviennent du référentiel `/settings/app`, alimenté à l'amorçage
 * et modifiable en administration : un agent choisit un code existant plutôt
 * que de le saisir, ce qui garantit que deux dossiers citant le même délit
 * portent le même code.
 *
 * @param {object} props
 * @param {{code: string, label: string, counts?: number}[]} props.charges
 * @param {(charges: object[]) => void} props.onChange
 * @param {boolean} [props.readOnly]
 */
export default function ChargesEditor({ charges = [], onChange, readOnly = false }) {
  const { data: settings } = useSettings();
  const [draft, setDraft] = useState(null);

  const catalogue = settings?.chargeCodes ?? [];

  const add = (charge) => {
    if (!charge) return;
    onChange([
      ...charges,
      { code: charge.code, label: charge.label, degree: '', counts: 1 },
    ]);
    setDraft(null);
  };

  const update = (index, patch) => {
    const next = [...charges];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <SectionCard title="Chefs d'accusation" icon={<MdGavel />}>
      {charges.length === 0 && (
        <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
          Aucun chef d'accusation retenu. Un casier doit en comporter au moins un.
        </Typography>
      )}

      {charges.map((charge, index) => (
        <Stack
          key={`${charge.code}-${index}`}
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography
            className="mono"
            sx={{ fontSize: 12, fontWeight: 700, width: 90, flexShrink: 0 }}
          >
            {charge.code}
          </Typography>

          <Typography sx={{ fontSize: 12, flex: 1, minWidth: 0 }} noWrap>
            {charge.label}
          </Typography>

          <TextField
            label="Chefs"
            type="number"
            value={charge.counts ?? 1}
            onChange={(event) =>
              update(index, { counts: Math.max(1, Number(event.target.value) || 1) })
            }
            disabled={readOnly}
            sx={{ width: 90 }}
          />

          {!readOnly && (
            <IconButton
              size="small"
              onClick={() => onChange(charges.filter((_c, position) => position !== index))}
              aria-label="Retirer ce chef d'accusation"
              sx={{ '&:hover': { color: 'error.main' } }}
            >
              <MdDelete size={16} />
            </IconButton>
          )}
        </Stack>
      ))}

      {!readOnly && (
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mt: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Autocomplete
              size="small"
              value={draft}
              onChange={(_event, charge) => setDraft(charge)}
              options={catalogue}
              getOptionLabel={(option) => `${option.code} — ${option.label}`}
              isOptionEqualToValue={(option, selected) => option.code === selected?.code}
              noOptionsText={
                catalogue.length === 0
                  ? 'Référentiel des codes pénaux vide'
                  : 'Aucune correspondance'
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ajouter un chef d'accusation"
                  placeholder="Code ou intitulé…"
                />
              )}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<MdAdd />}
            onClick={() => add(draft)}
            disabled={!draft}
            sx={{ mt: 0.25 }}
          >
            Ajouter
          </Button>
        </Stack>
      )}
    </SectionCard>
  );
}
