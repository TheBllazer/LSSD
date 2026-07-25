import { useFieldArray, useFormContext } from 'react-hook-form';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import {
  MdBadge,
  MdContactPhone,
  MdWork,
  MdFingerprint,
  MdCreditCard,
  MdGroups,
  MdAdd,
  MdDelete,
  MdWarning,
} from 'react-icons/md';
import SectionCard from '@/components/system/SectionCard';
import {
  Form,
  FormRow,
  FormWatcher,
  TextField,
  SelectField,
  DateField,
  NumberField,
  TagInput,
  PhotoUrlField,
} from '@/components/form';
import { citizenSchema, toFormValues } from '../../schemas/citizenSchema';
import {
  SEX_LABELS,
  EYE_COLOR_LABELS,
  HAIR_COLOR_LABELS,
  CITIZEN_STATUS_LABELS,
  CITIZEN_FLAG_LABELS,
  LICENSE_TYPE_LABELS,
  LICENSE_STATUS_LABELS,
  LICENSE_STATUS,
  AFFILIATION_TYPE_LABELS,
  LICENSE_TYPES,
  AFFILIATION_TYPES,
  toOptions,
} from '@/types/citizens';

/**
 * Liste éditable de permis.
 * Chaque ligne est un sous-formulaire : les champs restent connectés au schéma
 * global, donc validés par les mêmes règles que le reste de la fiche.
 *
 * @param {{ readOnly: boolean }} props
 */
function LicensesEditor({ readOnly }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'licenses' });

  return (
    <SectionCard
      title="Permis et licences"
      icon={<MdCreditCard />}
      actions={
        !readOnly && (
          <Button
            size="small"
            startIcon={<MdAdd />}
            onClick={() =>
              append({
                type: LICENSE_TYPES.DRIVER,
                number: '',
                status: LICENSE_STATUS.VALID,
                issuedAt: null,
                expiresAt: null,
                notes: '',
              })
            }
          >
            Ajouter
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
          Aucun permis enregistré.
        </Typography>
      ) : (
        fields.map((field, index) => (
          <Stack
            key={field.id}
            direction="row"
            spacing={1.25}
            alignItems="flex-start"
            sx={{ mb: 1.25 }}
          >
            <SelectField
              name={`licenses.${index}.type`}
              label="Type"
              options={toOptions(LICENSE_TYPE_LABELS)}
              disabled={readOnly}
              sx={{ width: 190 }}
            />
            <TextField
              name={`licenses.${index}.number`}
              label="Numéro"
              mono
              disabled={readOnly}
              sx={{ width: 150 }}
            />
            <SelectField
              name={`licenses.${index}.status`}
              label="Statut"
              options={toOptions(LICENSE_STATUS_LABELS)}
              disabled={readOnly}
              sx={{ width: 150 }}
            />
            <DateField
              name={`licenses.${index}.expiresAt`}
              label="Expiration"
              disabled={readOnly}
              sx={{ width: 160 }}
            />
            {!readOnly && (
              <IconButton
                onClick={() => remove(index)}
                aria-label="Retirer ce permis"
                sx={{ mt: 0.5, '&:hover': { color: 'error.main' } }}
              >
                <MdDelete size={16} />
              </IconButton>
            )}
          </Stack>
        ))
      )}
    </SectionCard>
  );
}

/**
 * Liste éditable d'affiliations (gang, organisation, entreprise, famille).
 * @param {{ readOnly: boolean }} props
 */
function AffiliationsEditor({ readOnly }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'affiliations' });

  return (
    <SectionCard
      title="Affiliations"
      icon={<MdGroups />}
      actions={
        !readOnly && (
          <Button
            size="small"
            startIcon={<MdAdd />}
            onClick={() =>
              append({
                type: AFFILIATION_TYPES.GANG,
                name: '',
                role: '',
                since: null,
                notes: '',
              })
            }
          >
            Ajouter
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
          Aucune affiliation connue.
        </Typography>
      ) : (
        fields.map((field, index) => (
          <Stack
            key={field.id}
            direction="row"
            spacing={1.25}
            alignItems="flex-start"
            sx={{ mb: 1.25 }}
          >
            <SelectField
              name={`affiliations.${index}.type`}
              label="Type"
              options={toOptions(AFFILIATION_TYPE_LABELS)}
              disabled={readOnly}
              sx={{ width: 170 }}
            />
            <TextField
              name={`affiliations.${index}.name`}
              label="Nom"
              disabled={readOnly}
              sx={{ flex: 1 }}
            />
            <TextField
              name={`affiliations.${index}.role`}
              label="Rôle"
              disabled={readOnly}
              sx={{ width: 170 }}
            />
            {!readOnly && (
              <IconButton
                onClick={() => remove(index)}
                aria-label="Retirer cette affiliation"
                sx={{ mt: 0.5, '&:hover': { color: 'error.main' } }}
              >
                <MdDelete size={16} />
              </IconButton>
            )}
          </Stack>
        ))
      )}
    </SectionCard>
  );
}

/**
 * Liste éditable de tatouages et marques.
 * @param {{ readOnly: boolean }} props
 */
