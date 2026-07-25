import { Box, Typography, Stack } from '@mui/material';
import { MdWarningAmber } from 'react-icons/md';
import { getMissingFirebaseKeys } from '@/app/config/env';

/**
 * Écran affiché lorsque la configuration Firebase est absente ou incomplète.
 * Il remplace intégralement l'application : sans backend, rien ne peut
 * fonctionner et un message explicite vaut mieux qu'une cascade d'erreurs.
 */
export default function ConfigurationError() {
  const missing = getMissingFirebaseKeys();

  return (
    <Box
      className="tech-grid"
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <Box
        sx={{
          maxWidth: 620,
          border: '1px solid',
          borderColor: 'warning.main',
          bgcolor: 'background.paper',
          borderRadius: '4px',
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            px: 1.75,
            py: 1.25,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(214,137,16,0.12)',
          }}
        >
          <MdWarningAmber size={18} color="#D68910" />
          <Typography variant="h6" sx={{ color: 'warning.main' }}>
            Configuration requise
          </Typography>
        </Stack>

        <Box sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Le terminal n'est pas relié à un projet Firebase. Copiez le fichier{' '}
            <code className="mono">.env.example</code> vers{' '}
            <code className="mono">.env.local</code> à la racine du projet, puis
            renseignez les valeurs fournies par la console Firebase
            (Paramètres du projet → Vos applications → Web).
          </Typography>

          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            Variables manquantes
          </Typography>

          <Box
            className="mono selectable"
            sx={{
              mt: 0.5,
              p: 1.25,
              fontSize: 12,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '3px',
              color: 'warning.main',
            }}
          >
            {missing.map((key) => (
              <div key={key}>
                VITE_FIREBASE_{key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}
              </div>
            ))}
          </Box>

          <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>
            Redémarrez le serveur de développement après modification
            (<code className="mono">npm run dev</code>).
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
