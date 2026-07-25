import { useCallback, useRef, useState } from 'react';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { ConfirmContext } from './confirmContext';

/**
 * Fournit la confirmation applicative.
 *
 * Une seule instance de dialogue existe dans tout le logiciel : les
 * confirmations ne peuvent pas s'empiler, ce qui évite les situations où un
 * agent valide sans voir ce qu'il valide.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const resolverRef = useRef(null);

  /**
   * Ouvre le dialogue et attend la décision de l'agent.
   * @param {object} nextRequest
   * @returns {Promise<{confirmed: boolean, reason: string}>}
   */
  const confirm = useCallback((nextRequest) => {
    // Une demande déjà en cours est refusée plutôt qu'écrasée silencieusement.
    if (resolverRef.current) {
      return Promise.resolve({ confirmed: false, reason: '' });
    }

    setRequest(nextRequest);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleClose = useCallback((result) => {
    setRequest(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(result);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog open={Boolean(request)} request={request} onClose={handleClose} />
    </ConfirmContext.Provider>
  );
}
