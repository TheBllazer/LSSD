import { createContext } from 'react';

/**
 * Contexte du menu contextuel (clic droit).
 *
 * @typedef {object} ContextMenuItem
 * @property {string} id
 * @property {string} [label]
 * @property {React.ReactNode} [icon]
 * @property {() => void} [onClick]
 * @property {boolean} [danger]     Action destructive (rendu rouge)
 * @property {boolean} [disabled]
 * @property {boolean} [divider]    Séparateur — ignore les autres propriétés
 * @property {string} [shortcut]    Raccourci affiché à droite
 *
 * @type {React.Context<{
 *   openMenu: (event: React.MouseEvent, items: ContextMenuItem[]) => void,
 *   closeMenu: () => void
 * }|null>}
 */
export const ContextMenuContext = createContext(null);
