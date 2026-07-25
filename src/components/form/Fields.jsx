import { Controller, useFormContext } from 'react-hook-form';
import {
  Autocomplete,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField as MuiTextField,
} from '@mui/material';
import { toDay, DATE_FORMATS } from '@/utils/dates';

/**
 * Champs de formulaire connectés à React Hook Form.
 *
 * Tous suivent le même contrat : `name` (chemin dans le formulaire), `label`,
 * et les propriétés MUI usuelles. L'erreur de validation est récupérée
 * automatiquement depuis le contexte du formulaire — aucun câblage manuel.
 */

/**
 * Extrait le message d'erreur d'un chemin imbriqué (`licenses.0.number`).
 * @param {object} errors
 * @param {string} name
 * @returns {string|undefined}
 */
function errorAt(errors, name) {
  const node = name
    .split('.')
    .reduce((cursor, key) => (cursor === undefined ? undefined : cursor?.[key]), errors);
  return node?.message;
}

/**
 * Champ texte (mono-ligne ou multi-lignes).
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {boolean} [props.multiline]
 * @param {number} [props.minRows]
 * @param {string} [props.helperText]
 * @param {boolean} [props.mono] Police à chasse fixe (plaques, VIN, matricules)
 */
export function TextField({ name, label, helperText, mono = false, ...rest }) {
  const { register, formState } = useFormContext();
  const message = errorAt(formState.errors, name);

  return (
    <MuiTextField
      {...register(name)}
      label={label}
      error={Boolean(message)}
      helperText={message ?? helperText}
      slotProps={
        mono ? { input: { sx: { fontFamily: 'var(--font-mono)' } } } : undefined
      }
      {...rest}
    />
  );
}

/**
 * Liste déroulante.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {{value: string, label: string}[]} props.options
 * @param {boolean} [props.allowEmpty]
 * @param {string} [props.emptyLabel]
 */
export function SelectField({
  name,
  label,
  options = [],
  allowEmpty = false,
  emptyLabel = '— Non renseigné —',
  helperText,
  ...rest
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <MuiTextField
          {...field}
          value={field.value ?? ''}
          select
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          {...rest}
        >
          {allowEmpty && (
            <MenuItem value="">
              <em>{emptyLabel}</em>
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </MuiTextField>
      )}
    />
  );
}

/**
 * Champ de date (et heure optionnelle).
 *
 * Utilise l'entrée native du navigateur : elle est plus rapide à saisir au
 * clavier qu'un calendrier, ce qui compte pour un opérateur qui enregistre des
 * dizaines de dates par jour.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {boolean} [props.withTime]
 */
export function DateField({ name, label, withTime = false, helperText, ...rest }) {
  const { control } = useFormContext();
  const format = withTime ? 'YYYY-MM-DDTHH:mm' : DATE_FORMATS.ISO_DATE;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const day = toDay(field.value);
        return (
          <MuiTextField
            type={withTime ? 'datetime-local' : 'date'}
            label={label}
            value={day ? day.format(format) : ''}
            onChange={(event) => {
              const raw = event.target.value;
              field.onChange(raw ? new Date(raw) : null);
            }}
            onBlur={field.onBlur}
            inputRef={field.ref}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? helperText}
            slotProps={{ inputLabel: { shrink: true } }}
            {...rest}
          />
        );
      }}
    />
  );
}

/**
 * Champ numérique.
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {string} [props.unit] Suffixe affiché (cm, kg, $, jours…)
 */
export function NumberField({ name, label, unit, helperText, ...rest }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <MuiTextField
          {...field}
          value={field.value ?? ''}
          onChange={(event) => {
            const raw = event.target.value;
            field.onChange(raw === '' ? null : Number(raw));
          }}
          type="number"
          label={label}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          slotProps={{
            input: unit
              ? {
                  endAdornment: (
                    <span style={{ fontSize: 11, color: 'var(--muted-dim)' }}>{unit}</span>
                  ),
                }
              : undefined,
          }}
          {...rest}
        />
      )}
    />
  );
}

/**
 * Interrupteur booléen.
 * @param {{ name: string, label: string }} props
 */
export function SwitchField({ name, label, ...rest }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.target.checked)}
              {...rest}
            />
          }
          label={<span style={{ fontSize: 12 }}>{label}</span>}
        />
      )}
    />
  );
}

/**
 * Case à cocher booléenne.
 * @param {{ name: string, label: string }} props
 */
export function CheckboxField({ name, label, ...rest }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={Boolean(field.value)}
              onChange={(event) => field.onChange(event.target.checked)}
              {...rest}
            />
          }
          label={<span style={{ fontSize: 12 }}>{label}</span>}
        />
      )}
    />
  );
}

/**
 * Saisie de valeurs libres sous forme d'étiquettes (alias, signalements,
 * certifications).
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.label
 * @param {string[]} [props.suggestions]
 */
export function TagInput({ name, label, suggestions = [], helperText, ...rest }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete
          multiple
          freeSolo
          size="small"
          options={suggestions}
          value={field.value ?? []}
          onChange={(_event, value) => field.onChange(value)}
          renderTags={(values, getTagProps) =>
            values.map((value, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip key={key} label={value} size="small" {...tagProps} />;
            })
          }
          renderInput={(params) => (
            <MuiTextField
              {...params}
              label={label}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ?? helperText}
            />
          )}
          {...rest}
        />
      )}
    />
  );
}
