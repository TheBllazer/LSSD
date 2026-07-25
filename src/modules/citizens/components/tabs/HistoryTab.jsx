import HistoryTimeline from '@/components/data/HistoryTimeline';
import { CITIZEN_EVENT_LABELS, CITIZEN_FIELD_LABELS } from '@/types/citizens';

/**
 * Onglet « Historique » d'une fiche citoyen.
 *
 * La chronologie elle-même est mutualisée (`HistoryTimeline`) : citoyens,
 * véhicules et armes produisent la même structure d'événements, seuls les
 * libellés diffèrent.
 *
 * @param {{ events: object[], loading: boolean }} props
 */
export default function HistoryTab({ events = [], loading }) {
  return (
    <HistoryTimeline
      events={events}
      loading={loading}
      eventLabels={CITIZEN_EVENT_LABELS}
      fieldLabels={CITIZEN_FIELD_LABELS}
    />
  );
}
