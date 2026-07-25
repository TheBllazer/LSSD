import { Box, Stack, Typography, Tooltip } from '@mui/material';
import {
  MdSpaceDashboard,
  MdCheckCircle,
  MdCancel,
  MdInfoOutline,
  MdShield,
  MdGroups,
} from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import { Panel, KeyValueRow, StatusChip, KbdCombo } from '@/components/system';
import Avatar from '@/components/media/Avatar';
import useAuth from '@/hooks/auth/useAuth';
import useOnlineAgents from '@/hooks/data/useOnlineAgents';
import { env, isFirebaseConfigured } from '@/app/config/env';
import { ALL_NAV } from '@/app/config/navigation';
import { formatDateTime, formatRelative } from '@/utils/dates';
import { formatBadge, agentSignature } from '@/utils/format';
import {
  ROLE_LABELS,
  ALL_PERMISSIONS,
  hasAbility,
  diffFromRole,
} from '@/utils/permissions';
import { DIVISION_LABELS, RANK_LABELS } from '@/types/agents';

/**
 * Modules effectivement livrés.
 * Mis à jour à chaque phase — voir `docs/06-ROADMAP.md`.
 */
const DELIVERED_MODULES = new Set(['dashboard', 'citizens']);

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
 * Il rend compte de l'état réel de la session : identité de service,
 * habilitations effectives, agents connectés, état du terminal. Les indicateurs
 * métier — compteurs de fiches, graphiques d'activité, derniers rapports — sont
 * branchés en phase 10, une fois les registres alimentés.
 */
export default function DashboardPage() {
  const { agent, role, abilities } = useAuth();
  const { agents: onlineAgents, count: onlineCount } = useOnlineAgents();
  const configured = isFirebaseConfigured();
  const { granted, revoked } = diffFromRole(role, abilities);

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
        {/* Identité de service */}
        <Panel title="Ma session" icon={<MdShield />} delay={0}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }} alignItems="center">
            <Avatar person={agent} size={56} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }} noWrap>
                {agentSignature(agent)}
              </Typography>
              <Typography variant="caption" noWrap>
                {agent?.email}
              </Typography>
            </Box>
          </Stack>

          <KeyValueRow label="Grade" value={RANK_LABELS[agent?.rank] ?? agent?.rank} />
          <KeyValueRow label="Habilitation" value={ROLE_LABELS[role] ?? role} />
          <KeyValueRow label="Matricule" value={formatBadge(agent?.badgeNumber)} mono />
          <KeyValueRow label="Indicatif" value={agent?.callsign} mono />
          <KeyValueRow
            label="Division"
            value={DIVISION_LABELS[agent?.division] ?? agent?.division}
          />
          <KeyValueRow label="Affectation" value={agent?.service} />
          <KeyValueRow
            label="Dernière connexion"
            value={
              agent?.lastLoginAt
                ? `${formatDateTime(agent.lastLoginAt)} (${formatRelative(agent.lastLoginAt)})`
                : 'Première connexion'
            }
          />
        </Panel>

        {/* Habilitations effectives */}
        <Panel title="Habilitations" icon={<MdShield />} delay={0.04}>
          <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1.25 }}>
            <Typography className="mono" sx={{ fontSize: 22, color: 'primary.main' }}>
              {abilities.length}
            </Typography>
            <Typography variant="caption">
              permissions actives sur {ALL_PERMISSIONS.length}
            </Typography>
          </Stack>

          <Box
            sx={{
              height: 4,
              mb: 1.75,
              borderRadius: '2px',
              bgcolor: 'var(--navy-700)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${(abilities.length / ALL_PERMISSIONS.length) * 100}%`,
                height: '100%',
                bgcolor: 'primary.main',
                transition: 'width 400ms ease',
              }}
            />
          </Box>

          <KeyValueRow
            label="Héritées du rôle"
            value={`${abilities.length - granted.length} permission(s)`}
          />
          <KeyValueRow
            label="Accordées en plus"
            value={granted.length ? granted.join(', ') : 'Aucune'}
            mono={granted.length > 0}
          />
          <KeyValueRow
            label="Retirées"
            value={revoked.length ? revoked.join(', ') : 'Aucune'}
            mono={revoked.length > 0}
          />
        </Panel>

        {/* Agents connectés */}
        <Panel
          title="Agents connectés"
          icon={<MdGroups />}
          subtitle={`${onlineCount} en service`}
          delay={0.08}
        >
          {onlineCount === 0 ? (
            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
              Aucun autre terminal actif pour le moment.
            </Typography>
          ) : (
            <Stack spacing={0.25}>
              {onlineAgents.map((online) => (
                <Stack
                  key={online.uid}
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
                  <Avatar person={online} size={24} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12 }} noWrap>
                      {agentSignature(online)}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>
                      {DIVISION_LABELS[online.division] ?? online.division ?? '—'}
                      {online.callsign ? ` · ${online.callsign}` : ''}
                    </Typography>
                  </Box>
                  <StatusChip status="ACTIVE" label="EN LIGNE" />
                </Stack>
              ))}
            </Stack>
          )}
        </Panel>

        {/* Accès aux modules */}
        <Panel title="Modules" icon={<MdSpaceDashboard />} delay={0.12}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            Les modules verrouillés ne sont pas accessibles avec votre habilitation.
          </Typography>

          <Stack spacing={0.25}>
            {ALL_NAV.map((item) => {
              const Icon = item.icon;
              const permitted = !item.permission || hasAbility(abilities, item.permission);
              const delivered = DELIVERED_MODULES.has(item.id);

              return (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    py: 0.5,
                    opacity: permitted ? 1 : 0.45,
                    borderBottom: '1px dashed',
                    borderColor: 'var(--line-soft)',
                    '&:last-of-type': { borderBottom: 'none' },
                  }}
                >
                  <Box sx={{ display: 'flex', color: 'text.secondary', fontSize: 15 }}>
                    <Icon />
                  </Box>
                  <Typography sx={{ fontSize: 12.5, flex: 1 }}>{item.label}</Typography>

                  {!permitted ? (
                    <Tooltip title={`Permission requise : ${item.permission}`}>
                      <span>
                        <StatusChip status="REJECTED" label="NON HABILITÉ" />
                      </span>
                    </Tooltip>
                  ) : (
                    <StatusChip
                      status={delivered ? 'ACTIVE' : 'DRAFT'}
                      label={delivered ? 'DISPONIBLE' : 'À VENIR'}
                    />
                  )}

                  {item.shortcut && permitted && <KbdCombo combo={`Ctrl+${item.shortcut}`} />}
                </Stack>
              );
            })}
          </Stack>
        </Panel>

        {/* État technique */}
        <Panel title="État du terminal" icon={<MdInfoOutline />} delay={0.16}>
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
          <KeyValueRow label="Ouverture de session" value={formatDateTime(new Date())} mono />
        </Panel>

        {/* Raccourcis */}
        <Panel title="Raccourcis clavier" delay={0.2}>
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
