import { useState } from 'react';
import { Box, Button, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import { MdAddAPhoto, MdDelete } from 'react-icons/md';
import Panel from '@/components/system/Panel';
import PhotoPreview from '@/components/media/PhotoPreview';
import Lightbox from '@/components/media/Lightbox';
import EmptyState from '@/components/data/EmptyState';
import { isAllowedImageUrl } from '@/utils/images';
import { formatDateTime } from '@/utils/dates';
import { PHOTO_CATEGORIES, PHOTO_CATEGORY_LABELS, toOptions } from '@/types/citizens';

/**
 * Onglet « Photographies ».
 *
 * Galerie de la fiche : clichés anthropométriques, scènes, tatouages. Les
 * images ne sont jamais hébergées ici — seules des URL PostImage sont
 * enregistrées, avec leur légende et leur catégorie.
 *
 * @param {object} props
 * @param {object[]} props.photos
 * @param {boolean} props.loading
 * @param {(photo: object) => void} props.onAdd
 * @param {(photoId: string) => void} props.onRemove
 * @param {boolean} props.readOnly
 */
export default function PhotosTab({ photos = [], loading, onAdd, onRemove, readOnly }) {
  const [draft, setDraft] = useState({
    url: '',
    caption: '',
    category: PHOTO_CATEGORIES.MUGSHOT,
  });
  const [openIndex, setOpenIndex] = useState(null);

  const urlValid = isAllowedImageUrl(draft.url.trim());

  const submit = () => {
    if (!urlValid) return;
    onAdd(draft);
    setDraft({ url: '', caption: '', category: PHOTO_CATEGORIES.MUGSHOT });
  };

  return (
    <>
      {!readOnly && (
        <Panel title="Ajouter une photographie" icon={<MdAddAPhoto />} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <PhotoPreview url={urlValid ? draft.url.trim() : null} width={72} height={72} />

            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1.25} sx={{ mb: 1.25 }}>
                <TextField
                  label="URL de l'image"
                  value={draft.url}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, url: event.target.value }))
                  }
                  error={draft.url.length > 0 && !urlValid}
                  helperText={
                    draft.url.length > 0 && !urlValid
                      ? 'Lien direct PostImage en https attendu.'
                      : ' '
                  }
                />
                <TextField
                  select
                  label="Catégorie"
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, category: event.target.value }))
                  }
                  sx={{ width: 210 }}
                >
                  {toOptions(PHOTO_CATEGORY_LABELS).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction="row" spacing={1.25}>
                <TextField
                  label="Légende"
                  value={draft.caption}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, caption: event.target.value }))
                  }
                />
                <Button
                  variant="contained"
                  startIcon={<MdAddAPhoto />}
                  onClick={submit}
                  disabled={!urlValid}
                  sx={{ flexShrink: 0 }}
                >
                  Ajouter
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Panel>
      )}

      {photos.length === 0 && !loading ? (
        <EmptyState
          title="Aucune photographie"
          message="Les clichés ajoutés à cette fiche apparaîtront ici."
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 1.5,
          }}
        >
          {photos.map((photo, index) => (
            <Box key={photo.id} sx={{ position: 'relative' }}>
              <PhotoPreview
                url={photo.url}
                alt={photo.caption}
                width="100%"
                height={170}
                onClick={() => setOpenIndex(index)}
              />

              <Box sx={{ mt: 0.5 }}>
                <Box sx={{ fontSize: 11, fontWeight: 600 }}>
                  {photo.caption || PHOTO_CATEGORY_LABELS[photo.category] || 'Sans légende'}
                </Box>
                <Box sx={{ fontSize: 10, color: 'var(--muted)' }}>
                  {PHOTO_CATEGORY_LABELS[photo.category] ?? photo.category} ·{' '}
                  {formatDateTime(photo.addedAt, '—')}
                </Box>
              </Box>

              {!readOnly && (
                <Tooltip title="Retirer">
                  <IconButton
                    size="small"
                    onClick={() => onRemove(photo.id)}
                    aria-label="Retirer la photographie"
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: 'rgba(6,10,18,0.7)',
                      '&:hover': { bgcolor: 'error.main', color: '#fff' },
                    }}
                  >
                    <MdDelete size={14} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Box>
      )}

      <Lightbox
        open={openIndex !== null}
        photos={photos}
        index={openIndex ?? 0}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