function TattoosEditor({ readOnly }) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'tattoos' });

  return (
    <SectionCard
      title="Tatouages et marques"
      icon={<MdFingerprint />}
      actions={
        !readOnly && (
          <Button
            size="small"
            startIcon={<MdAdd />}
            onClick={() => append({ location: '', description: '', photoUrl: '' })}
          >
            Ajouter
          </Button>
        )
      }
    >
      {fields.length === 0 ? (
        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
          Aucun signe particulier enregistré.
        </Typography>
      ) : (
        fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              p: 1.25,
              mb: 1.25,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '3px',
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <FormRow>
                  <TextField
                    name={`tattoos.${index}.location`}
                    label="Emplacement"
                    disabled={readOnly}
                    sx={{ width: 200 }}
                  />
                  <TextField
                    name={`tattoos.${index}.description`}
                    label="Description"
                    disabled={readOnly}
                  />
                </FormRow>
                <PhotoUrlField
                  name={`tattoos.${index}.photoUrl`}
                  label="Photographie du tatouage"
                  previewWidth={64}
                  previewHeight={64}
                />
              </Box>
              {!readOnly && (
                <IconButton
                  onClick={() => remove(index)}
                  aria-label="Retirer ce tatouage"
                  sx={{ '&:hover': { color: 'error.main' } }}
                >
                  <MdDelete size={16} />
                </IconButton>
              )}
            </Stack>
          </Box>
        ))
      )}
    </SectionCard>
  );
}

/**
 * Onglet « Identité » de la fiche citoyen.
 *
 * Toute la fiche est éditable en place : il n'y a pas de bascule
 * « consultation / modification ». Chaque changement déclenche
 * l'enregistrement automatique via `FormWatcher`, l'état étant visible en
 * permanence en pied de fiche.
 *
 * @param {object} props
 * @param {object} props.citizen
 * @param {(values: object) => void} props.onDirty  Notifie l'enregistrement auto
 * @param {boolean} props.readOnly
 */
export default function IdentityTab({ citizen, onDirty, readOnly }) {
  return (
    <Form
      schema={citizenSchema}
      defaultValues={toFormValues(citizen)}
      onSubmit={() => {}}
      mode="onChange"
    >
      <FormWatcher onChange={onDirty} enabled={!readOnly} />

      <SectionCard title="État civil" icon={<MdBadge />}>
        <Box sx={{ mb: 1.5 }}>
          <PhotoUrlField name="photoUrl" label="Photographie d'identité" />
        </Box>

        <FormRow>
          <TextField name="lastName" label="Nom" disabled={readOnly} />
          <TextField name="firstName" label="Prénom" disabled={readOnly} />
        </FormRow>

        <FormRow>
          <DateField name="birthDate" label="Date de naissance" disabled={readOnly} />
          <SelectField
            name="sex"
            label="Sexe"
            options={toOptions(SEX_LABELS)}
            disabled={readOnly}
          />
        </FormRow>

        <Box sx={{ mb: 1.5 }}>
          <TagInput
            name="aliases"
            label="Alias connus"
            disabled={readOnly}
            helperText="Entrée pour valider chaque alias."
          />
        </Box>
      </SectionCard>

      <SectionCard title="Signalement physique" icon={<MdFingerprint />}>
        <FormRow>
          <NumberField name="height" label="Taille" unit="cm" disabled={readOnly} />
          <NumberField name="weight" label="Poids" unit="kg" disabled={readOnly} />
          <SelectField
            name="eyeColor"
            label="Yeux"
            options={toOptions(EYE_COLOR_LABELS)}
            allowEmpty
            disabled={readOnly}
          />
          <SelectField
            name="hairColor"
            label="Cheveux"
            options={toOptions(HAIR_COLOR_LABELS)}
            allowEmpty
            disabled={readOnly}
          />
        </FormRow>

        <TextField
          name="distinctiveMarks"
          label="Signes particuliers"
          multiline
          minRows={2}
          disabled={readOnly}
          sx={{ mb: 1.5 }}
        />
      </SectionCard>

      <SectionCard title="Coordonnées" icon={<MdContactPhone />}>
        <FormRow>
          <TextField name="phone" label="Téléphone" mono disabled={readOnly} />
          <TextField name="email" label="Adresse e-mail" disabled={readOnly} />
        </FormRow>

        <FormRow>
          <TextField name="address.street" label="Adresse" disabled={readOnly} />
          <TextField name="address.district" label="District" disabled={readOnly} />
          <TextField
            name="address.postal"
            label="Code postal"
            mono
            disabled={readOnly}
            sx={{ width: 140 }}
          />
        </FormRow>
      </SectionCard>

      <SectionCard title="Situation professionnelle" icon={<MdWork />}>
        <FormRow>
          <TextField name="occupation" label="Profession" disabled={readOnly} />
          <TextField name="employer" label="Employeur" disabled={readOnly} />
        </FormRow>
      </SectionCard>

      <SectionCard title="Dossier" icon={<MdWarning />}>
        <FormRow>
          <SelectField
            name="status"
            label="Statut judiciaire"
            options={toOptions(CITIZEN_STATUS_LABELS)}
            disabled={readOnly}
          />
          <TagInput
            name="flags"
            label="Signalements opérationnels"
            suggestions={Object.keys(CITIZEN_FLAG_LABELS)}
            disabled={readOnly}
            helperText="Visibles en tête de fiche par tous les agents."
          />
        </FormRow>

        <TextField
          name="description"
          label="Description générale"
          multiline
          minRows={3}
          disabled={readOnly}
        />
      </SectionCard>

      <LicensesEditor readOnly={readOnly} />
      <AffiliationsEditor readOnly={readOnly} />
      <TattoosEditor readOnly={readOnly} />
    </Form>
  );
}
