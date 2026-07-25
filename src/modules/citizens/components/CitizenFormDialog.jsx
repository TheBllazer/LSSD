import { Dialog, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { MdPersonAdd, MdClose, MdCheck } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import SectionCard from '@/components/system/SectionCard';
import { Form, FormRow, TextField, SelectField, DateField, PhotoUrlField } from '@/components/form';
import { citizenSchema, emptyCitizen } from '../schemas/citizenSchema';
import { useCreateCitizen } from '@/hooks/data/useCitizens';
import {
  SEX_LABELS,
  CITIZEN_STATUS_LABELS,
  toOptions,
} from '@/types/citizens';

/**
 * Création d'une fiche citoyen.
 *
 * Volontairement limité à l'état civil et aux coordonnées : ouvrir une fiche
 * doit prendre quelques secondes sur le terrain. Le signalement complet, les
 * permis, les affiliations et les tatouages se renseignent ensuite sur la
 * fiche, où l'enregistrement est automatique.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(citizen: object) => void} [props.onCreated] Reçoit la fiche créée
 */
export default function CitizenFormDialog({ open, onClose, onCreated }) {
  const createCitizen = useCreateCitizen();

  const handleSubmit = async (values) => {
    const created = await createCitizen.mutateAsync(values);
    onClose();
    onCreated?.(created);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // Le formulaire est remonté à chaque ouverture : pas de valeurs
      // résiduelles d'une saisie précédente.
      keepMounted={false}
    >
      <TitleBar icon={<MdPersonAdd />} title="Nouvelle fiche citoyen" onClose={onClose} />

      <Form
        schema={citizenSchema}
        defaultValues={emptyCitizen()}
        onSubmit={handleSubmit}
        mode="onBlur"
      >
        {({ formState }) => (
          <>
            <DialogContent sx={{ p: 2 }}>
              <SectionCard title="Identité">
                <Box sx={{ mb: 1.5 }}>
                  <PhotoUrlField name="photoUrl" label="Photographie" />
                </Box>

                <FormRow>
                  <TextField name="lastName" label="Nom" autoFocus required />
                  <TextField name="firstName" label="Prénom" required />
                </FormRow>

                <FormRow>
                  <DateField name="birthDate" label="Date de naissance" required />
                  <SelectField name="sex" label="Sexe" options={toOptions(SEX_LABELS)} />
                </FormRow>
              </SectionCard>

              <SectionCard title="Coordonnées">
                <FormRow>
                  <TextField name="phone" label="Téléphone" mono />
                  <TextField name="email" label="Adresse e-mail" />
                </FormRow>

                <FormRow>
                  <TextField name="address.street" label="Adresse" />
                  <TextField name="address.district" label="District" />
                </FormRow>
              </SectionCard>

              <SectionCard title="Dossier">
                <FormRow>
                  <SelectField
                    name="status"
                    label="Statut"
                    options={toOptions(CITIZEN_STATUS_LABELS)}
                  />
                  <TextField name="occupation" label="Profession" />
                </FormRow>
              </SectionCard>
            </DialogContent>

            <DialogActions
              sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
            >
              <Button variant="outlined" startIcon={<MdClose />} onClick={onClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<MdCheck />}
                disabled={formState.isSubmitting || createCitizen.isPending}
              >
                {createCitizen.isPending ? 'Création…' : 'Créer la fiche'}
              </Button>
            </DialogActions>
          </>
        )}
      </Form>
    </Dialog>
  );
}
