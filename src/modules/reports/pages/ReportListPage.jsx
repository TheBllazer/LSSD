import { MdDescription } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Rapports d'incident — livrés en phase 5. */
export default function ReportListPage() {
  return (
    <ModuleLayout title="Rapports d'incident" icon={<MdDescription />}>
      <PhasePlaceholder
        module="Rapports"
        phase={5}
        scope={[
          'Numérotation automatique LSSD-AAAA-NNNNNN par transaction Firestore',
          'Éditeur riche TipTap : titres, tableaux, images, listes de tâches, couleurs, citations, code',
          'Parties impliquées : agents, citoyens, véhicules, armes, chefs d\'accusation',
          'Enregistrement automatique, historique des versions et restauration',
          'Circuit de validation brouillon → soumis → revue → approuvé, avec verrou d\'édition',
        ]}
      />
    </ModuleLayout>
  );
}
