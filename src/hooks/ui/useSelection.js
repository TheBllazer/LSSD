import { useCallback, useMemo, useState } from 'react';

/**
 * Sélection multiple d'un tableau.
 *
 * Gère les trois gestes attendus d'un logiciel métier : clic simple
 * (remplace la sélection), Ctrl+clic (ajoute ou retire), Maj+clic (étend
 * depuis la dernière ligne cliquée).
 *
 * @param {string[]} ids Identifiants affichés, dans l'ordre du tableau
 * @returns {{
 *   selected: string[],
 *   selectedSet: Set<string>,
 *   count: number,
 *   isSelected: (id: string) => boolean,
 *   toggle: (id: string, event?: {ctrlKey?: boolean, metaKey?: boolean, shiftKey?: boolean}) => void,
 *   selectAll: () => void,
 *   clear: () => void,
 *   allSelected: boolean,
 *   someSelected: boolean
 * }}
 */
export default function useSelection(ids = []) {
  const [selected, setSelected] = useState([]);
  const [anchor, setAnchor] = useState(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const isSelected = useCallback((id) => selectedSet.has(id), [selectedSet]);

  const toggle = useCallback(
    (id, event = {}) => {
      const additive = event.ctrlKey || event.metaKey;
      const ranged = event.shiftKey;

      setSelected((current) => {
        if (ranged && anchor) {
          const from = ids.indexOf(anchor);
          const to = ids.indexOf(id);
          if (from !== -1 && to !== -1) {
            const [start, end] = from < to ? [from, to] : [to, from];
            const range = ids.slice(start, end + 1);
            // L'étendue s'ajoute à la sélection existante, sans doublon.
            return [...new Set([...current, ...range])];
          }
        }

        if (additive) {
          return current.includes(id)
            ? current.filter((value) => value !== id)
            : [...current, id];
        }

        // Clic simple : bascule si c'était le seul élément sélectionné.
        return current.length === 1 && current[0] === id ? [] : [id];
      });

      if (!ranged) setAnchor(id);
    },
    [ids, anchor],
  );

  const selectAll = useCallback(() => setSelected(ids), [ids]);

  const clear = useCallback(() => {
    setSelected([]);
    setAnchor(null);
  }, []);

  return {
    selected,
    selectedSet,
    count: selected.length,
    isSelected,
    toggle,
    setSelected,
    selectAll,
    clear,
    allSelected: ids.length > 0 && selected.length === ids.length,
    someSelected: selected.length > 0 && selected.length < ids.length,
  };
}
