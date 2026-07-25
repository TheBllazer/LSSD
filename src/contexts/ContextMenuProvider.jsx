import { useCallback, useMemo, useState } from 'react';
import { Box, Divider, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { Kbd } from '@/components/system';
import { ContextMenuContext } from './contextMenuContext';

/**
 * Menu contextuel global (clic droit).
 *
 * Un seul menu existe dans l'application : n'importe quel composant peut
 * l'ouvrir en décrivant ses actions, sans gérer de position, de fermeture ni
 * d'accessibilité clavier.
 *
 * @example
 * const { openMenu } = useContextMenu();
 * <tr onContextMenu={(event) => openMenu(event, [
 *   { id: 'open', label: 'Ouvrir', icon: <MdOpenInNew />, onClick: () => open(id) },
 *   { id: 'sep', divider: true },
 *   { id: 'del', label: 'Archiver', danger: true, onClick: () => archive(id) },
 * ])} />
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function ContextMenuProvider({ children }) {
  const [state, setState] = useState(null);

  const openMenu = useCallback((event, items) => {
    event.preventDefault();
    event.stopPropagation();
    if (!items?.length) return;

    // MUI repositionne automatiquement le menu s'il déborde de la fenêtre.
    setState({
      position: { top: event.clientY, left: event.clientX },
      items,
    });
  }, []);

  const closeMenu = useCallback(() => setState(null), []);

  const value = useMemo(() => ({ openMenu, closeMenu }), [openMenu, closeMenu]);

  return (
    <ContextMenuContext.Provider value={value}>
      {children}

      <Menu
        open={Boolean(state)}
        onClose={closeMenu}
        anchorReference="anchorPosition"
        anchorPosition={state?.position}
        slotProps={{
          paper: { sx: { minWidth: 210 } },
          list: { dense: true },
        }}
        transitionDuration={90}
      >
        {state?.items.map((item) =>
          item.divider ? (
            <Divider key={item.id} sx={{ my: 0.5 }} />
          ) : (
            <MenuItem
              key={item.id}
              disabled={item.disabled}
              onClick={() => {
                closeMenu();
                item.onClick?.();
              }}
              sx={{ color: item.danger ? 'error.main' : undefined }}
            >
              {item.icon && (
                <ListItemIcon
                  sx={{ minWidth: 0, color: item.danger ? 'error.main' : 'text.secondary' }}
                >
                  {item.icon}
                </ListItemIcon>
              )}

              <Typography sx={{ fontSize: 12, flex: 1 }}>{item.label}</Typography>

              {item.shortcut && (
                <Box sx={{ ml: 2 }}>
                  <Kbd>{item.shortcut}</Kbd>
                </Box>
              )}
            </MenuItem>
          ),
        )}
      </Menu>
    </ContextMenuContext.Provider>
  );
}
