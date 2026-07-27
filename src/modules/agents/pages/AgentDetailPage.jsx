import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, Typography } from '@mui/material';
import {
  MdBadge,
  MdShield,
  MdHistory,
  MdArrowBack,
  MdBlock,
  MdCheckCircle,
  MdLockReset,
  MdVpnKey,
} from 'react-icons/md';
import RecordLayout from '@/layouts/RecordLayout';
import Avatar from '@/components/media/Avatar';
import StatusChip from '@/components/system/StatusChip';
import Panel from '@/components/system/Panel';
import KeyValueRow from '@/components/system/KeyValueRow';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import EmptyState from '@/components/data/EmptyState';
import TableSkeleton from '@/components/data/TableSkeleton';
import Can from '@/components/auth/Can';
import PermissionsMatrix from '../components/PermissionsMatrix';
import PasswordChangeDialog from '../components/PasswordChangeDialog';
import {
  useAgent,
  useAgentPermissions,
  useAgentActivity,
  useSavePermissions,
  useSetAccountDisabled,
  useSendPasswordReset,
} from '@/hooks/data/useAgents';
import useAuth from '@/hooks/auth/useAuth';
import useConfirm from '@/hooks/ui/useConfirm';
import usePermission from '@/hooks/auth/usePermission';
import { PERMISSIONS, ROLE_LABELS } from '@/utils/permissions';
import { ROUTES } from '@/app/config/constants';
import { agentSignature, formatBadge, formatPhone } from '@/utils/format';
import { formatDate, formatDateTime, formatRelative } from '@/utils/dates';
import {
  RANK_LABELS,
  DIVISION_LABELS,
  AGENT_STATUS_LABELS,
  AUDIT_ACTION_LABELS,
} from '@/types/agents';

/**
 * Fiche d'un agent.
 *
 * Trois onglets : le profil de service, la matrice d'habilitations et
 * l'activité journalisée. Les actions sensibles — suspension, réinitialisation
 * du mot de passe — sont regroupées en tête et demandent confirmation.
 */
