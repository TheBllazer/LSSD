import { useMemo, useState } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { MdSettings, MdHistory, MdGavel, MdPlace, MdPictureAsPdf } from 'react-icons/md';
import ModuleLayout from '@/layouts/ModuleLayout';
import Panel from '@/components/system/Panel';
import KeyValueRow from '@/components/system/KeyValueRow';
import EmptyState from '@/components/data/EmptyState';
import TableSkeleton from '@/components/data/TableSkeleton';
import { useAuditLog } from '@/hooks/data/useAgents';
import { useSettings } from '@/hooks/data/useSettings';
import useDebounce from '@/hooks/ui/useDebounce';
import { matchesQuery } from '@/utils/tokens';
import { formatDateTime } from '@/utils/dates';
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS } from '@/types/agents';

const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Administration.
 *
 * Deux fonctions : consulter le journal d'audit et vérifier les référentiels
 * chargés. Les référentiels sont affichés en lecture — leur édition passera
 * par une révision de `/settings/app`, qui n'a de sens qu'avec un jeu de
 * données réel à faire évoluer.
 */
export default function AdminPage() {
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: entries = [], isLoading, error } = useAuditLog(
    action ? { action, max: 200 } : { max: 200 },
  );
  const { data: settings } = useSettings();

  const rows = useMemo(() => {
    if (!debouncedSearch) return entries;
    return entries.filter((entry) =>
      matchesQuery(debouncedSearch, [
        entry.actorName,
        entry.entityLabel,
        entry.entityType,
        entry.action,
      ]),
    );
  }, [entries, debouncedSearch]);

  return (
    <ModuleLayout
      title="Administration"
      icon={<MdSettings />}
      count={rows.length}
      subtitle="Journal d'audit et référentiels"
    >
      <Stack spacing={1.75}>
        <Panel
          title="Journal d'audit"
          icon={<MdHistory />}
          subtitle="200 dernières entrées"
          actions={
            <Stack direction="row" spacing={1}>
              <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Agent, entité…"
                sx={{ width: 220 }}
              />
              <TextField
                select
                value={action}
                onChange={(event) => setAction(event.target.value)}
                sx={{ width: 190 }}
              >
                <MenuItem value="">Toutes les actions</MenuItem>
                {toOptions(AUDIT_ACTION_LABELS)
                  .filter((option) => Object.values(AUDIT_ACTIONS).includes(option.value))
                  .map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
              </TextField>
            </Stack>
          }
        >
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : error ? (
            <EmptyState title="Journal inaccessible" message={error.message} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<MdHistory />}
              title="Aucune entrée"
              message="Aucune action ne correspond aux critères actuels."
            />
          ) : (
            <Box sx={{ maxHeight: 460, overflow: 'auto' }} className="scroll-compact">
              {rows.map((entry) => (
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
                  <Typography
                    className="mono"
                    sx={{ fontSize: 10.5, color: 'text.disabled', width: 118, flexShrink: 0 }}
                  >
                    {formatDateTime(entry.at)}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, width: 140, flexShrink: 0 }}>
                    {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11.5, width: 170, flexShrink: 0, color: 'primary.main' }}
                    noWrap
                  >
                    {entry.actorName}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, flex: 1, color: 'text.secondary' }} noWrap>
                    {entry.entityLabel ?? entry.entityType ?? '—'}
                  </Typography>
                </Stack>
              ))}
            </Box>
          )}
        </Panel>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 1.75,
            alignItems: 'start',
          }}
        >
          <Panel title="Codes pénaux" icon={<MdGavel />} dense>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              {(settings?.chargeCodes ?? []).length} codes chargés, proposés à la saisie
              des casiers et des rapports.
            </Typography>
            <Box sx={{ maxHeight: 240, overflow: 'auto' }} className="scroll-compact">
              {(settings?.chargeCodes ?? []).map((charge) => (
                <Stack key={charge.code} direction="row" spacing={1} sx={{ py: 0.25 }}>
                  <Typography className="mono" sx={{ fontSize: 11, width: 78, flexShrink: 0 }}>
                    {charge.code}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, flex: 1 }} noWrap>
                    {charge.label}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Panel>

          <Panel title="Districts" icon={<MdPlace />} dense>
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              {(settings?.districts ?? []).length} districts du comté.
            </Typography>
            <Typography sx={{ fontSize: 11.5, lineHeight: 1.9 }}>
              {(settings?.districts ?? []).join(' · ')}
            </Typography>
          </Panel>

          <Panel title="Documents officiels" icon={<MdPictureAsPdf />} dense>
            <KeyValueRow label="Agence" labelWidth={100} value={settings?.agency} />
            <KeyValueRow label="Sigle" labelWidth={100} value={settings?.abbreviation} />
            <KeyValueRow label="En-tête" labelWidth={100} value={settings?.pdf?.headerTitle} />
            <KeyValueRow label="Sous-titre" labelWidth={100} value={settings?.pdf?.headerSubtitle} />
            <KeyValueRow label="Mention" labelWidth={100} value={settings?.pdf?.footerNotice} />
          </Panel>
        </Box>
      </Stack>
    </ModuleLayout>
  );
}
