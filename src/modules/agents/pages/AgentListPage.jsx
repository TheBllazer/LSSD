import { MdLocalPolice } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Annuaire du personnel — livré en phase 9. */
export default function AgentListPage() {
  return (
    <ModuleLayout title="Annuaire du personnel" icon={<MdLocalPolice />}>
      <PhasePlaceholder
        module="Agents"
        phase={9}
        scope={[
          'Annuaire en cartes ou en tableau : grade, badge, indicatif, division, statut',
          'Création de comptes Firebase sans interruption de la session administrateur',
          'Matrice de permissions par module avec dérogations individuelles',
          'Activité, dernière connexion, rapports rédigés, arrestations',
          'Activation, suspension et réinitialisation de mot de passe',
        ]}
      />
    </ModuleLayout>
  );
}
