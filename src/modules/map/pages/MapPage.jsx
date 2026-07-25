import { MdMap } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import PhasePlaceholder from '@/components/feedback/PhasePlaceholder';

/** Carte interactive (SIG) — livrée en phase 8. */
export default function MapPage() {
  return (
    <ModuleLayout title="Système d'information géographique" icon={<MdMap />}>
      <PhasePlaceholder
        module="Carte interactive"
        phase={8}
        scope={[
          'Fond de carte SVG de Los Santos en projection plane (Leaflet CRS.Simple)',
          'Tracé de points, cercles, rectangles, polygones et polylignes',
          'Catégories, couleurs, icônes, couches et filtrage',
          'Liaison d\'une entité à un rapport ou à un citoyen',
          'Persistance Firestore et visibilité par division',
        ]}
      />
    </ModuleLayout>
  );
}