export default function AgentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { user, role: myRole } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [passwordOpen, setPasswordOpen] = useState(false);

  const canManagePermissions = usePermission(PERMISSIONS.ADMIN_PERMISSIONS);

  const { data: agent, isLoading, error } = useAgent(id);
  const { data: permissions } = useAgentPermissions(id);
  const { data: activity = [], isLoading: activityLoading } = useAgentActivity(
    activeTab === 'activity' ? id : null,
  );

  const savePermissions = useSavePermissions();
  const setDisabled = useSetAccountDisabled();
  const sendReset = useSendPasswordReset();

  const isSelf = user?.uid === id;

  const tabs = useMemo(
    () => [
      { id: 'profile', label: 'Profil de service', icon: <MdBadge size={14} /> },
      { id: 'permissions', label: 'Habilitations', icon: <MdShield size={14} /> },
      { id: 'activity', label: 'Activité', icon: <MdHistory size={14} /> },
    ],
    [],
  );

  if (isLoading) return <ModuleSkeleton rows={6} />;

  if (error || !agent) {
    return (
      <Box sx={{ flex: 1, display: 'flex' }}>
        <EmptyState
          title={error ? 'Fiche inaccessible' : 'Agent introuvable'}
          message={error?.message ?? "Ce compte n'existe pas."}
          action={
            <Button
              variant="contained"
              startIcon={<MdArrowBack />}
              onClick={() => navigate(ROUTES.AGENTS)}
            >
              Retour à l'annuaire
            </Button>
          }
        />
      </Box>
    );
  }

  const disabled = Boolean(permissions?.disabled);

  const toggleAccount = async () => {
    const { confirmed, reason } = await confirm({
      title: disabled ? 'Réactiver le compte' : 'Suspendre le compte',
      message: disabled
        ? "L'agent pourra se reconnecter immédiatement."
        : 'La suspension prend effet immédiatement, y compris sur les sessions déjà ouvertes.',
      entityType: 'Agent',
      entityLabel: agentSignature(agent),
      danger: !disabled,
      requireReason: !disabled,
      confirmLabel: disabled ? 'Réactiver' : 'Suspendre',
    });
    if (!confirmed) return;

    setDisabled.mutate({
      uid: id,
      disabled: !disabled,
      permissions: permissions ?? { role: agent.role, grants: [], revokes: [] },
      reason,
    });
  };

  const resetPassword = async () => {
    const { confirmed } = await confirm({
      title: 'Réinitialiser le mot de passe',
      message:
        `Un courriel sera envoyé à ${agent.email}. Cela suppose que cette adresse ` +
        `corresponde à une boîte réelle et relevée par l'agent — ce qui n'est pas ` +
        `le cas des adresses de service fictives, où le message se perdra sans erreur.\n\n` +
        `Le mot de passe actuel reste valide tant qu'un nouveau n'est pas défini. ` +
        `Seul l'agent peut changer le sien depuis sa propre fiche ; le commandement ` +
        `ne peut le faire à sa place sans passer par la console Firebase.`,
      confirmLabel: 'Envoyer quand même',
    });
    if (confirmed) sendReset.mutate(agent.email);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
            <Panel title="Identité de service" icon={<MdBadge />}>
              <KeyValueRow label="Nom" value={agent.lastName?.toUpperCase()} />
              <KeyValueRow label="Prénom" value={agent.firstName} />
              <KeyValueRow label="Matricule" value={formatBadge(agent.badgeNumber)} mono />
              <KeyValueRow label="Indicatif" value={agent.callsign} mono />
              <KeyValueRow label="Grade" value={RANK_LABELS[agent.rank] ?? agent.rank} />
              <KeyValueRow
                label="Division"
                value={DIVISION_LABELS[agent.division] ?? agent.division}
              />
              <KeyValueRow label="Affectation" value={agent.service} />
            </Panel>

            <Panel title="Contact">
              <KeyValueRow label="Adresse e-mail" value={agent.email} mono />
              <KeyValueRow label="Téléphone" value={formatPhone(agent.phone)} mono />
            </Panel>

            <Panel title="Compte">
              <KeyValueRow
                label="Statut"
                value={AGENT_STATUS_LABELS[agent.status] ?? agent.status}
              />
              <KeyValueRow
                label="Habilitation"
                value={ROLE_LABELS[permissions?.role ?? agent.role] ?? agent.role}
              />
              <KeyValueRow
                label="Créé le"
                value={agent.createdAt ? formatDate(agent.createdAt) : null}
              />
              <KeyValueRow
                label="Dernière connexion"
                value={
                  agent.lastLoginAt
                    ? `${formatDateTime(agent.lastLoginAt)} (${formatRelative(agent.lastLoginAt)})`
                    : 'Jamais connecté'
                }
              />
              <KeyValueRow label="Connexions" value={agent.loginCount ?? 0} mono />
            </Panel>
          </Stack>
        );

      case 'permissions':
        return permissions ? (
          <PermissionsMatrix
            permissions={permissions}
            isSelf={isSelf}
            myRole={myRole}
            readOnly={!canManagePermissions}
            saving={savePermissions.isPending}
            onSave={(payload) =>
              savePermissions.mutate({
                uid: id,
                ...payload,
                disabled: permissions.disabled ?? false,
              })
            }
          />
        ) : (
          <EmptyState
            icon={<MdShield />}
            title="Compte non provisionné"
            message="Cet agent n'a pas de document d'habilitations : il ne peut accéder à aucun module."
          />
        );

      case 'activity':
        return activityLoading ? (
          <TableSkeleton rows={8} />
        ) : activity.length === 0 ? (
          <EmptyState
            icon={<MdHistory />}
            title="Aucune activité"
            message="Aucune action de cet agent n'a encore été journalisée."
          />
        ) : (
          <Panel title={`Journal d'activité (${activity.length})`} icon={<MdHistory />} dense>
            {activity.map((entry) => (
              <Stack
                key={entry.id}
                direction="row"
                spacing={1.25}
                alignItems="baseline"
                sx={{
                  py: 0.5,
                  borderBottom: '1px dashed',
                  borderColor: 'var(--line-soft)',
                  '&:last-of-type': { borderBottom: 'none' },
                }}
              >
                <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.disabled', width: 120 }}>
                  {formatDateTime(entry.at)}
                </Typography>
                <Typography sx={{ fontSize: 11.5, width: 150 }}>
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                </Typography>
                <Typography sx={{ fontSize: 11.5, flex: 1, color: 'text.secondary' }} noWrap>
                  {entry.entityLabel ?? entry.entityType ?? '—'}
                </Typography>
              </Stack>
            ))}
          </Panel>
        );

      default:
        return null;
    }
  };

  return (
    <RecordLayout
      photo={<Avatar person={agent} size={110} variant="rounded" />}
      title={agentSignature(agent)}
      subtitle={agent.email}
      badges={
        <Stack direction="row" spacing={0.75} alignItems="center">
          <StatusChip
            status={agent.status}
            label={AGENT_STATUS_LABELS[agent.status] ?? agent.status}
          />
          {disabled && <StatusChip status="REJECTED" label="COMPTE SUSPENDU" tone="danger" />}
        </Stack>
      }
      meta={
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {RANK_LABELS[agent.rank] ?? agent.rank} ·{' '}
          {DIVISION_LABELS[agent.division] ?? agent.division}
          {agent.callsign ? ` · ${agent.callsign}` : ''} ·{' '}
          {ROLE_LABELS[permissions?.role ?? agent.role]}
        </Typography>
      }
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={<MdArrowBack />}
            onClick={() => navigate(ROUTES.AGENTS)}
          >
            Annuaire
          </Button>

          {/*
            Un agent change son propre mot de passe ; sur la fiche d'un autre,
            le seul levier reste le courriel de réinitialisation — inopérant
            avec une adresse de service fictive, ce que la confirmation dit.
          */}
          {isSelf ? (
            <Button
              variant="outlined"
              startIcon={<MdVpnKey />}
              onClick={() => setPasswordOpen(true)}
            >
              Changer mon mot de passe
            </Button>
          ) : (
            <Can do={PERMISSIONS.AGENTS_UPDATE}>
              <Button variant="outlined" startIcon={<MdLockReset />} onClick={resetPassword}>
                Mot de passe
              </Button>
            </Can>
          )}

          {!isSelf && (
            <Can do={PERMISSIONS.ADMIN_PERMISSIONS}>
              <Button
                variant="outlined"
                color={disabled ? 'success' : 'error'}
                startIcon={disabled ? <MdCheckCircle /> : <MdBlock />}
                onClick={toggleAccount}
                disabled={setDisabled.isPending}
              >
                {disabled ? 'Réactiver' : 'Suspendre'}
              </Button>
            </Can>
          )}
        </>
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        <>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {isSelf ? 'Votre propre fiche' : `Compte géré par le commandement`}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.disabled' }}>
            {agent.uid}
          </Typography>
        </>
      }
    >
      {renderTab()}

      <PasswordChangeDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        email={agent.email}
      />
    </RecordLayout>
  );
}
