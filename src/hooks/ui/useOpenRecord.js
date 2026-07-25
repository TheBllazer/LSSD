import { useCallback } from 'react';
import useWorkspace from './useWorkspace';
import { ENTITY_ROUTE } from '@/app/config/constants';

/**
 * Ouvre une fiche dans un onglet interne.
 *
 * C'est le point d'entrée unique de la navigation croisée : un véhicule ouvre
 * son propriétaire, un rapport ouvre un citoyen, un casier ouvre sa fiche. Les
 * composants n'ont jamais à construire d'URL eux-mêmes.
 *
 * @returns {(record: {type: string, id: string, title: string, subtitle?: string},
 *            options?: {background?: boolean}) => void}
 *
 * @example
 * const openRecord = useOpenRecord();
 * openRecord({ type: ENTITY_TYPES.CITIZEN, id, title: 'DE SANTA, Michael' });
 */
export default function useOpenRecord() {
  const { openRecord } = useWorkspace();

  return useCallback(
    (record, options) => {
      const buildPath = ENTITY_ROUTE[record.type];
      if (!buildPath) {
        console.warn('[LSSD] Type d\'entité sans route associée :', record.type);
        return;
      }

      openRecord(
        {
          type: record.type,
          id: record.id,
          title: record.title,
          subtitle: record.subtitle ?? '',
          path: buildPath(record.id),
        },
        options,
      );
    },
    [openRecord],
  );
}
