import { NavLink, useLocation } from 'react-router-dom';
import { Box, Stack, Tooltip, Typography, IconButton, Divider } from '@mui/material';
import { MdChevronLeft, MdChevronRight, MdStar } from 'react-icons/md';
import { motion } from 'framer-motion';
import { PRIMARY_NAV, SECONDARY_NAV } from '@/app/config/navigation';
import { KbdCombo } from '@/components/system';
import useAuth from '@/hooks/auth/useAuth';
import { hasAbility } from '@/utils/permissions';

/**
 * Élément de navigation.
 *
 * @param {object} props
 * @param {import('@/app/config/navigation').NavItem} props.item
 * @param {boolean} props.collapsed
 * @param {boolean} props.active
 */
function SidebarItem({ item, collapsed, active }) {
  const Icon = item.icon;

  const link = (
    <Box
      component={NavLink}
      to={item.path}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        height: 34,
        px: collapsed ? 0 : 1.5,
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: active ? 'text.primary' : 'text.secondary',
        bgcolor: active ? 'rgba(45,125,210,0.12)' : 'transparent',
        textDecoration: 'none',
        transition: 'background-color 140ms ease, color 140ms ease',
        '&:hover': {
          bgcolor: active ? 'rgba(45,125,210,0.16)' : 'rgba(255,255,255,0.035)',
          color: 'text.primary',
          textDecoration: 'none',
        },
      }}
    >
      {/* Liseré d'état actif */}
      {active && (
        <Box
          component={motion.span}
          layoutId="sidebar-active"
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            bgcolor: 'primary.main',
          }}
        />
      )}

      <Box sx={{ display: 'flex', fontSize: 17, flexShrink: 0 }}>
        <Icon />
      </Box>

      {!collapsed && (
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: active ? 600 : 500,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip
      placement="right"
      title={
        <Stack spacing={0.5}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{item.label}</Typography>
          {item.description && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              {item.description}
            </Typography>
          )}
          {item.shortcut && <KbdCombo combo={`Ctrl+${item.shortcut}`} />}
        </Stack>
      }
      disableHoverListener={!collapsed && !item.shortcut}
    >
      {link}
    </Tooltip>
  );
}

/**
 * Barre latérale de navigation principale.
 *
 * L'état replié est détenu par `AppShell` (pour que le raccourci Ctrl+B et le
 * bouton de la barre agissent sur la même source) et persisté en localStorage.
 *
 * Les modules dont l'agent n'a pas la permission de lecture ne sont pas
 * affichés : inutile de proposer une porte qui se refermera.
 *
 * @param {{ collapsed: boolean, onToggle: () => void }} props
 */
export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { abilities } = useAuth();

  /** Un module est actif si l'URL commence par son chemin. */
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  /** Filtre les modules selon les habilitations de l'agent. */
  const allowed = (items) =>
    items.filter((item) => !item.permission || hasAbility(abilities, item.permission));

  const primaryItems = allowed(PRIMARY_NAV);
  const secondaryItems = allowed(SECONDARY_NAV);

  return (
    <Box
      component={motion.aside}
      animate={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      sx={{
        width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-850)',
        overflow: 'hidden',
        zIndex: 'var(--z-sidebar)',
      }}
    >
      <Box sx={{ py: 1, flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="scroll-compact">
        {!collapsed && (
          <Typography className="label-caps" sx={{ px: 1.5, pb: 0.75, display: 'block' }}>
            Modules
          </Typography>
        )}

        <Stack>
          {primaryItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              active={isActive(item.path)}
            />
          ))}
        </Stack>

        <Divider sx={{ my: 1 }} />

        {!collapsed && (
          <Typography className="label-caps" sx={{ px: 1.5, pb: 0.75, display: 'block' }}>
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
              <MdStar size={11} /> Favoris
            </Box>
          </Typography>
        )}

        {!collapsed && (
          <Typography
            sx={{ px: 1.5, py: 0.5, fontSize: 11, color: 'text.disabled', fontStyle: 'italic' }}
          >
            Aucun favori
          </Typography>
        )}

        {secondaryItems.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack>
              {secondaryItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  active={isActive(item.path)}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent={collapsed ? 'center' : 'flex-end'}
        sx={{ height: 30, px: 0.5, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Tooltip title={collapsed ? 'Déplier (Ctrl+B)' : 'Replier (Ctrl+B)'} placement="right">
          <IconButton
            size="small"
            onClick={onToggle}
            aria-label="Replier la barre latérale"
          >
            {collapsed ? <MdChevronRight size={16} /> : <MdChevronLeft size={16} />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
