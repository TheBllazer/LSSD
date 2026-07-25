import { MdDirectionsCar } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Registre des véhicules — livré en phase 4. */
export default function VehicleListPage() {
  return (
    <ModuleLayout title="Registre des véhicules" icon={<MdDirectionsCar />}>
      <PhasePlaceholder
        module="Véhicules"
        phase={4}
        scope={[
          'Registre des immatriculations : plaque, VIN, marque, modèle, couleur',
          'Propriétaire sélectionné dans le registre des citoyens (liaison bidirectionnelle)',
          'Assurance, état, description, photographies',
          'Signalements (volé, BOLO) et gestion de la fourrière',
          'Historique complet des changements de propriétaire',
        ]}
      />
    </ModuleLayout>
  );
}
