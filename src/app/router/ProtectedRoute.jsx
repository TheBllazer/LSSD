import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/auth/useAuth';
import { AUTH_STATUS } from '@/contexts/authContext';
import BootSplash from '@/components/feedback/BootSplash';
import AccountStatusPage from '@/modules/auth/pages/AccountStatusPage';
import { ROUTES } from '@/app/config/constants';

/**
 * Garde d'accès de premier niveau : la session doit être ouverte et le compte
 * opérationnel.
 *
 * Les états intermédiaires sont traités explicitement plutôt que renvoyés vers
 * l'écran de connexion : un compte non provisionné ou désactivé mérite un
 * message clair, sinon l'agent boucle indéfiniment sur le formulaire.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  switch (status) {
    case AUTH_STATUS.INITIALIZING:
      return <BootSplash message="Vérification de la session" />;

    case AUTH_STATUS.LOADING_PROFILE:
      return <BootSplash message="Chargement du profil et des habilitations" />;

    case AUTH_STATUS.UNAUTHENTICATED:
      // On mémorise la destination pour y revenir après authentification.
      return (
        <Navigate
          to={ROUTES.LOGIN}
          replace
          state={{ from: location.pathname + location.search }}
        />
      );

    case AUTH_STATUS.UNPROVISIONED:
    case AUTH_STATUS.DISABLED:
    case AUTH_STATUS.ERROR:
      return <AccountStatusPage />;

    case AUTH_STATUS.AUTHENTICATED:
      return children;

    default:
      return <BootSplash />;
  }
}
