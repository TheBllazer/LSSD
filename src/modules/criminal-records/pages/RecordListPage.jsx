import { MdGavel } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Casiers judiciaires — livrés en phase 6. */
export default function RecordListPage() {
  return (
    <ModuleLayout title="Casiers judiciaires" icon={<MdGavel />}>
      <PhasePlaceholder
        module="Casiers judiciaires"
        phase={6}
        scope={[
          'Chefs d\'accusation codifiés, disposition, tribunal, juge, avocats',
          'Peine détaillée : prison, probation, travaux d\'intérêt général, amende',
          'Liaison automatique au citoyen et au rapport d\'arrestation',
          'Mise à jour du statut du citoyen (incarcéré, en probation)',
          'Photographies anthropométriques et commentaires horodatés',
        ]}
      />
    </ModuleLayout>
  );
}
