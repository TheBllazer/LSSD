import AppThemeProvider from './AppThemeProvider';
import QueryProvider from './QueryProvider';
import AuthProvider from '@/contexts/AuthProvider';
import ToastHost from '@/components/feedback/ToastHost';
import ErrorBoundary from '@/components/feedback/ErrorBoundary';

/**
 * Empilement des fournisseurs de contexte de l'application.
 *
 * Ordre volontaire (de l'extérieur vers l'intérieur) :
 *   ErrorBoundary → Thème → Query → Auth → (phase 2 : Workspace, ContextMenu,
 *   Confirm) → (phase 10 : CommandPalette, Notifications).
 *
 * Le thème précède Query pour que les écrans d'erreur du client de requêtes
 * soient déjà stylés ; Auth vient après Query afin que les futurs hooks de
 * session puissent s'appuyer sur le cache ; l'ErrorBoundary englobe tout pour
 * ne jamais laisser l'écran vide.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AppProviders({ children }) {
  return (
    <ErrorBoundary scope="application">
      <AppThemeProvider>
        <QueryProvider>
          <AuthProvider>
            {children}
            <ToastHost />
          </AuthProvider>
        </QueryProvider>
      </AppThemeProvider>
    </ErrorBoundary>
  );
}
