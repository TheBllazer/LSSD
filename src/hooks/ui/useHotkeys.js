import { useEffect, useRef } from 'react';

/** Champs dans lesquels les raccourcis globaux doivent rester inactifs. */
const EDITABLE = ['INPUT', 'TEXTAREA', 'SELECT'];

/**
 * Normalise un événement clavier en signature comparable : « ctrl+shift+k ».
 * @param {KeyboardEvent} event
 * @returns {string}
 */
function signature(event) {
  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  parts.push(key);
  return parts.join('+');
}

/**
 * Enregistre des raccourcis clavier globaux.
 *
 * Les combinaisons sont décrites en minuscules : `'ctrl+k'`, `'ctrl+1'`,
 * `'escape'`, `'ctrl+shift+s'`. Les touches uniques (sans modificateur) sont
 * ignorées lorsque le focus est dans un champ de saisie, sauf `Escape`.
 *
 * @param {Record<string, (event: KeyboardEvent) => void>} bindings
 * @param {{ enabled?: boolean, allowInInputs?: boolean }} [options]
 */
export default function useHotkeys(bindings, options = {}) {
  const { enabled = true, allowInInputs = false } = options;
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    if (!enabled) return undefined;

    /** @param {KeyboardEvent} event */
    const handleKeyDown = (event) => {
      const target = event.target;
      const isEditable =
        EDITABLE.includes(target?.tagName) || target?.isContentEditable === true;

      const combo = signature(event);
      const handler = bindingsRef.current[combo];
      if (!handler) return;

      // Dans un champ, seuls les raccourcis avec modificateur et Escape passent.
      const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
      if (isEditable && !allowInInputs && !hasModifier && combo !== 'escape') return;

      event.preventDefault();
      handler(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, allowInInputs]);
}
