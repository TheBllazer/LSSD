import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import useLocalStorage from '@/hooks/ui/useLocalStorage';
import { STORAGE_KEYS } from '@/app/config/constants';

/**
 * Deux volets séparés par une poignée redimensionnable, à la manière d'un
 * client lourd. La taille du volet secondaire est persistée par `storageKey`.
 *
 * @param {object} props
 * @param {React.ReactNode} props.primary        Volet principal (élastique)
 * @param {React.ReactNode} props.secondary      Volet secondaire (taille fixée)
 * @param {'right'|'left'} [props.side='right']  Position du volet secondaire
 * @param {number} [props.defaultSize=360]       Largeur initiale en pixels
 * @param {number} [props.min=260]
 * @param {number} [props.max=560]
 * @param {string} props.storageKey              Identifiant de persistance
 */
export default function SplitPane({
  primary,
  secondary,
  side = 'right',
  defaultSize = 360,
  min = 260,
  max = 560,
  storageKey,
}) {
  const [sizes, setSizes] = useLocalStorage(STORAGE_KEYS.SPLIT_SIZES, {});
  const stored = sizes?.[storageKey];
  const [size, setSize] = useState(
    typeof stored === 'number' ? stored : defaultSize,
  );
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const clamp = useCallback(
    (value) => Math.min(max, Math.max(min, value)),
    [min, max],
  );

  // Référence miroir de la taille : le gestionnaire `mouseup` peut lire la
  // valeur courante sans que l'effet ne se réabonne à chaque pixel.
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => {
    if (!dragging) return undefined;

    /** @param {MouseEvent} event */
    const handleMove = (event) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next =
        side === 'right' ? rect.right - event.clientX : event.clientX - rect.left;
      setSize(clamp(next));
    };

    const handleUp = () => {
      setDragging(false);
      // Persistance uniquement au relâchement : évite d'écrire à chaque pixel.
      setSizes((previous) => ({ ...previous, [storageKey]: clamp(sizeRef.current) }));
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, side, clamp, setSizes, storageKey]);

  /** Ajustement au clavier : accessibilité de la poignée. */
  const handleKeyDown = (event) => {
    const step = event.shiftKey ? 40 : 12;
    if (event.key === 'ArrowLeft') {
      setSize((value) => clamp(side === 'right' ? value + step : value - step));
    } else if (event.key === 'ArrowRight') {
      setSize((value) => clamp(side === 'right' ? value - step : value + step));
    } else {
      return;
    }
    event.preventDefault();
  };

  const handle = (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionner le panneau"
      tabIndex={0}
      onMouseDown={() => setDragging(true)}
      onKeyDown={handleKeyDown}
      sx={{
        width: 5,
        flexShrink: 0,
        cursor: 'col-resize',
        position: 'relative',
        bgcolor: dragging ? 'primary.main' : 'var(--navy-900)',
        borderLeft: '1px solid',
        borderRight: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 120ms ease',
        '&:hover': { bgcolor: 'primary.dark' },
      }}
    />
  );

  const secondaryPane = (
    <Box sx={{ width: size, flexShrink: 0, minWidth: 0, display: 'flex' }}>
      {secondary}
    </Box>
  );

  return (
    <Box
      ref={containerRef}
      sx={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}
    >
      {side === 'left' && (
        <>
          {secondaryPane}
          {handle}
        </>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>{primary}</Box>

      {side === 'right' && (
        <>
          {handle}
          {secondaryPane}
        </>
      )}
    </Box>
  );
}
