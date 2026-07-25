import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Stack, Tooltip, Typography, IconButton } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MdClose,
  MdSpaceDashboard,
  MdPeopleAlt,
  MdDirectionsCar,
  MdDescription,
  MdGavel,
  MdLocalPolice,
  MdInsertDriveFile,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import useWorkspace from '@/hooks/ui/useWorkspace';
import useContextMenu from '@/hooks/ui/useContextMenu';
import { ENTITY_TYPES, ROUTES } from '@/app/config/constants';

/** Icône associée à chaque type d'entité ouvrable. */
const TYPE_ICONS = {
  [ENTITY_TYPES.CITIZEN]: MdPeopleAlt,
  [ENTITY_TYPES.VEHICLE]: MdDirectionsCar,
  [ENTITY_TYPES.WEAPON]: GiPistolGun,
  [ENTITY_TYPES.REPORT]: MdDescription,
  [ENTITY_TYPES.RECORD]: MdGavel,
  [ENTITY_TYPES.AGENT]: MdLocalPolice,
};

/**
 * Barre d'onglets des fiches ouvertes.
 *
 * Le premier onglet, épinglé, est le tableau de bord : il ne se ferme pas et
 * sert de point de retour. Les suivants correspondent aux fiches ouvertes,
 * avec un point bleu si elles portent des modifications non enregistrées.
 */
export default function TabBar() {
  const { tabs, closeTab, closeOthers, closeAll } = useWorkspace();
  const { openMenu } = useContextMenu();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === ROUTES.DASHBOARD;

  /**
   * Menu contextuel d'un onglet.
   * @param {React.MouseEvent} event
   * @param {object} tab
   */
  const handleContextMenu = (event, tab) => {
    openMenu(event, [
      { id: 'close', label: 'Fermer', onClick: () => closeTab(tab.key), shortcut: 'Ctrl+W' },
      { id: 'others', label: 'Fermer les autres', onClick: () => closeOthers(tab.key) },
      { id: 'all', label: 'Tout fermer', onClick: closeAll },
      { id: 'sep', divider: true },
      {
        id: 'copy',
        label: "Copier l'identifiant",
        onClick: () => navigator.clipboard?.writeText(tab.id),
      },
    ]);
  };

  return (
    <Stack
      direction="row"
      alignItems="stretch"
      className="scroll-hidden"
      sx={{
        height: 'var(--tabbar-h)',
        flexShrink: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-900)',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {/* Onglet épinglé du tableau de bord */}
      <Tooltip title="Tableau de bord">
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          onClick={() => navigate(ROUTES.DASHBOARD)}
          sx={{
            px: 1.5,
            flexShrink: 0,
            cursor: 'pointer',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: isDashboard ? 'var(--navy-800)' : 'transparent',
            color: isDashboard ? 'text.primary' : 'text.secondary',
            borderTop: '2px solid',
            borderTopColor: isDashboard ? 'primary.main' : 'transparent',
            '&:hover': { bgcolor: 'var(--navy-850)' },
          }}
        >
          <MdSpaceDashboard size={14} />
        </Stack>
      </Tooltip>

      <AnimatePresence initial={false}>
        {tabs.map((tab) => {
          const Icon = TYPE_ICONS[tab.type] ?? MdInsertDriveFile;
          const active = location.pathname === tab.path;

          return (
            <Box
              key={tab.key}
              component={motion.div}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              sx={{ display: 'flex', flexShrink: 0, overflow: 'hidden' }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                onClick={() => navigate(tab.path)}
                onContextMenu={(event) => handleContextMenu(event, tab)}
                onAuxClick={(event) => {
                  // Clic molette : ferme l'onglet, convention des navigateurs.
                  if (event.button === 1) {
                    event.preventDefault();
                    closeTab(tab.key);
                  }
                }}
                sx={{
                  pl: 1.25,
                  pr: 0.5,
                  maxWidth: 220,
                  cursor: 'pointer',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  borderTop: '2px solid',
                  borderTopColor: active ? 'primary.main' : 'transparent',
                  bgcolor: active ? 'var(--navy-800)' : 'transparent',
                  color: active ? 'text.primary' : 'text.secondary',
                  transition: 'background-color 120ms ease',
                  '&:hover': { bgcolor: active ? 'var(--navy-800)' : 'var(--navy-850)' },
                }}
              >
                <Icon size={13} style={{ flexShrink: 0 }} />

                <Typography sx={{ fontSize: 11.5, fontWeight: active ? 600 : 400 }} noWrap>
                  {tab.title}
                </Typography>

                {tab.dirty && (
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      flexShrink: 0,
                    }}
                  />
                )}

                <IconButton
                  size="small"
                  aria-label={`Fermer ${tab.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(tab.key);
                  }}
                  sx={{
                    p: 0.125,
                    ml: 0.25,
                    flexShrink: 0,
                    '&:hover': { bgcolor: 'error.main', color: '#fff' },
                  }}
                >
                  <MdClose size={12} />
                </IconButton>
              </Stack>
            </Box>
          );
        })}
      </AnimatePresence>
    </Stack>
  );
}
