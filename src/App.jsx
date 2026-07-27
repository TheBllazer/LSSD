import { useEffect } from 'react';
import AppProviders from '@/app/providers/AppProviders';
import AppRouter from '@/app/router/AppRouter';
import ConfigurationError from '@/components/feedback/ConfigurationError';
import { isFirebaseConfigured } from '@/app/config/env';
import { dismissBootSplash } from '@/app/bootSplash';

/**
 * Racine de l'application.
 *
 * Sans configuration Firebase valide, aucun module ne peut fonctionner : on
 * affiche alors un écran d'instructions plutôt que de laisser l'application
 * échouer requête après requête.
 */
export default function App() {
  // Le voile d'amorçage de `index.html` est retiré ici, et non depuis
  // `main.jsx` : un effet de montage s'exécute même lorsque l'onglet est en
  // arrière-plan, ce qui n'est pas le cas d'un rappel d'animation.
  useEffect(() => {
    dismissBootSplash();
  }, []);

  return (
    <AppProviders>
      {isFirebaseConfigured() ? <AppRouter /> : <ConfigurationError />}
    </AppProviders>
  );
}
