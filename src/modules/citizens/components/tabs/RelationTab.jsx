import { Box, Stack, Typography } from '@mui/material';
import { MdLink, MdSchedule } from 'react-icons/md';
import Panel from '@/components/system/Panel';

/**
 * Onglet de relation en attente de son module.
 *
 * Les registres véhicules, armes, rapports et casiers arrivent en phases 4 à 6.
 * Le contrat est déjà posé côté données : le compteur affiché ici provient du
 * champ `counters` de la fiche, alimenté par la factory CRUD dès qu'une
 * relation est créée. Le jour où le module existe, seule la liste remplace ce
 * panneau — ni le schéma ni la fiche ne bougent.
 *
 * @param {object} props
 * @param {string} props.title       Nom de la relation (« Véhicules »)
 * @param {number} props.phase       Phase de livraison
 * @param {number} [props.count=0]   Nombre d'éléments déjà rattachés
 * @param {React.ReactNode} [props.icon]
 * @param {string[]} [props.scope]   Ce que l'onglet affichera
 */
export default function RelationTab({ title, phase, count = 0, icon, scope = [] }) {
  return (
    <Box sx={{ maxWidth: 680 }}>
      <Panel title={title} icon={icon ?? <MdLink />}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.75 }}>
          <Box
            className="mono"
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: count > 0 ? 'primary.main' : 'text.disabled',
              border: '1px solid',
              borderColor: count > 0 ? 'primary.dark' : 'divider',
              borderRadius: '3px',
              bgcolor: count > 0 ? 'rgba(45,125,210,0.08)' : 'transparent',
            }}
          >
            {count}
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {count === 0
                ? `Aucun élément rattaché`
                : `${count} élément${count > 1 ? 's' : ''} rattaché${count > 1 ? 's' : ''}`}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
              <MdSchedule size={12} color="var(--warn)" />
              <Typography sx={{ fontSize: 11.5, color: 'warning.main' }}>
                Module livré en phase {phase}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Typography variant="caption" sx={{ display: 'block', mb: 1.25 }}>
          Le compteur ci-dessus est réel : il est tenu à jour par la couche de
          données dès qu'une relation est créée. Cet onglet affichera :
        </Typography>

        <Stack spacing={0.5}>
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
              <Typography sx={{ fontSize: 12 }}>{line}</Typography>
            </Stack>
          ))}
        </Stack>
      </Panel>
    </Box>
  );
}
