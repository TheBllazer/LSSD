import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useLocalStorage from '@/hooks/ui/useLocalStorage';
import { STORAGE_KEYS } from '@/app/config/constants';
import { WorkspaceContext, MAX_TABS } from './workspaceContext';

/**
 * Gère la pile d'onglets internes.
 *
 * Doit être monté **à l'intérieur du routeur** : l'ouverture d'un onglet
 * déclenche une navigation. Il est donc placé autour de `AppShell`, ce qui le
 * réserve de fait à la session authentifiée.
 *
 * @param {{ children: React.ReactNode }} props
 */
export default function WorkspaceProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabs, setTabs] = useLocalStorage(STORAGE_KEYS.WORKSPACE_TABS, []);

  /** L'onglet actif est déduit de l'URL : une seule source de vérité. */
  const activeKey = useMemo(() => {
    const match = tabs.find((tab) => tab.path === location.pathname);
    return match?.key ?? null;
  }, [tabs, location.pathname]);

  /**
   * Ouvre une fiche dans un onglet.
   * Si l'onglet existe déjà, on s'y rend sans le dupliquer.
   *
   * @param {object} tab
   * @param {{background?: boolean}} [options] `background` : ouvrir sans y aller
   */
  const openRecord = useCallback(
    (tab, options = {}) => {
      const key = `${tab.type}:${tab.id}`;

      setTabs((current) => {
        const existing = current.find((item) => item.key === key);
        if (existing) {
          // Rafraîchit le libellé : la fiche a pu être renommée entre-temps.
          return current.map((item) => (item.key === key ? { ...item, ...tab, key } : item));
        }

        if (current.length >= MAX_TABS) {
          // On ferme le plus ancien onglet non modifié plutôt que de refuser.
          const disposable = current.findIndex((item) => !item.dirty);
          if (disposable === -1) {
            toast.error(
              `${MAX_TABS} onglets ouverts, tous avec des modifications non enregistrées.`,
            );
            return current;
          }
          const trimmed = [...current];
          trimmed.splice(disposable, 1);
          return [...trimmed, { ...tab, key }];
        }

        return [...current, { ...tab, key }];
      });

      if (!options.background) navigate(tab.path);
    },
    [setTabs, navigate],
  );

  /**
   * Ferme un onglet et se replie sur le voisin le plus proche.
   * @param {string} key
   */
  const closeTab = useCallback(
    (key) => {
      setTabs((current) => {
        const index = current.findIndex((tab) => tab.key === key);
        if (index === -1) return current;

        const closing = current[index];
        const remaining = current.filter((tab) => tab.key !== key);

        // Si l'onglet fermé était affiché, on bascule sur son voisin.
        if (closing.path === location.pathname) {
          const neighbour = remaining[index] ?? remaining[index - 1] ?? null;
          navigate(neighbour ? neighbour.path : '/dashboard');
        }

        return remaining;
      });
    },
    [setTabs, navigate, location.pathname],
  );

  /** Ferme tous les onglets sauf celui passé en paramètre. */
  const closeOthers = useCallback(
    (key) => {
      setTabs((current) => {
        const kept = current.find((tab) => tab.key === key);
        if (kept && kept.path !== location.pathname) navigate(kept.path);
        return kept ? [kept] : [];
      });
    },
    [setTabs, navigate, location.pathname],
  );

  /** Ferme tous les onglets et revient au tableau de bord. */
  const closeAll = useCallback(() => {
    setTabs([]);
    navigate('/dashboard');
  }, [setTabs, navigate]);

  /**
   * Marque un onglet comme modifié (point sur l'onglet, garde de fermeture).
   * @param {string} key
   * @param {boolean} dirty
   */
  const setDirty = useCallback(
    (key, dirty) => {
      setTabs((current) =>
        current.map((tab) => (tab.key === key ? { ...tab, dirty } : tab)),
      );
    },
    [setTabs],
  );

  /**
   * Met à jour le libellé ou le sous-titre d'un onglet.
   * @param {string} key
   * @param {object} patch
   */
  const updateTab = useCallback(
    (key, patch) => {
      setTabs((current) =>
        current.map((tab) => (tab.key === key ? { ...tab, ...patch } : tab)),
      );
    },
    [setTabs],
  );

  const value = useMemo(
    () => ({
      tabs,
      activeKey,
      openRecord,
      closeTab,
      closeOthers,
      closeAll,
      setDirty,
      updateTab,
    }),
    [tabs, activeKey, openRecord, closeTab, closeOthers, closeAll, setDirty, updateTab],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
