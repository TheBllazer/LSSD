import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Dialog, InputBase, Stack, Typography } from '@mui/material';
import {
  MdSearch,
  MdPeopleAlt,
  MdDirectionsCar,
  MdDescription,
  MdGavel,
  MdMap,
  MdLocalPolice,
  MdKeyboardReturn,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import Avatar from '@/components/media/Avatar';
import { Kbd } from '@/components/system';
import useOpenRecord from '@/hooks/ui/useOpenRecord';
import { loadSearchIndex, searchIndex, TYPE_PREFIXES } from '@/services/search.service';
import { highlightSegments } from '@/utils/tokens';
import { ENTITY_TYPES, CACHE, ROUTES } from '@/app/config/constants';

/** Présentation de chaque type d'entité dans les résultats. */
const TYPE_META = {
  [ENTITY_TYPES.CITIZEN]: { label: 'Citoyens', icon: MdPeopleAlt },
  [ENTITY_TYPES.VEHICLE]: { label: 'Véhicules', icon: MdDirectionsCar },
  [ENTITY_TYPES.WEAPON]: { label: 'Armes', icon: GiPistolGun },
  [ENTITY_TYPES.REPORT]: { label: 'Rapports', icon: MdDescription },
  [ENTITY_TYPES.RECORD]: { label: 'Casiers', icon: MdGavel },
  [ENTITY_TYPES.AGENT]: { label: 'Agents', icon: MdLocalPolice },
  [ENTITY_TYPES.MAP_FEATURE]: { label: 'Carte', icon: MdMap },
};

/** Commandes de navigation, proposées quand la saisie commence par « > ». */
const COMMANDS = [
  { id: 'citizens', label: 'Ouvrir le registre des citoyens', path: ROUTES.CITIZENS },
  { id: 'vehicles', label: 'Ouvrir le registre des véhicules', path: ROUTES.VEHICLES },
  { id: 'weapons', label: 'Ouvrir le registre des armes', path: ROUTES.WEAPONS },
  { id: 'reports', label: 'Ouvrir les rapports', path: ROUTES.REPORTS },
  { id: 'records', label: 'Ouvrir les casiers', path: ROUTES.RECORDS },
  { id: 'map', label: 'Ouvrir la carte', path: ROUTES.MAP },
  { id: 'agents', label: "Ouvrir l'annuaire", path: ROUTES.AGENTS },
  { id: 'dashboard', label: 'Revenir au tableau de bord', path: ROUTES.DASHBOARD },
];

/** Rend un libellé avec les correspondances mises en évidence. */
function Highlighted({ text, query }) {
  return highlightSegments(text ?? '', query).map((segment, index) => (
    <Box
      key={index}
      component="span"
      sx={
        segment.match
          ? { color: 'primary.main', fontWeight: 700 }
          : undefined
      }
    >
      {segment.value}
    </Box>
  ));
}

/**
 * Recherche globale, façon Spotlight.
 *
 * L'index est chargé une fois puis filtré en mémoire : la frappe ne déclenche
 * aucune lecture Firestore, ce qui rend la recherche réellement instantanée.
 *
 * Préfixes de type : `c:` citoyens, `v:` véhicules, `a:` armes, `r:` rapports,
 * `k:` casiers, `m:` carte. `>` bascule sur les commandes de navigation.
 *
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function CommandPalette({ open, onClose }) {
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef(null);
  const openRecord = useOpenRecord();
  const navigate = useNavigate();

  const { data: index = [], isLoading } = useQuery({
    queryKey: ['searchIndex'],
    queryFn: loadSearchIndex,
    enabled: open,
    staleTime: CACHE.SEARCH_INDEX_STALE,
  });

  const isCommandMode = input.trimStart().startsWith('>');

  /** Résultats groupés par type, ou commandes en mode « > ». */
  const groups = useMemo(() => {
    if (isCommandMode) {
      const terms = input.trimStart().slice(1).trim().toLowerCase();
      const matches = COMMANDS.filter((command) =>
        command.label.toLowerCase().includes(terms),
      );
      return matches.length ? [{ type: 'command', label: 'Commandes', items: matches }] : [];
    }

    const results = searchIndex(index, input);
    const byType = new Map();
    for (const entry of results) {
      if (!byType.has(entry.type)) byType.set(entry.type, []);
      byType.get(entry.type).push(entry);
    }

    return [...byType.entries()].map(([type, items]) => ({
      type,
      label: TYPE_META[type]?.label ?? type,
      items,
    }));
  }, [index, input, isCommandMode]);

  /** Liste à plat, pour la navigation au clavier. */
  const flat = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  // Toute nouvelle saisie replace la sélection sur le premier résultat.
  useEffect(() => setCursor(0), [input]);

  // Une réouverture repart d'une saisie vierge.
  useEffect(() => {
    if (open) {
      setInput('');
      setCursor(0);
    }
  }, [open]);

  /** Ouvre l'élément sélectionné. */
  const activate = (item) => {
    if (!item) return;
    onClose();

    if (isCommandMode) {
      navigate(item.path);
      return;
    }

    openRecord({
      type: item.type,
      id: item.refId,
      title: item.label,
      subtitle: item.subtitle,
    });
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((value) => Math.min(flat.length - 1, value + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((value) => Math.max(0, value - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      activate(flat[cursor]);
    }
  };

  // Maintient l'élément sélectionné dans la zone visible.
  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-index="${cursor}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  let runningIndex = -1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            position: 'fixed',
            top: 90,
            m: 0,
            maxHeight: 520,
            border: '1px solid',
            borderColor: 'var(--line-strong)',
          },
        },
        backdrop: { sx: { backdropFilter: 'blur(2px)' } },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 1.75, height: 46, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <MdSearch size={18} color="var(--muted)" />
        <InputBase
          autoFocus
          fullWidth
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher une fiche, un numéro, une plaque…"
          sx={{ fontSize: 14 }}
        />
        <Kbd>Échap</Kbd>
      </Stack>

      <Box ref={listRef} className="scroll-compact" sx={{ overflow: 'auto', maxHeight: 400 }}>
        {isLoading && (
          <Typography sx={{ p: 2, fontSize: 12, color: 'text.secondary' }}>
            Chargement de l'index…
          </Typography>
        )}

        {!isLoading && input && flat.length === 0 && (
          <Typography sx={{ p: 2, fontSize: 12, color: 'text.secondary' }}>
            Aucun résultat pour « {input} ».
          </Typography>
        )}

        {!input && (
          <Box sx={{ p: 2 }}>
            <Typography className="label-caps" sx={{ display: 'block', mb: 1 }}>
              Filtres de recherche
            </Typography>
            <Stack spacing={0.5}>
              {Object.entries(TYPE_PREFIXES).map(([prefix, type]) => (
                <Stack key={prefix} direction="row" spacing={1} alignItems="center">
                  <Kbd>{prefix}</Kbd>
                  <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                    {TYPE_META[type]?.label ?? type}
                  </Typography>
                </Stack>
              ))}
              <Stack direction="row" spacing={1} alignItems="center">
                <Kbd>&gt;</Kbd>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                  Commandes de navigation
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}

        {groups.map((group) => {
          const Icon = TYPE_META[group.type]?.icon ?? MdSearch;
          return (
            <Box key={group.type}>
              <Typography
                className="label-caps"
                sx={{
                  display: 'block',
                  px: 1.75,
                  py: 0.75,
                  bgcolor: 'var(--navy-850)',
                  borderBottom: '1px solid',
                  borderColor: 'var(--line-soft)',
                }}
              >
                {group.label} · {group.items.length}
              </Typography>

              {group.items.map((item) => {
                runningIndex += 1;
                const active = runningIndex === cursor;
                const key = item.id ?? `${item.type}-${item.refId}`;

                return (
                  <Stack
                    key={key}
                    data-index={runningIndex}
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    onClick={() => activate(item)}
                    onMouseEnter={() => setCursor(runningIndex)}
                    sx={{
                      px: 1.75,
                      py: 0.875,
                      cursor: 'pointer',
                      bgcolor: active ? 'rgba(45,125,210,0.14)' : 'transparent',
                      borderLeft: '2px solid',
                      borderLeftColor: active ? 'primary.main' : 'transparent',
                    }}
                  >
                    {isCommandMode ? (
                      <MdKeyboardReturn size={16} color="var(--muted)" />
                    ) : (
                      <Avatar
                        person={{ photoUrl: item.photoUrl, lastName: item.label }}
                        size={26}
                      />
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 600 }} noWrap>
                        <Highlighted text={item.label} query={input} />
                      </Typography>
                      {item.subtitle && (
                        <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }} noWrap>
                          {item.subtitle}
                        </Typography>
                      )}
                    </Box>

                    {!isCommandMode && <Icon size={14} color="var(--muted-dim)" />}
                  </Stack>
                );
              })}
            </Box>
          );
        })}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          px: 1.75,
          height: 30,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'var(--navy-850)',
        }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>naviguer</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Kbd>⏎</Kbd>
          <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>ouvrir</Typography>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Typography className="mono" sx={{ fontSize: 10, color: 'text.disabled' }}>
          {index.length} fiches indexées
        </Typography>
      </Stack>
    </Dialog>
  );
}
