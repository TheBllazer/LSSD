import { useEffect, useState } from 'react';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { MdBrokenImage, MdImageNotSupported, MdZoomIn } from 'react-icons/md';
import { isAllowedImageUrl } from '@/utils/images';

/**
 * Aperçu d'une photographie référencée par URL.
 *
 * Les images ne sont pas hébergées par l'application : seules des URL distantes
 * sont stockées. Ce composant gère donc explicitement les trois cas — chargement,
 * URL non conforme, image indisponible — plutôt que d'afficher une image cassée
 * sur une fiche de police.
 *
 * @param {object} props
 * @param {string|null} props.url
 * @param {number|string} [props.width=128]
 * @param {number|string} [props.height=160]
 * @param {string} [props.alt='']
 * @param {() => void} [props.onClick]  Ouvre la visionneuse
 * @param {string} [props.emptyLabel]
 * @param {object} [props.sx]
 */
export default function PhotoPreview({
  url,
  width = 128,
  height = 160,
  alt = '',
  onClick,
  emptyLabel = 'Aucune photo',
  sx,
}) {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!url) {
      setStatus('empty');
      return undefined;
    }
    if (!isAllowedImageUrl(url)) {
      setStatus('rejected');
      return undefined;
    }

    setStatus('loading');

    // Préchargement hors DOM : évite le clignotement d'une image partielle.
    const image = new Image();
    image.onload = () => setStatus('loaded');
    image.onerror = () => setStatus('error');
    image.src = url;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [url]);

  const frameSx = {
    position: 'relative',
    width,
    height,
    flexShrink: 0,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '3px',
    bgcolor: 'var(--navy-850)',
    overflow: 'hidden',
    ...sx,
  };

  if (status === 'loading') {
    return (
      <Box sx={frameSx}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    );
  }

  if (status === 'loaded') {
    return (
      <Box
        sx={{
          ...frameSx,
          cursor: onClick ? 'zoom-in' : 'default',
          '&:hover .zoom-hint': { opacity: 1 },
        }}
        onClick={onClick}
      >
        <Box
          component="img"
          src={url}
          alt={alt}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {onClick && (
          <Box
            className="zoom-hint"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(6,10,18,0.55)',
              color: '#fff',
              fontSize: 22,
              opacity: 0,
              transition: 'opacity 140ms ease',
            }}
          >
            <MdZoomIn />
          </Box>
        )}
      </Box>
    );
  }

  const problem =
    status === 'rejected'
      ? { icon: <MdImageNotSupported />, label: 'Hébergeur non autorisé' }
      : status === 'error'
        ? { icon: <MdBrokenImage />, label: 'Image indisponible' }
        : { icon: <MdImageNotSupported />, label: emptyLabel };

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={0.5}
      sx={{ ...frameSx, color: 'text.disabled', p: 1, textAlign: 'center' }}
    >
      <Box sx={{ display: 'flex', fontSize: 22, opacity: 0.6 }}>{problem.icon}</Box>
      <Typography sx={{ fontSize: 10, lineHeight: 1.3 }}>{problem.label}</Typography>
    </Stack>
  );
}
