import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Box } from '@mui/material';

/**
 * Barre de progression réseau globale, collée sous la barre de navigation.
 *
 * Elle traduit visuellement l'activité serveur (chargement de registre,
 * enregistrement) comme le ferait un client lourd — sans jamais bloquer l'UI.
 */
export default function TopProgressBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;

  return (
    <AnimatePresence>
      {active && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 2,
            overflow: 'hidden',
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          <Box
            component={motion.div}
            initial={{ x: '-40%' }}
            animate={{ x: '140%' }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            sx={{
              width: '40%',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent, #2D7DD2 40%, #3D8FE5 60%, transparent)',
            }}
          />
        </Box>
      )}
    </AnimatePresence>
  );
}
