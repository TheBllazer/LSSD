import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { MdLogout, MdRefresh, MdExpandMore, MdShield } from 'react-icons/md';
import toast from 'react-hot-toast';
import Avatar from '@/components/media/Avatar';
import useAuth from '@/hooks/auth/useAuth';
import { ROLE_LABELS } from '@/utils/permissions';
import { RANK_ABBR, DIVISION_LABELS } from '@/types/agents';
import { formatBadge } from '@/utils/format';
import { ROUTES } from '@/app/config/constants';

/**
 * Menu de l'agent connecté, ancré à droite de la barre supérieure.
 *
 * Affiche l'identité de service (grade, nom, matricule, division) et donne
 * accès à la fiche personnelle, au rechargement des habilitations et à la
 * déconnexion.
 */
export default function UserMenu() {
  const { agent, role, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);

  const close = () => setAnchor(null);

  const handleLogout = async () => {
    close();
    setBusy(true);
    try {
      await logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      toast.error('Déconnexion impossible. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const handleRefresh = async () => {
    close();
    setBusy(true);
    try {
      await refresh();
      toast.success('Habilitations rechargées.');
    } finally {
      setBusy(false);
    }
  };

  if (!agent) return null;

  const rankAbbr = RANK_ABBR[agent.rank] ?? '';
  const displayName = [agent.firstName, agent.lastName].filter(Boolean).join(' ');

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{
          pl: 1,
          pr: 0.75,
          py: 0.5,
          borderRadius: '3px',
          cursor: busy ? 'wait' : 'pointer',
          border: '1px solid transparent',
          transition: 'background-color 140ms ease, border-color 140ms ease',
          '&:hover': {
            bgcolor: 'rgba(45,125,210,0.10)',
            borderColor: 'var(--line)',
          },
        }}
      >
        <Avatar person={agent} size={26} />

        <Box sx={{ minWidth: 0, textAlign: 'right' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.2 }} noWrap>
            {rankAbbr ? `${rankAbbr} ` : ''}
            {displayName}
          </Typography>
          <Typography sx={{ fontSize: 9.5, color: 'text.secondary', lineHeight: 1.2 }} noWrap>
            {agent.badgeNumber ? `#${formatBadge(agent.badgeNumber)}` : 'Sans matricule'}
            {agent.callsign ? ` · ${agent.callsign}` : ''}
          </Typography>
        </Box>

        <MdExpandMore size={14} color="var(--muted-dim)" />
      </Stack>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 260, mt: 0.5 } } }}
      >
        {/* Bloc d'identité */}
        <Box sx={{ px: 1.5, py: 1.25 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Avatar person={agent} size={40} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700 }} noWrap>
                {displayName || 'Agent'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }} noWrap>
                {agent.email}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.5 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.75,
                py: 0.25,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'secondary.main',
                border: '1px solid',
                borderColor: 'rgba(201,162,39,0.4)',
                bgcolor: 'rgba(201,162,39,0.10)',
                borderRadius: '3px',
              }}
            >
              <MdShield size={11} />
              {ROLE_LABELS[role] ?? 'Rôle inconnu'}
            </Box>

            {agent.division && (
              <Box
                sx={{
                  px: 0.75,
                  py: 0.25,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '3px',
                }}
              >
                {DIVISION_LABELS[agent.division] ?? agent.division}
              </Box>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* « Ma fiche de service » sera ajouté ici en phase 9, quand la route
            /agents/:id existera — pas de lien mort dans l'intervalle. */}
        <MenuItem onClick={handleRefresh}>
          <ListItemIcon sx={{ minWidth: 0 }}>
            <MdRefresh size={15} />
          </ListItemIcon>
          Recharger les habilitations
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 0, color: 'error.main' }}>
            <MdLogout size={15} />
          </ListItemIcon>
          Se déconnecter
        </MenuItem>
      </Menu>
    </>
  );
}
