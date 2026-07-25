import { MdPeopleAlt } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Registre des citoyens — livré en phase 3. */
export default function CitizenListPage() {
  return (
    <ModuleLayout title="Registre des citoyens" icon={<MdPeopleAlt />}>
      <PhasePlaceholder
        module="Citoyens"
        phase={3}
        scope={[
          'Registre complet : recherche instantanée, filtres, colonnes, export',
          'Fiche à 8 onglets : identité, véhicules, armes, rapports, casier, photos, historique, notes',
          'Édition en ligne avec enregistrement automatique et journal des modifications',
          'Permis, tatouages, signes particuliers, affiliations et signalements',
          'Chronologie automatique alimentée par tous les autres modules',
        ]}
      />
    </ModuleLayout>
  );
}
