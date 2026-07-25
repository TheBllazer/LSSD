import AppProviders from '@/app/providers/AppProviders';
import AppRouter from '@/app/router/AppRouter';
import ConfigurationError from '@/components/feedback/ConfigurationError';
import { isFirebaseConfigured } from '@/app/config/env';

/**
 * Racine de l'application.
 *
 * Sans configuration Firebase valide, aucun module ne peut fonctionner : on
 * affiche alors un écran d'instructions plutôt que de laisser l'application
 * échouer requête après requête.
 */
export default function App() {
  return (
    <AppProviders>
      {isFirebaseConfigured() ? <AppRouter /> : <ConfigurationError />}
    </AppProviders>
  );
}
