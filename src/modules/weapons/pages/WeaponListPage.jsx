import { GiPistolGun } from 'react-icons/gi';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Registre des armes — livré en phase 4. */
export default function WeaponListPage() {
  return (
    <ModuleLayout title="Registre des armes" icon={<GiPistolGun />}>
      <PhasePlaceholder
        module="Armes"
        phase={4}
        scope={[
          'Numéro de série, marque, modèle, calibre, catégorie, classification',
          'Propriétaire issu du registre des citoyens et permis associé',
          'Alerte automatique si le permis lié est suspendu ou révoqué',
          'Statuts : enregistrée, saisie, volée, détruite, perdue',
          'Historique de possession et rapports liés',
        ]}
      />
    </ModuleLayout>
  );
}
