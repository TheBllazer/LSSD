import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { motionTiming } from '@/styles/theme';

/**
 * Cadre commun à toutes les fiches (citoyen, véhicule, arme, rapport, casier).
 *
 * Trois zones fixes : un en-tête d'identité qui ne défile jamais, une barre
 * d'onglets, et une zone de contenu à deux colonnes — le détail à gauche, un
 * panneau de synthèse à droite. C'est la disposition des logiciels de dossier
 * américains : l'identité de la personne reste sous les yeux quel que soit
 * l'onglet consulté.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.photo]      Vignette d'identité
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} [props.badges]     Puces de statut et signalements
 * @param {React.ReactNode} [props.meta]       Lignes d'information de l'en-tête
 * @param {React.ReactNode} [props.actions]    Boutons d'action de la fiche
 * @param {{id: string, label: string, count?: number, icon?: React.ReactNode}[]} props.tabs
 * @param {string} props.activeTab
 * @param {(id: string) => void} props.onTabChange
 * @param {React.ReactNode} [props.sidePanel]  Colonne de droite
 * @param {React.ReactNode} [props.footer]     Bandeau bas (état d'enregistrement)
 * @param {React.ReactNode} props.children
 */
export default function RecordLayout({
  photo,
  title,
  subtitle,
  badges,
  meta,
  actions,
  tabs = [],
  activeTab,
  onTabChange,
  sidePanel,
  footer,
  children,
}) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* En-tête d'identité */}
      <Stack
        component={motion.header}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionTiming.base, ease: motionTiming.easeOut }}
        direction="row"
        spacing={2}
        sx={{
          p: 1.75,
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'var(--navy-850)',
        }}
      >
        {photo}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
              noWrap
            >
              {title}
            </Typography>
            {badges}
          </Stack>

          {subtitle && (
            <Typography
              className="mono"
              sx={{ fontSize: 11.5, color: 'text.secondary', mb: 0.75 }}
              noWrap
            >
              {subtitle}
            </Typography>
          )}

          {meta}
        </Box>

        {actions && (
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        )}
      </Stack>

      {/* Onglets */}
      <Box sx={{ flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', px: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => onTabChange(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              iconPosition="start"
              icon={tab.icon}
              label={
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count !== null && (
                    <Box
                      className="mono"
                      sx={{
                        px: 0.5,
                        fontSize: 10,
                        borderRadius: '2px',
                        bgcolor: 'var(--steel-600)',
                        color: 'text.secondary',
                      }}
                    >
                      {tab.count}
                    </Box>
                  )}
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Contenu */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box
          className="scroll-compact record-content"
          sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 1.75 }}
        >
          <Box
            component={motion.div}
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: motionTiming.fast, ease: motionTiming.easeOut }}
          >
            {children}
          </Box>
        </Box>

        {sidePanel && (
          <Box
            className="scroll-compact"
            sx={{
              width: 320,
              flexShrink: 0,
              overflow: 'auto',
              p: 1.5,
              borderLeft: '1px solid',
              borderColor: 'divider',
              bgcolor: 'var(--navy-850)',
            }}
          >
            {sidePanel}
          </Box>
        )}
      </Box>

      {footer && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            px: 1.75,
            height: 30,
            flexShrink: 0,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'var(--navy-850)',
          }}
        >
          {footer}
        </Stack>
      )}
    </Box>
  );
}
