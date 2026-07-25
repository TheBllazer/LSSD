import { useMemo, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Autocomplete, Box, Stack, TextField, Typography } from '@mui/material';
import Avatar from '@/components/media/Avatar';
import StatusChip from '@/components/system/StatusChip';
import { useAllCitizens } from '@/hooks/data/useCitizens';
import { matchesQuery } from '@/utils/tokens';
import { registryName } from '@/utils/format';
import { formatDate } from '@/utils/dates';
import { CITIZEN_STATUS_LABELS } from '@/types/citizens';

/** Nombre de fiches chargées pour alimenter le sélecteur. */
const CANDIDATE_LIMIT = 300;

/**
 * Sélecteur de citoyen.
 *
 * Charge une fois les fiches du registre puis filtre en mémoire : la frappe
 * répond instantanément et ne coûte aucune lecture supplémentaire. Au-delà de
 * {@link CANDIDATE_LIMIT} fiches, les plus anciennes ne sont plus proposées —
 * la recherche globale (phase 10) prendra le relais pour les gros registres.
 *
 * @param {object} props
 * @param {object|null} props.value        Citoyen sélectionné
 * @param {(citizen: object|null) => void} props.onChange
 * @param {string} [props.label='Propriétaire']
 * @param {string} [props.helperText]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.error]
 */
export function CitizenAutocomplete({
  value,
  onChange,
  label = 'Propriétaire',
  helperText,
  disabled = false,
  error = false,
  ...rest
}) {
  const [input, setInput] = useState('');
  const { data: citizens = [], isLoading } = useAllCitizens({ max: CANDIDATE_LIMIT });

  const options = useMemo(() => {
    if (!input) return citizens;
    return citizens.filter((citizen) =>
      matchesQuery(input, [
        citizen.firstName,
        citizen.lastName,
        ...(citizen.aliases ?? []),
        citizen.phone,
      ]),
    );
  }, [citizens, input]);

  return (
    <Autocomplete
      size="small"
      value={value ?? null}
      onChange={(_event, next) => onChange(next)}
      inputValue={input}
      onInputChange={(_event, next) => setInput(next)}
      options={options}
      loading={isLoading}
      disabled={disabled}
      getOptionLabel={(option) => registryName(option, '')}
      isOptionEqualToValue={(option, selected) => option.id === selected?.id}
      // Le filtrage est déjà fait en amont : on neutralise celui de MUI, qui
      // ne connaît ni les alias ni la normalisation des accents.
      filterOptions={(list) => list}
      noOptionsText={
        citizens.length === 0 ? 'Registre des citoyens vide' : 'Aucune correspondance'
      }
      renderOption={(optionProps, option) => {
        const { key, ...liProps } = optionProps;
        return (
          <Box component="li" key={key} {...liProps}>
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: '100%' }}>
              <Avatar person={option} size={26} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} noWrap>
                  {registryName(option)}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }} noWrap>
                  {formatDate(option.birthDate)}
                  {option.address?.district ? ` · ${option.address.district}` : ''}
                </Typography>
              </Box>
              <StatusChip
                status={option.status}
                label={CITIZEN_STATUS_LABELS[option.status] ?? option.status}
              />
            </Stack>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          placeholder="Nom, alias ou téléphone…"
        />
      )}
      {...rest}
    />
  );
}

/**
 * Variante connectée à React Hook Form.
 *
 * Le formulaire stocke l'identifiant (`ownerId`) tandis que l'affichage a
 * besoin de la fiche complète : la résolution se fait ici, à partir des fiches
 * déjà chargées.
 *
 * @param {object} props
 * @param {string} props.name  Champ contenant l'identifiant
 * @param {string} [props.label]
 */
export default function CitizenPicker({ name, label, ...rest }) {
  const { control } = useFormContext();
  const { data: citizens = [] } = useAllCitizens({ max: CANDIDATE_LIMIT });

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CitizenAutocomplete
          label={label}
          value={citizens.find((citizen) => citizen.id === field.value) ?? null}
          onChange={(citizen) => field.onChange(citizen?.id ?? null)}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          {...rest}
        />
      )}
    />
  );
}
