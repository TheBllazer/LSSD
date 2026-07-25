import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdZoomIn,
  MdZoomOut,
  MdRestartAlt,
  MdOpenInNew,
} from 'react-icons/md';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

/**
 * Visionneuse plein écran.
 *
 * Zoom à la molette centré sur le curseur, déplacement au glisser, navigation
 * au clavier. Pensée pour l'examen d'une photographie de scène ou d'un
 * signalement : on doit pouvoir agrandir un détail sans quitter la fiche.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {{url: string, caption?: string, category?: string}[]} props.photos
 * @param {number} props.index          Photo affichée
 * @param {(index: number) => void} props.onIndexChange
 * @param {() => void} props.onClose
 */
export default function Lightbox({ open, photos = [], index = 0, onIndexChange, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const photo = photos[index];
  const hasPrevious = index > 0;
  const hasNext = index < photos.length - 1;

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // Toute nouvelle photo repart d'un cadrage neutre.
  useEffect(reset, [index, open, reset]);

  const goPrevious = useCallback(() => {
    if (hasPrevious) onIndexChange(index - 1);
  }, [hasPrevious, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(index + 1);
  }, [hasNext, index, onIndexChange]);

  /** Raccourcis clavier de la visionneuse. */
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (event) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goPrevious();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case '+':
        case '=':
          setZoom((value) => Math.min(MAX_ZOOM, value * 1.25));
          break;
        case '-':
          setZoom((value) => Math.max(MIN_ZOOM, value / 1.25));
          break;
        case '0':
          reset();
          break;
        default:
          return;
      }
      event.preventDefault();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, goPrevious, goNext, reset]);

  /** Zoom molette. */
  const handleWheel = (event) => {
    const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
    setZoom((value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value * factor)));
  };

  /** Déplacement au glisser, actif uniquement si l'image dépasse le cadre. */
  const handleMouseDown = (event) => {
    if (zoom <= 1) return;
    dragRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  };

  const handleMouseMove = (event) => {
    if (!dragRef.current) return;
    setOffset({
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y,
    });
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  return (
    <AnimatePresence>
      {open && photo && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',
            bgcolor: 'rgba(6,10,18,0.94)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Barre supérieure */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              px: 1.5,
              height: 42,
              flexShrink: 0,
              borderBottom: '1px solid',
              borderColor: 'var(--line)',
              bgcolor: 'var(--navy-900)',
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
              {photo.caption || 'Photographie'}
            </Typography>
            {photo.category && (
              <Typography className="label-caps">{photo.category}</Typography>
            )}

            <Box sx={{ flex: 1 }} />

            <Typography className="mono" sx={{ fontSize: 11, color: 'text.secondary' }}>
              {index + 1} / {photos.length} · {Math.round(zoom * 100)} %
            </Typography>

            <Tooltip title="Zoom arrière (-)">
              <IconButton
                size="small"
                onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value / 1.25))}
              >
                <MdZoomOut size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom avant (+)">
              <IconButton
                size="small"
                onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value * 1.25))}
              >
                <MdZoomIn size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Réinitialiser le cadrage (0)">
              <IconButton size="small" onClick={reset}>
                <MdRestartAlt size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ouvrir la source dans un onglet">
              <IconButton
                size="small"
                component="a"
                href={photo.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <MdOpenInNew size={15} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fermer (Échap)">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
              >
                <MdClose size={17} />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Zone d'image */}
          <Box
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              cursor: zoom > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'default',
            }}
          >
            <Box
              component="img"
              src={photo.url}
              alt={photo.caption || ''}
              draggable={false}
              sx={{
                maxWidth: '92%',
                maxHeight: '92%',
                objectFit: 'contain',
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: dragRef.current ? 'none' : 'transform 120ms ease-out',
                userSelect: 'none',
              }}
            />
          </Box>

          {/* Navigation */}
          {hasPrevious && (
            <IconButton
              onClick={goPrevious}
              aria-label="Photo précédente"
              sx={{ position: 'absolute', left: 16, top: '50%', bgcolor: 'var(--navy-800)' }}
            >
              <MdChevronLeft size={24} />
            </IconButton>
          )}
          {hasNext && (
            <IconButton
              onClick={goNext}
              aria-label="Photo suivante"
              sx={{ position: 'absolute', right: 16, top: '50%', bgcolor: 'var(--navy-800)' }}
            >
              <MdChevronRight size={24} />
            </IconButton>
          )}
        </Box>
      )}
    </AnimatePresence>
  );
}
