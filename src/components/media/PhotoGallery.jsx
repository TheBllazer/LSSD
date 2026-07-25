import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import PhotoPreview from './PhotoPreview';
import Lightbox from './Lightbox';
import EmptyState from '@/components/data/EmptyState';
import { MdPhotoLibrary } from 'react-icons/md';

/**
 * Galerie de photographies d'une fiche.
 *
 * Grille de vignettes uniformes ouvrant la visionneuse plein écran. Les
 * vignettes apparaissent en cascade légère : le chargement d'une galerie de
 * scène reste lisible même avec une dizaine de clichés.
 *
 * @param {object} props
 * @param {{url: string, caption?: string, category?: string}[]} props.photos
 * @param {number} [props.size=128]
 * @param {React.ReactNode} [props.action] Action affichée dans l'état vide
 */
export default function PhotoGallery({ photos = [], size = 128, action }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={<MdPhotoLibrary />}
        title="Aucune photographie"
        message="Les clichés ajoutés à cette fiche apparaîtront ici."
        action={action}
      />
    );
  }

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))`,
          gap: 1.25,
        }}
      >
        {photos.map((photo, index) => (
          <Box
            key={`${photo.url}-${index}`}
            component={motion.div}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.3) }}
          >
            <PhotoPreview
              url={photo.url}
              alt={photo.caption || ''}
              width="100%"
              height={size * 1.25}
              onClick={() => setOpenIndex(index)}
            />
            {photo.caption && (
              <Typography
                sx={{ fontSize: 10.5, color: 'text.secondary', mt: 0.375 }}
                noWrap
              >
                {photo.caption}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

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

/**
 * Bandeau horizontal compact de vignettes (aperçu dans un panneau latéral).
 * @param {{ photos: object[], max?: number }} props
 */
export function PhotoStrip({ photos = [], max = 6 }) {
  const [openIndex, setOpenIndex] = useState(null);
  const shown = photos.slice(0, max);
  const remaining = photos.length - shown.length;

  return (
    <>
      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
        {shown.map((photo, index) => (
          <PhotoPreview
            key={`${photo.url}-${index}`}
            url={photo.url}
            width={56}
            height={56}
            onClick={() => setOpenIndex(index)}
          />
        ))}

        {remaining > 0 && (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 56,
              height: 56,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: '3px',
              color: 'text.secondary',
              fontSize: 12,
            }}
          >
            +{remaining}
          </Stack>
        )}
      </Stack>

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
