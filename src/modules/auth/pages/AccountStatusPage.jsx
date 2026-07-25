import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  MdBlock,
  MdPersonOff,
  MdCloudOff,
  MdLogout,
  MdRefresh,
} from 'react-icons/md';
import AuthLayout from '@/layouts/AuthLayout';
import useAuth from '@/hooks/auth/useAuth';
import { AUTH_STATUS } from '@/contexts/authContext';

/**
 * Contenu affiché selon l'état anormal de la session.
 * Chaque cas explique la cause et la marche à suivre — jamais un simple
 * « accès refusé » sans contexte.
 */
const VARIANTS = {
  [AUTH_STATUS.UNPROVISIONED]: {
    icon: MdPersonOff,
    color: 'warning.main',
    title: 'Compte non provisionné',
    body:
      "Votre compte existe mais n'est rattaché à aucun matricule du service. " +
      "Un administrateur doit vous attribuer un rôle et une fiche agent avant " +
      'que vous puissiez accéder au système.',
    hint: 'Communiquez votre adresse e-mail à un officier disposant des droits d\'administration.',
  },
  [AUTH_STATUS.DISABLED]: {
    icon: MdBlock,
    color: 'error.main',
    title: 'Compte désactivé',
    body:
      'Votre accès au système a été suspendu par le commandement. Cette mesure ' +
      'prend effet immédiatement et vous a déconnecté de tous les terminaux.',
    hint: 'Adressez-vous à votre hiérarchie pour connaître le motif et la procédure de réactivation.',
  },
  [AUTH_STATUS.ERROR]: {
    icon: MdCloudOff,
    color: 'error.main',
    title: 'Système inaccessible',
    body:
      'La connexion à la base de données du service a échoué. Il peut s\'agir ' +
      'd\'une coupure réseau ou d\'une indisponibilité temporaire du serveur.',
    hint: 'Réessayez dans quelques instants. Si le problème persiste, signalez-le au support technique.',
  },
};

/**
 * Écran des états de session anormaux : compte non provisionné, désactivé, ou
 * défaillance de chargement du profil.
 */
export default function AccountStatusPage() {
  const { status, user, error, logout, refresh } = useAuth();
  const [busy, setBusy] = useState(false);

  const variant = VARIANTS[status] ?? VARIANTS[AUTH_STATUS.ERROR];
  const Icon = variant.icon;

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async () => {
    setBusy(true);
    try {
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <Box
        sx={{
          width: 480,
          border: '1px solid',
          borderColor: variant.color,
          borderRadius: '4px',
          bgcolor: 'var(--navy-800)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'var(--navy-750)',
          }}
        >
          <Box sx={{ display: 'flex', color: variant.color, fontSize: 20 }}>
            <Icon />
          </Box>
          <Typography variant="h6" sx={{ color: variant.color }}>
            {variant.title}
          </Typography>
        </Stack>

        <Box sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ mb: 1.75 }}>
            {variant.body}
          </Typography>

          {error && status === AUTH_STATUS.ERROR && (
            <Box
              className="mono selectable"
              sx={{
                p: 1,
                mb: 1.75,
                fontSize: 11.5,
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '3px',
              }}
            >
              {error}
            </Box>
          )}

          <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
            {variant.hint}
          </Typography>

          {user?.email && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="baseline"
              sx={{
                mb: 2.25,
                pt: 1.25,
                borderTop: '1px dashed',
                borderColor: 'var(--line-soft)',
              }}
            >
              <Typography className="label-caps">Compte concerné</Typography>
              <Typography className="mono selectable" sx={{ fontSize: 12 }}>
                {user.email}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" spacing={1}>
            {status === AUTH_STATUS.ERROR && (
              <Button
                variant="contained"
                startIcon={<MdRefresh />}
                onClick={handleRetry}
                disabled={busy}
              >
                Réessayer
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<MdLogout />}
              onClick={handleLogout}
              disabled={busy}
            >
              Se déconnecter
            </Button>
          </Stack>
        </Box>
      </Box>
    </AuthLayout>
  );
}
