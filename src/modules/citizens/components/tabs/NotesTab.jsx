import { useState } from 'react';
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { MdPushPin, MdOutlinePushPin, MdDelete, MdNoteAdd } from 'react-icons/md';
import Panel from '@/components/system/Panel';
import EmptyState from '@/components/data/EmptyState';
import TableSkeleton from '@/components/data/TableSkeleton';
import { formatDateTime, formatRelative } from '@/utils/dates';

/**
 * Onglet « Notes ».
 *
 * Notes internes du service, horodatées et signées. Elles ne font pas partie
 * du dossier officiel : elles servent à transmettre une information
 * opérationnelle entre agents (« se présente toujours accompagné »,
 * « chien agressif à l'adresse »). Les notes épinglées remontent en tête.
 *
 * @param {object} props
 * @param {object[]} props.notes
 * @param {boolean} props.loading
 * @param {string|null} props.currentUid
 * @param {number} props.level  Niveau hiérarchique, pour la suppression
 * @param {(body: string) => void} props.onAdd
 * @param {(noteId: string, pinned: boolean) => void} props.onTogglePin
 * @param {(noteId: string) => void} props.onRemove
 * @param {boolean} props.readOnly
 */
export default function NotesTab({
  notes = [],
  loading,
  currentUid,
  level = 0,
  onAdd,
  onTogglePin,
  onRemove,
  readOnly,
}) {
  const [body, setBody] = useState('');

  const submit = () => {
    const trimmed = body.trim();
    if (trimmed.length < 3) return;
    onAdd(trimmed);
    setBody('');
  };

  return (
    <>
      {!readOnly && (
        <Panel title="Nouvelle note" icon={<MdNoteAdd />} sx={{ mb: 2 }}>
          <TextField
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Information opérationnelle utile aux agents…"
            multiline
            minRows={2}
            sx={{ mb: 1 }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption">
              Signée de votre matricule et horodatée. Visible par tous les agents.
            </Typography>
            <Button
              variant="contained"
              onClick={submit}
              disabled={body.trim().length < 3}
              startIcon={<MdNoteAdd />}
            >
              Ajouter
            </Button>
          </Stack>
        </Panel>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : notes.length === 0 ? (
        <EmptyState
          title="Aucune note"
          message="Aucune information interne n'a été consignée sur cette fiche."
        />
      ) : (
        <Stack spacing={1.25}>
          {notes.map((note) => {
            // Un agent peut retirer sa propre note ; un gradé peut retirer
            // celle d'un tiers — même règle que côté Firestore.
            const canRemove = !readOnly && (note.authorUid === currentUid || level >= 60);

            return (
              <Box
                key={note.id}
                sx={{
                  p: 1.25,
                  border: '1px solid',
                  borderColor: note.pinned ? 'primary.dark' : 'divider',
                  borderLeft: '3px solid',
                  borderLeftColor: note.pinned ? 'primary.main' : 'var(--line)',
                  borderRadius: '3px',
                  bgcolor: note.pinned ? 'rgba(45,125,210,0.06)' : 'background.paper',
                }}
              >
                <Typography sx={{ fontSize: 12.5, whiteSpace: 'pre-wrap', mb: 0.75 }}>
                  {note.body}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>
                    {note.authorName}
                  </Typography>
                  <Typography className="mono" sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                    {formatDateTime(note.createdAt)}
                  </Typography>
                  <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                    · {formatRelative(note.createdAt)}
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  {!readOnly && (
                    <Tooltip title={note.pinned ? 'Désépingler' : 'Épingler en tête'}>
                      <IconButton
                        size="small"
                        onClick={() => onTogglePin(note.id, !note.pinned)}
                        sx={{ color: note.pinned ? 'primary.main' : undefined }}
                      >
                        {note.pinned ? (
                          <MdPushPin size={14} />
                        ) : (
                          <MdOutlinePushPin size={14} />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}

                  {canRemove && (
                    <Tooltip title="Supprimer la note">
                      <IconButton
                        size="small"
                        onClick={() => onRemove(note.id)}
                        sx={{ '&:hover': { color: 'error.main' } }}
                      >
                        <MdDelete size={14} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </>
  );
}
