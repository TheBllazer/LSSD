import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import { MdSearchOff, MdArrowBack, MdSpaceDashboard } from 'react-icons/md';
import { Panel } from '@/components/system';
import { ROUTES } from '@/app/config/constants';

/** Route inexistante — enregistrement introuvable dans le système. */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

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
      <Panel title="Enregistrement introuvable" icon={<MdSearchOff />} sx={{ maxWidth: 560 }}>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Aucune ressource ne correspond à l'adresse demandée. Elle a pu être
          supprimée, archivée, ou le lien est erroné.
        </Typography>

        <Box
          className="mono selectable"
          sx={{
            p: 1,
            mb: 2,
            fontSize: 11.5,
            color: 'text.secondary',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '3px',
          }}
        >
          {location.pathname}
        </Box>

        <Stack direction="row" spacing={1}>
          <Button variant="contained" startIcon={<MdSpaceDashboard />} onClick={() => navigate(ROUTES.DASHBOARD)}>
            Tableau de bord
          </Button>
          <Button variant="outlined" startIcon={<MdArrowBack />} onClick={() => navigate(-1)}>
            Retour
          </Button>
        </Stack>
      </Panel>
    </Box>
  );
}
