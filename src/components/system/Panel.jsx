import { useState } from 'react';
import { Box, Stack, Typography, IconButton, Collapse, LinearProgress } from '@mui/material';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';
import { motion } from 'framer-motion';
import { motionTiming } from '@/styles/theme';

/**
 * En-tête de panneau : bande de titre dense, majuscules techniques,
 * zone d'actions à droite.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.actions]
 * @param {boolean} [props.collapsible]
 * @param {boolean} [props.collapsed]
 * @param {() => void} [props.onToggle]
 */
export function PanelHeader({
  icon,
  title,
  subtitle,
  actions,
  collapsible = false,
  collapsed = false,
  onToggle,
}) {
  return (
    <Stack
      className="scanlines"
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        position: 'relative',
        px: 1.25,
        height: 30,
        flexShrink: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-750)',
        cursor: collapsible ? 'pointer' : 'default',
      }}
      onClick={collapsible ? onToggle : undefined}
    >
      {icon && (
        <Box sx={{ display: 'flex', color: 'primary.main', fontSize: 15 }}>{icon}</Box>
      )}

      <Typography variant="h6" sx={{ color: 'text.primary', lineHeight: 1 }} noWrap>
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}

      <Box sx={{ flex: 1 }} />

      {actions && (
        <Stack
          direction="row"
          spacing={0.25}
          alignItems="center"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </Stack>
      )}

      {collapsible && (
        <IconButton size="small" sx={{ p: 0.25 }} aria-label="Replier le panneau">
          {collapsed ? <MdExpandMore size={16} /> : <MdExpandLess size={16} />}
        </IconButton>
      )}
    </Stack>
  );
}

/**
 * Corps de panneau. `scroll` active un défilement interne (le panneau garde
 * alors une hauteur fixe imposée par son conteneur).
 *
 * @param {{ children: React.ReactNode, dense?: boolean, scroll?: boolean, sx?: object }} props
 */
export function PanelBody({ children, dense = false, scroll = false, sx }) {
  return (
    <Box
      className={scroll ? 'scroll-compact' : undefined}
      sx={{
        p: dense ? 1 : 1.5,
        flex: 1,
        minHeight: 0,
        overflow: scroll ? 'auto' : 'visible',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Pied de panneau (actions, totaux, mentions).
 * @param {{ children: React.ReactNode }} props
 */
export function PanelFooter({ children }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        px: 1.25,
        height: 30,
        flexShrink: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'var(--navy-850)',
        fontSize: 11,
        color: 'text.secondary',
      }}
    >
      {children}
    </Stack>
  );
}

/**
 * Conteneur de base de l'interface : un cadre encadré, dense, sans arrondi
 * marqué — l'unité visuelle de tous les écrans du RMS.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.title]        Affiche un en-tête si fourni
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.actions]
 * @param {React.ReactNode} [props.footer]
 * @param {boolean} [props.collapsible]
 * @param {boolean} [props.defaultCollapsed]
 * @param {boolean} [props.loading]              Affiche une barre de progression
 * @param {boolean} [props.dense]
 * @param {boolean} [props.scroll]
 * @param {boolean} [props.animate]              Apparition en fondu/glissement
 * @param {number}  [props.delay]                Décalage d'apparition (s)
 * @param {object}  [props.sx]
 * @param {React.ReactNode} props.children
 */
export default function Panel({
  title,
  icon,
  subtitle,
  actions,
  footer,
  collapsible = false,
  defaultCollapsed = false,
  loading = false,
  dense = false,
  scroll = false,
  animate = true,
  delay = 0,
  sx,
  children,
  ...rest
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const content = (
    <>
      {title && (
        <PanelHeader
          icon={icon}
          title={title}
          subtitle={subtitle}
          actions={actions}
          collapsible={collapsible}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
      )}

      {loading && <LinearProgress sx={{ flexShrink: 0 }} />}

      {collapsible ? (
        <Collapse in={!collapsed} timeout={180} sx={{ minHeight: 0 }}>
          <PanelBody dense={dense} scroll={scroll}>
            {children}
          </PanelBody>
        </Collapse>
      ) : (
        <PanelBody dense={dense} scroll={scroll}>
          {children}
        </PanelBody>
      )}

      {footer && <PanelFooter>{footer}</PanelFooter>}
    </>
  );

  const frameSx = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '3px',
    bgcolor: 'background.paper',
    boxShadow: 'var(--shadow-panel)',
    overflow: 'hidden',
    ...sx,
  };

  if (!animate) {
    return (
      <Box sx={frameSx} {...rest}>
        {content}
      </Box>
    );
  }

  return (
    <Box
      component={motion.section}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTiming.base, delay, ease: motionTiming.easeOut }}
      sx={frameSx}
      {...rest}
    >
      {content}
    </Box>
  );
}
