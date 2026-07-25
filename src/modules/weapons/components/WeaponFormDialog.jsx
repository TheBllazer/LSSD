import { Dialog, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { MdClose, MdCheck } from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import TitleBar from '@/components/system/TitleBar';
import SectionCard from '@/components/system/SectionCard';
import {
  Form,
  FormRow,
  TextField,
  SelectField,
  DateField,
  PhotoUrlField,
  CitizenPicker,
} from '@/components/form';
import { weaponSchema, emptyWeapon } from '../schemas/weaponSchema';
import { useCreateWeapon, useAssignWeaponHolder } from '@/hooks/data/useWeapons';
import { useAllCitizens } from '@/hooks/data/useCitizens';
import {
  WEAPON_CATEGORY_LABELS,
  WEAPON_CLASSIFICATION_LABELS,
  WEAPON_STATUS_LABELS,
  COMMON_CALIBERS,
} from '@/types/weapons';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Enregistrement d'une arme.
 *
 * Comme pour les véhicules, le détenteur est rattaché après création par
 * `assignHolder` : la liaison doit toujours passer par l'opération qui tient
 * les compteurs et écrit les chronologies.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(weapon: object) => void} [props.onCreated]
 */
export default function WeaponFormDialog({ open, onClose, onCreated }) {
  const createWeapon = useCreateWeapon();
  const assignHolder = useAssignWeaponHolder();
  const { data: citizens = [] } = useAllCitizens({ max: 300 });

  const handleSubmit = async (values) => {
    const { ownerId, ...weaponData } = values;

    const created = await createWeapon.mutateAsync({
      ...weaponData,
      ownerId: null,
      ownerSnapshot: null,
    });

    if (ownerId) {
      const owner = citizens.find((citizen) => citizen.id === ownerId) ?? null;
      if (owner) {
        await assignHolder.mutateAsync({
          weapon: { ...created, ownerId: null },
          newOwner: owner,
          previousOwner: null,
        });
      }
    }

    onClose();
    onCreated?.(created);
  };

  const busy = createWeapon.isPending || assignHolder.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted={false}>
      <TitleBar icon={<GiPistolGun />} title="Nouvelle arme" onClose={onClose} />

      <Form schema={weaponSchema} defaultValues={emptyWeapon()} onSubmit={handleSubmit}>
        {({ formState }) => (
          <>
            <DialogContent sx={{ p: 2 }}>
              <SectionCard title="Identification">
                <Box sx={{ mb: 1.5 }}>
                  <PhotoUrlField
                    name="photoUrl"
                    label="Photographie"
                    previewWidth={120}
                    previewHeight={78}
                  />
                </Box>

                <FormRow>
                  <TextField
                    name="serialNumber"
                    label="Numéro de série"
                    mono
                    autoFocus
                    required
                  />
                </FormRow>

                <FormRow>
                  <TextField name="make" label="Marque" required />
                  <TextField name="model" label="Modèle" required />
                </FormRow>

                <FormRow>
                  <SelectField
                    name="caliber"
                    label="Calibre"
                    options={COMMON_CALIBERS.map((value) => ({ value, label: value }))}
                    allowEmpty
                  />
                  <SelectField
                    name="category"
                    label="Catégorie"
                    options={toOptions(WEAPON_CATEGORY_LABELS)}
                  />
                </FormRow>
              </SectionCard>

              <SectionCard title="Régime légal">
                <FormRow>
                  <SelectField
                    name="classification"
                    label="Classification"
                    options={toOptions(WEAPON_CLASSIFICATION_LABELS)}
                  />
                  <SelectField
                    name="status"
                    label="Statut"
                    options={toOptions(WEAPON_STATUS_LABELS)}
                  />
                </FormRow>

                <FormRow>
                  <DateField name="registeredAt" label="Date d'enregistrement" />
                </FormRow>

                <Box sx={{ mb: 1.5 }}>
                  <CitizenPicker
                    name="ownerId"
                    label="Détenteur (facultatif)"
                    helperText="La conformité du permis de port d'arme sera vérifiée sur la fiche."
                  />
                </Box>
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
                disabled={formState.isSubmitting || busy}
              >
                {busy ? 'Enregistrement…' : "Enregistrer l'arme"}
              </Button>
            </DialogActions>
          </>
        )}
      </Form>
    </Dialog>
  );
}
