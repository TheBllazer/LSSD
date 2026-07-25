import { Box, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { motionTiming } from '@/styles/theme';

/**
 * Cadre commun à tous les écrans de module (registres, carte, administration).
 *
 * Structure : en-tête fixe (icône, titre, compteur, actions) → barre d'outils
 * optionnelle → zone de contenu qui possède son propre défilement.
 *
 * @param {object} props
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.subtitle]
 * @param {number|string} [props.count]        Compteur affiché à côté du titre
 * @param {React.ReactNode} [props.actions]    Boutons d'action principaux
 * @param {React.ReactNode} [props.toolbar]    Barre de filtres/outils
 * @param {boolean} [props.scroll=true]        Défilement interne du contenu
 * @param {boolean} [props.padded=true]
 * @param {React.ReactNode} props.children
 */
export default function ModuleLayout({
  title,
  icon,
  subtitle,
  count,
  actions,
  toolbar,
  scroll = true,
  padded = true,
  children,
}) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          height: 'var(--header-h)',
          flexShrink: 0,
          px: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'var(--navy-850)',
        }}
      >
        {icon && (
          <Box sx={{ display: 'flex', fontSize: 20, color: 'primary.main' }}>{icon}</Box>
        )}

        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
            }}
            noWrap
          >
            {title}
          </Typography>

          {count !== undefined && count !== null && (
            <Typography
              className="mono"
              sx={{
                fontSize: 11,
                color: 'primary.main',
                border: '1px solid',
                borderColor: 'primary.dark',
                borderRadius: '3px',
                px: 0.75,
                bgcolor: 'rgba(45,125,210,0.10)',
              }}
            >
              {count}
            </Typography>
          )}

          {subtitle && (
            <Typography variant="caption" noWrap>
              {subtitle}
            </Typography>
          )}
        </Stack>

        <Box sx={{ flex: 1 }} />

        {actions && (
          <Stack direction="row" spacing={1} alignItems="center">
            {actions}
          </Stack>
        )}
      </Stack>

      {toolbar}

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTiming.base, ease: motionTiming.easeOut }}
        className={scroll ? 'scroll-compact' : undefined}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: scroll ? 'auto' : 'hidden',
          p: padded ? 1.75 : 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
