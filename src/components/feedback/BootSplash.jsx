import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { env } from '@/app/config/env';

/**
 * Écran d'amorçage affiché pendant l'hydratation de la session Firebase.
 * Reprend visuellement le splash HTML de `index.html` : aucune rupture visuelle
 * entre le chargement du bundle et le démarrage de React.
 *
 * @param {{ message?: string }} props
 */
export default function BootSplash({ message = 'Initialisation du terminal' }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="tech-grid"
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2.5,
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="img"
        src={`${env.basePath}brand/lssd-star.svg`}
        alt=""
        sx={{ width: 72, height: 72, opacity: 0.9 }}
      />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.primary' }}>
          {env.app.agency}
        </Typography>
        <Typography variant="caption" sx={{ letterSpacing: '0.22em' }}>
          RECORDS MANAGEMENT SYSTEM
        </Typography>
      </Box>

      <Box sx={{ width: 240 }}>
        <LinearProgress />
      </Box>

      <Typography
        variant="caption"
        sx={{ letterSpacing: '0.18em', textTransform: 'uppercase' }}
      >
        {message}
      </Typography>
    </Box>
  );
}
