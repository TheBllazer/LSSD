import { useMemo, useState } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { MdHistory, MdCircle } from 'react-icons/md';
import EmptyState from '@/components/data/EmptyState';
import TableSkeleton from '@/components/data/TableSkeleton';
import { formatDateTime, formatRelative } from '@/utils/dates';
import { CITIZEN_EVENT_LABELS } from '@/types/citizens';

/** Couleur de la pastille selon la nature de l'événement. */
const EVENT_TONES = {
  CREATED: 'var(--ok)',
  UPDATED: 'var(--accent)',
  ARCHIVED: 'var(--danger)',
  RESTORED: 'var(--ok)',
  ARREST: 'var(--danger)',
  CITATION: 'var(--warn)',
  STATUS_CHANGED: 'var(--warn)',
};

/**
 * Onglet « Historique ».
 *
 * Chronologie verticale alimentée automatiquement par tous les modules : une
 * modification de fiche, un véhicule rattaché, une arrestation, un rapport lié.
 * C'est la mémoire du dossier, et elle n'est jamais modifiable — les règles
 * Firestore interdisent la réécriture d'un événement.
 *
 * @param {object} props
 * @param {object[]} props.events
 * @param {boolean} props.loading
 */
export default function HistoryTab({ events = [], loading }) {
  const [type, setType] = useState('');

  const types = useMemo(
    () => [...new Set(events.map((event) => event.type))].sort(),
    [events],
  );

  const filtered = useMemo(
    () => (type ? events.filter((event) => event.type === type) : events),
    [events, type],
  );

  if (loading) return <TableSkeleton rows={8} />;

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<MdHistory />}
        title="Aucun événement"
        message="L'historique se remplit automatiquement à chaque action portée sur cette fiche."
      />
    );
  }

  return (
    <>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          select
          label="Type d'événement"
          value={type}
          onChange={(event) => setType(event.target.value)}
          sx={{ width: 240 }}
        >
          <MenuItem value="">Tous les événements</MenuItem>
          {types.map((value) => (
            <MenuItem key={value} value={value}>
              {CITIZEN_EVENT_LABELS[value] ?? value}
            </MenuItem>
          ))}
        </TextField>

        <Typography variant="caption">
          {filtered.length} événement{filtered.length > 1 ? 's' : ''}
        </Typography>
      </Stack>

      <Box sx={{ position: 'relative', pl: 2 }}>
        {/* Filin vertical de la chronologie */}
        <Box
          sx={{
            position: 'absolute',
            left: 5,
            top: 6,
            bottom: 6,
            width: 1,
            bgcolor: 'var(--line)',
          }}
        />

        {filtered.map((event) => (
          <Stack
            key={event.id}
            direction="row"
            spacing={1.5}
            sx={{ position: 'relative', pb: 2 }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: -16,
                top: 3,
                display: 'flex',
                color: EVENT_TONES[event.type] ?? 'var(--muted-dim)',
              }}
            >
              <MdCircle size={9} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                  {CITIZEN_EVENT_LABELS[event.type] ?? event.type}
                </Typography>
                <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                  {formatDateTime(event.at)}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                  · {formatRelative(event.at)}
                </Typography>
              </Stack>

              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {event.label}
              </Typography>

              {/* Détail des champs modifiés, quand l'événement en porte. */}
              {event.meta?.changes?.length > 0 && (
                <Box
                  sx={{
                    mt: 0.625,
                    p: 0.875,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '3px',
                    bgcolor: 'var(--navy-850)',
                  }}
                >
                  {event.meta.changes.slice(0, 6).map((change) => (
                    <Stack
                      key={change.field}
                      direction="row"
                      spacing={0.75}
                      sx={{ fontSize: 11 }}
                    >
                      <Box className="label-caps" sx={{ minWidth: 120 }}>
                        {change.field}
                      </Box>
                      <Box sx={{ color: 'text.disabled', textDecoration: 'line-through' }}>
                        {formatValue(change.from)}
                      </Box>
                      <Box sx={{ color: 'primary.main' }}>→ {formatValue(change.to)}</Box>
                    </Stack>
                  ))}
                  {event.meta.changes.length > 6 && (
                    <Typography sx={{ fontSize: 10.5, color: 'text.disabled', mt: 0.5 }}>
                      et {event.meta.changes.length - 6} autre(s) champ(s)
                    </Typography>
                  )}
                </Box>
              )}

              <Typography sx={{ fontSize: 10.5, color: 'text.disabled', mt: 0.375 }}>
                par {event.byName ?? 'Système'}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>
    </>
  );
}

/**
 * Rend une valeur de diff lisible sur une ligne.
 * @param {unknown} value
 * @returns {string}
 */
function formatValue(value) {
  if (value === null || value === undefined || value === '') return '∅';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '∅';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
