import { useContext } from 'react';
import { ConfirmContext } from '@/contexts/confirmContext';

/**
 * Accès à la confirmation applicative.
 *
 * @returns {(request: object) => Promise<{confirmed: boolean, reason: string}>}
 * @throws {Error} si utilisé hors de `ConfirmProvider`
 */
export default function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm doit être utilisé à l'intérieur de <ConfirmProvider>.");
  }
  return confirm;
}
