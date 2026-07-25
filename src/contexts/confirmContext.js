import { createContext } from 'react';

/**
 * Contexte de confirmation.
 *
 * Expose une fonction `confirm(request)` qui retourne une promesse résolue
 * avec `{ confirmed, reason }`. L'appelant écrit donc une confirmation comme
 * un appel asynchrone ordinaire, sans gérer d'état de dialogue :
 *
 * @example
 * const { confirmed, reason } = await confirm({
 *   title: 'Archiver la fiche',
 *   entityType: 'Citoyen',
 *   entityLabel: 'DE SANTA, Michael',
 *   danger: true,
 *   requireReason: true,
 * });
 * if (confirmed) remove({ id, reason });
 *
 * @type {React.Context<((request: object) => Promise<{confirmed: boolean, reason: string}>)|null>}
 */
export const ConfirmContext = createContext(null);
