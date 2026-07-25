import { Box, Typography } from '@mui/material';
import { env } from '@/app/config/env';

/**
 * Cadre plein écran des pages non authentifiées (connexion, compte non
 * provisionné, compte désactivé).
 *
 * Fond sombre à grille technique et halo central : l'écran doit évoquer un
 * terminal de service, pas une page d'accueil de site web.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function AuthLayout({ children }) {
  return (
    <Box
      className="tech-grid"
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'var(--navy-950)',
        overflow: 'hidden',
      }}
    >
      {/* Halo central discret */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(45,125,210,0.10), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Liseré supérieur aux couleurs du service */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background:
            'linear-gradient(90deg, transparent, var(--gold) 20%, var(--accent) 50%, var(--gold) 80%, transparent)',
          opacity: 0.55,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>

      <Typography
        sx={{
          position: 'absolute',
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10,
          letterSpacing: '0.16em',
          color: 'text.disabled',
          textTransform: 'uppercase',
        }}
      >
        {env.app.agency} · Terminal LSSD-WEB · v{env.app.version}
      </Typography>
    </Box>
  );
}
