import { Box, Stack, Typography } from '@mui/material';
import {
  MdSpaceDashboard,
  MdCheckCircle,
  MdCancel,
  MdInfoOutline,
} from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import { Panel, KeyValueRow, StatusChip, KbdCombo } from '@/components/system';
import { env, isFirebaseConfigured } from '@/app/config/env';
import { ALL_NAV } from '@/app/config/navigation';
import { formatDateTime } from '@/utils/dates';

/**
 * Ligne d'état d'un sous-système, avec pastille de validité.
 * @param {{ label: string, ok: boolean, value: React.ReactNode }} props
 */
function SystemRow({ label, ok, value }) {
  return (
    <KeyValueRow
      label={label}
      value={
        <Stack direction="row" spacing={0.75} alignItems="center">
          {ok ? (
            <MdCheckCircle size={13} color="var(--ok)" />
          ) : (
            <MdCancel size={13} color="var(--danger)" />
          )}
          <Box component="span" className="mono" sx={{ fontSize: 12 }}>
            {value}
          </Box>
        </Stack>
      }
    />
  );
}

/**
 * Tableau de bord.
 *
 * En phase 0, il rend compte de l'état réel du terminal (configuration,
 * connexion Firebase, version, mode d'exécution). Les indicateurs métier —
 * compteurs, graphiques, agents connectés, activité récente — sont branchés en
 * phase 10, une fois les registres et le journal d'audit alimentés.
 */
export default function DashboardPage() {
  const configured = isFirebaseConfigured();

  return (
    <ModuleLayout
      title="Tableau de bord opérationnel"
      icon={<MdSpaceDashboard />}
      subtitle={env.app.agency}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 1.75,
          alignItems: 'start',
        }}
      >
        <Panel title="État du terminal" icon={<MdInfoOutline />} delay={0}>
          <SystemRow
            label="Configuration"
            ok={configured}
            value={configured ? 'Complète' : 'Incomplète'}
          />
          <SystemRow
            label="Projet Firebase"
            ok={Boolean(env.firebase.projectId)}
            value={env.firebase.projectId || '—'}
          />
          <SystemRow
            label="Mode"
            ok
            value={env.useEmulators ? 'Émulateurs locaux' : env.mode}
          />
          <KeyValueRow label="Version" value={env.app.version} mono />
          <KeyValueRow label="Chemin de base" value={env.basePath} mono />
          <KeyValueRow label="Session ouverte" value={formatDateTime(new Date())} mono />
        </Panel>

        <Panel title="Modules" icon={<MdSpaceDashboard />} delay={0.04}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            Chaque module est accessible par la barre latérale ou son raccourci.
          </Typography>

          <Stack spacing={0.25}>
            {ALL_NAV.map((item) => {
              const Icon = item.icon;
              const delivered = item.id === 'dashboard';
              return (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    py: 0.5,
                    borderBottom: '1px dashed',
                    borderColor: 'var(--line-soft)',
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ display: 'flex', color: 'text.secondary', fontSize: 15 }}>
                    <Icon />
                  </Box>
                  <Typography sx={{ fontSize: 12.5, flex: 1 }}>{item.label}</Typography>
                  <StatusChip
                    status={delivered ? 'ACTIVE' : 'DRAFT'}
                    label={delivered ? 'DISPONIBLE' : 'À VENIR'}
                  />
                  {item.shortcut && <KbdCombo combo={`Ctrl+${item.shortcut}`} />}
                </Stack>
              );
            })}
          </Stack>
        </Panel>

        <Panel title="Raccourcis clavier" delay={0.08}>
          <Stack spacing={0.75}>
            {[
              ['Ctrl+B', 'Replier / déplier la barre latérale'],
              ['Ctrl+1…9', 'Accès direct à un module'],
              ['Ctrl+K', 'Recherche globale (phase 10)'],
              ['Ctrl+S', 'Enregistrer la fiche courante (phase 3)'],
            ].map(([combo, description]) => (
              <Stack key={combo} direction="row" alignItems="center" spacing={1.25}>
                <Box sx={{ width: 92, flexShrink: 0 }}>
                  <KbdCombo combo={combo} />
                </Box>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {description}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Panel>
      </Box>
    </ModuleLayout>
  );
}
