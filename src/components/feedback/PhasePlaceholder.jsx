import { Box, Stack, Typography, LinearProgress } from '@mui/material';
import { MdConstruction } from 'react-icons/md';
import { Panel } from '@/components/system';

/**
 * Marqueur explicite de module non encore livré.
 *
 * Le développement suit un plan par phases (`docs/06-ROADMAP.md`) : plutôt
 * qu'un écran vide ou une fausse interface remplie de données factices, chaque
 * module non livré annonce clairement son périmètre et sa phase.
 *
 * @param {object} props
 * @param {string} props.module   Nom du module
 * @param {number} props.phase    Numéro de phase du plan de développement
 * @param {string[]} props.scope  Fonctionnalités prévues
 */
export default function PhasePlaceholder({ module, phase, scope = [] }) {
  return (
    <Box sx={{ maxWidth: 720 }}>
      <Panel
        title={`Module ${module}`}
        icon={<MdConstruction />}
        subtitle={`Livraison prévue en phase ${phase}`}
      >
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Ce module n'est pas encore implémenté. Le socle applicatif (chrome,
          thème, routage, accès Firebase) est en place&nbsp;: le module viendra
          s'y brancher sans modification de l'architecture.
        </Typography>

        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography className="label-caps">Périmètre prévu</Typography>
          {scope.map((line) => (
            <Stack key={line} direction="row" spacing={1} alignItems="baseline">
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              />
              <Typography sx={{ fontSize: 12.5 }}>{line}</Typography>
            </Stack>
          ))}
        </Stack>

        <Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography className="label-caps">Avancement du plan</Typography>
            <Typography className="mono" sx={{ fontSize: 11, color: 'text.secondary' }}>
              PHASE {String(phase).padStart(2, '0')} / 10
            </Typography>
          </Stack>
          <LinearProgress variant="determinate" value={0} />
        </Box>
      </Panel>
    </Box>
  );
}
