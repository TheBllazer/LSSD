import { useContext } from 'react';
import { ContextMenuContext } from '@/contexts/contextMenuContext';

/**
 * Accès au menu contextuel global.
 *
 * @returns {{ openMenu: Function, closeMenu: Function }}
 * @throws {Error} si utilisé hors de `ContextMenuProvider`
 */
export default function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error(
      "useContextMenu doit être utilisé à l'intérieur de <ContextMenuProvider>.",
    );
  }
  return context;
}
