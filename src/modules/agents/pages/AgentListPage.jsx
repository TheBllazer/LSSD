import { useMemo, useState } from 'react';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { MdLocalPolice, MdPersonAdd, MdCircle, MdSearch } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import Panel from '@/components/system/Panel';
import StatusChip from '@/components/system/StatusChip';
import Avatar from '@/components/media/Avatar';
import EmptyState from '@/components/data/EmptyState';
import TableSkeleton from '@/components/data/TableSkeleton';
import Can from '@/components/auth/Can';
import AgentCreateDialog from '../components/AgentCreateDialog';
import { useAgents } from '@/hooks/data/useAgents';
import useOnlineAgents from '@/hooks/data/useOnlineAgents';
import useDebounce from '@/hooks/ui/useDebounce';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import { matchesQuery } from '@/utils/tokens';
import { agentSignature, formatBadge } from '@/utils/format';
import { formatRelative } from '@/utils/dates';
import { PERMISSIONS, ROLE_LABELS } from '@/utils/permissions';
import { ENTITY_TYPES } from '@/app/config/constants';
import {
  RANK_ABBR,
  RANK_LABELS,
  DIVISION_LABELS,
  AGENT_STATUS_LABELS,
} from '@/types/agents';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Annuaire du personnel.
 *
 * Présenté en cartes plutôt qu'en tableau : sur ce module, ce qu'un agent
 * cherche c'est un visage, un indicatif et une disponibilité — pas une ligne
 * de données à trier.
 */
export default function AgentListPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', division: '' });
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebounce(search);
  const openRecord = useOpenRecord();

  const { data: agents = [], isLoading, error } = useAgents(filters);
  const { agents: online } = useOnlineAgents();

  const onlineUids = useMemo(
    () => new Set(online.map((entry) => entry.uid)),
    [online],
  );

  const rows = useMemo(() => {
    if (!debouncedSearch) return agents;
    return agents.filter((agent) =>
      matchesQuery(debouncedSearch, [
        agent.firstName,
        agent.lastName,
        agent.badgeNumber,
        agent.callsign,
        agent.email,
      ]),
    );
  }, [agents, debouncedSearch]);

  return (
    <ModuleLayout
      title="Annuaire du personnel"
      icon={<MdLocalPolice />}
      count={rows.length}
      subtitle={`${onlineUids.size} en service`}
      actions={
        <Can do={PERMISSIONS.AGENTS_CREATE}>
          <Button
            variant="contained"
            startIcon={<MdPersonAdd />}
            onClick={() => setCreateOpen(true)}
          >
            Créer un compte
          </Button>
        </Can>
      }
      toolbar={
        <Stack
          direction="row"
          spacing={1}
          sx={{
            px: 1.25,
            py: 0.875,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'var(--navy-800)',
          }}
        >
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, matricule, indicatif…"
            sx={{ width: 300 }}
            slotProps={{
              input: {
                startAdornment: <MdSearch size={15} style={{ marginRight: 6 }} />,
              },
            }}
          />

          <TextField
            select
            label="Statut"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
            sx={{ width: 165 }}
          >
            <MenuItem value="">Tous</MenuItem>
            {toOptions(AGENT_STATUS_LABELS).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Division"
            value={filters.division}
            onChange={(event) =>
              setFilters((current) => ({ ...current, division: event.target.value }))
            }
            sx={{ width: 185 }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {toOptions(DIVISION_LABELS).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      }
    >
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <EmptyState icon={<MdLocalPolice />} title="Annuaire indisponible" message={error.message} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<MdLocalPolice />}
          title="Aucun agent"
          message="Aucun compte ne correspond aux critères actuels."
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(268px, 1fr))',
            gap: 1.5,
          }}
        >
          {rows.map((agent) => {
            const isOnline = onlineUids.has(agent.uid);
            return (
              <Panel
                key={agent.uid}
                title={RANK_ABBR[agent.rank] ?? agent.rank}
                subtitle={agent.callsign ?? ''}
                dense
                sx={{ cursor: 'pointer' }}
                onClick={() =>
                  openRecord({
                    type: ENTITY_TYPES.AGENT,
                    id: agent.uid,
                    title: agentSignature(agent),
                    subtitle: RANK_LABELS[agent.rank],
                  })
                }
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar person={agent} size={52} />

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }} noWrap>
                      {agent.lastName?.toUpperCase()}, {agent.firstName}
                    </Typography>
                    <Typography className="mono" sx={{ fontSize: 11, color: 'text.secondary' }}>
                      #{formatBadge(agent.badgeNumber)}
                    </Typography>
                    <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }} noWrap>
                      {DIVISION_LABELS[agent.division] ?? agent.division}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mt: 1.25, pt: 1, borderTop: '1px solid', borderColor: 'var(--line-soft)' }}
                >
                  <MdCircle size={8} color={isOnline ? 'var(--ok)' : 'var(--muted-dim)'} />
                  <Typography sx={{ fontSize: 10.5, color: isOnline ? 'success.main' : 'text.disabled' }}>
                    {isOnline
                      ? 'En ligne'
                      : agent.lastLoginAt
                        ? formatRelative(agent.lastLoginAt)
                        : 'Jamais connecté'}
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  <StatusChip
                    status={agent.status}
                    label={AGENT_STATUS_LABELS[agent.status] ?? agent.status}
                  />
                </Stack>

                <Typography
                  sx={{ fontSize: 10, color: 'secondary.main', mt: 0.75, letterSpacing: '0.06em' }}
                >
                  {ROLE_LABELS[agent.role] ?? agent.role}
                </Typography>
              </Panel>
            );
          })}
        </Box>
      )}

      <AgentCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </ModuleLayout>
  );
}
