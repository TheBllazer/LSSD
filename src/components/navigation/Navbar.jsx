import { useLocation } from 'react-router-dom';
import { Box, Stack, Typography, Tooltip } from '@mui/material';
import { MdChevronRight } from 'react-icons/md';
import { ALL_NAV } from '@/app/config/navigation';
import { env } from '@/app/config/env';
import TopProgressBar from '@/components/feedback/TopProgressBar';
import UserMenu from './UserMenu';

/**
 * Barre supérieure : identité de l'agence, localisation dans l'application et
 * menu de l'agent connecté.
 *
 * La recherche globale Ctrl+K et le centre de notifications viendront s'insérer
 * ici en phase 10 : aucun élément décoratif non fonctionnel n'est affiché
 * avant d'être opérationnel.
 */
export default function Navbar() {
  const location = useLocation();

  const current = ALL_NAV.find(
    (item) =>
      location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
  );

  return (
    <Stack
      component="header"
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        position: 'relative',
        height: 'var(--navbar-h)',
        flexShrink: 0,
        px: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-800)',
        zIndex: 'var(--z-navbar)',
      }}
    >
      <TopProgressBar />

      {/* Identité de l'agence */}
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          component="img"
          src={`${env.basePath}brand/lssd-star.svg`}
          alt=""
          sx={{ width: 26, height: 26 }}
        />
        <Box>
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '0.10em',
              lineHeight: 1.1,
            }}
          >
            LSSD&nbsp;RMS
          </Typography>
          <Typography sx={{ fontSize: 9.5, color: 'text.secondary', letterSpacing: '0.10em' }}>
            RECORDS MANAGEMENT
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ width: 1, height: 22, bgcolor: 'divider' }} />

      {/* Localisation courante */}
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: 'text.disabled', letterSpacing: '0.08em' }}>
          {env.app.agency}
        </Typography>
        {current && (
          <>
            <MdChevronRight size={14} color="var(--muted-dim)" />
            <Typography sx={{ fontSize: 12, fontWeight: 600 }} noWrap>
              {current.label}
            </Typography>
          </>
        )}
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Tooltip title={`Version ${env.app.version} · ${env.mode}`}>
        <Typography
          className="mono"
          sx={{ fontSize: 10.5, color: 'text.disabled', letterSpacing: '0.06em' }}
        >
          v{env.app.version}
        </Typography>
      </Tooltip>

      <Box sx={{ width: 1, height: 22, bgcolor: 'divider' }} />

      <UserMenu />
    </Stack>
  );
}
