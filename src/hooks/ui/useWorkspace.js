import { useContext } from 'react';
import { WorkspaceContext } from '@/contexts/workspaceContext';

/**
 * Accès à l'espace de travail (onglets internes).
 *
 * @returns {NonNullable<React.ContextType<typeof WorkspaceContext>>}
 * @throws {Error} si utilisé hors de `WorkspaceProvider`
 */
export default function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace doit être utilisé à l'intérieur de <WorkspaceProvider>.");
  }
  return context;
}
