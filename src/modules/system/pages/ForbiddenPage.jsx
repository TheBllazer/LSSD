import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { MdBlock, MdSpaceDashboard } from 'react-icons/md';
import { Panel } from '@/components/system';
import { ROUTES } from '@/app/config/constants';

/**
 * Accès refusé : l'agent est authentifié mais ne dispose pas de la permission
 * requise. La tentative est journalisée côté service (phase 1).
 */
export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <Panel
        title="Accès refusé"
        icon={<MdBlock />}
        sx={{ maxWidth: 560, borderColor: 'error.main' }}
      >
        <Typography variant="body2" sx={{ mb: 2 }}>
          Votre niveau d'habilitation ne permet pas d'accéder à cette ressource.
          Si cet accès est nécessaire à votre service, adressez une demande à un
          officier disposant des droits d'administration.
        </Typography>

        <Typography variant="caption" sx={{ display: 'block', mb: 2 }}>
          Cette tentative a été enregistrée dans le journal d'audit.
        </Typography>

        <Button
          variant="contained"
          startIcon={<MdSpaceDashboard />}
          onClick={() => navigate(ROUTES.DASHBOARD)}
        >
          Retour au tableau de bord
        </Button>
      </Panel>
    </Box>
  );
}
