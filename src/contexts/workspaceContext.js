import { createContext } from 'react';

/**
 * Contexte de l'espace de travail : les onglets internes du logiciel.
 *
 * Ouvrir une fiche n'écrase pas la précédente — elle s'ajoute à une pile
 * d'onglets, comme dans un client lourd. Un agent peut ainsi comparer deux
 * citoyens, garder un rapport ouvert pendant qu'il consulte un véhicule, et
 * retrouver son contexte après un rechargement de page.
 *
 * @typedef {object} WorkspaceTab
 * @property {string} key       Identifiant unique (`type:id`)
 * @property {string} type      Type d'entité (`ENTITY_TYPES`)
 * @property {string} id        Identifiant de l'entité
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} path      Route à ouvrir
 * @property {boolean} [dirty]  Modifications non enregistrées
 *
 * @type {React.Context<{
 *   tabs: WorkspaceTab[],
 *   activeKey: string|null,
 *   openRecord: (tab: Omit<WorkspaceTab,'key'>, options?: {background?: boolean}) => void,
 *   closeTab: (key: string) => void,
 *   closeOthers: (key: string) => void,
 *   closeAll: () => void,
 *   setDirty: (key: string, dirty: boolean) => void,
 *   updateTab: (key: string, patch: Partial<WorkspaceTab>) => void
 * }|null>}
 */
export const WorkspaceContext = createContext(null);

/** Nombre maximum d'onglets ouverts simultanément. */
export const MAX_TABS = 12;
