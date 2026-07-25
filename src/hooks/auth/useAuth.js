import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

/**
 * Accès à la session courante.
 *
 * @returns {import('@/contexts/AuthProvider').AuthContextValue}
 * @throws {Error} si utilisé hors de `AuthProvider`
 */
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>.');
  }
  return context;
}
