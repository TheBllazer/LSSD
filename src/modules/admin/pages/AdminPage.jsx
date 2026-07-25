import { MdSettings } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Administration — livrée en phase 9. */
export default function AdminPage() {
  return (
    <ModuleLayout title="Administration" icon={<MdSettings />}>
      <PhasePlaceholder
        module="Administration"
        phase={9}
        scope={[
          'Référentiels éditables : grades, divisions, types de rapport, codes pénaux, districts',
          'Paramètres des documents PDF (en-tête, pied de page, mentions)',
          'Journal d\'audit consultable et filtrable',
          'Gestion des permissions et coupe-circuit de compte',
        ]}
      />
    </ModuleLayout>
  );
}
