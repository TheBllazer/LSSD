import { Dialog, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { MdDirectionsCar, MdClose, MdCheck } from 'react-icons/md';
import TitleBar from '@/components/system/TitleBar';
import SectionCard from '@/components/system/SectionCard';
import {
  Form,
  FormRow,
  TextField,
  SelectField,
  NumberField,
  PhotoUrlField,
  CitizenPicker,
} from '@/components/form';
import { vehicleSchema, emptyVehicle } from '../schemas/vehicleSchema';
import { useCreateVehicle, useAssignVehicleOwner } from '@/hooks/data/useVehicles';
import { useAllCitizens } from '@/hooks/data/useCitizens';
import {
  VEHICLE_TYPE_LABELS,
  REGISTRATION_STATUS_LABELS,
  COMMON_COLORS,
} from '@/types/vehicles';

/** Transforme un dictionnaire de libellés en options. */
const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Enregistrement d'un véhicule.
 *
 * Le propriétaire peut être désigné dès la création. Il n'est pas écrit
 * directement dans le document : la liaison passe par `assignOwner`, qui tient
 * les compteurs et les chronologies des deux fiches. Créer puis rattacher en
 * deux temps garantit qu'un véhicule sans propriétaire reste possible et qu'un
 * rattachement laisse toujours une trace.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(vehicle: object) => void} [props.onCreated]
 */
export default function VehicleFormDialog({ open, onClose, onCreated }) {
  const createVehicle = useCreateVehicle();
  const assignOwner = useAssignVehicleOwner();
  const { data: citizens = [] } = useAllCitizens({ max: 300 });

  const handleSubmit = async (values) => {
    const { ownerId, ...vehicleData } = values;

    const created = await createVehicle.mutateAsync({
      ...vehicleData,
      ownerId: null,
      ownerSnapshot: null,
      counters: {},
    });

    if (ownerId) {
      const owner = citizens.find((citizen) => citizen.id === ownerId) ?? null;
      if (owner) {
        await assignOwner.mutateAsync({
          vehicle: { ...created, ownerId: null },
          newOwner: owner,
          previousOwner: null,
        });
      }
    }

    onClose();
    onCreated?.(created);
  };

  const busy = createVehicle.isPending || assignOwner.isPending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth keepMounted={false}>
      <TitleBar icon={<MdDirectionsCar />} title="Nouveau véhicule" onClose={onClose} />

      <Form schema={vehicleSchema} defaultValues={emptyVehicle()} onSubmit={handleSubmit}>
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
                  <TextField name="plate" label="Plaque" mono autoFocus required />
                  <TextField name="vin" label="VIN" mono />
                </FormRow>

                <FormRow>
                  <TextField name="make" label="Marque" required />
                  <TextField name="model" label="Modèle" required />
                </FormRow>

                <FormRow>
                  <NumberField name="year" label="Année" />
                  <SelectField
                    name="color"
                    label="Couleur"
                    options={COMMON_COLORS.map((color) => ({ value: color, label: color }))}
                    allowEmpty
                  />
                  <SelectField
                    name="type"
                    label="Type"
                    options={toOptions(VEHICLE_TYPE_LABELS)}
                  />
                </FormRow>
              </SectionCard>

              <SectionCard title="Situation administrative">
                <FormRow>
                  <SelectField
                    name="registrationStatus"
                    label="Immatriculation"
                    options={toOptions(REGISTRATION_STATUS_LABELS)}
                  />
                </FormRow>

                <Box sx={{ mb: 1.5 }}>
                  <CitizenPicker
                    name="ownerId"
                    label="Propriétaire (facultatif)"
                    helperText="Sélectionné dans le registre des citoyens. Modifiable ensuite depuis la fiche."
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
                {busy ? 'Enregistrement…' : 'Enregistrer le véhicule'}
              </Button>
            </DialogActions>
          </>
        )}
      </Form>
    </Dialog>
  );
}
