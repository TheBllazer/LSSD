import { Suspense, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { MdCircle, MdStorage, MdWifi } from 'react-icons/md';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import { StatusBar, StatusItem, StatusSpacer } from '@/components/system';
import ErrorBoundary from '@/components/feedback/ErrorBoundary';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import useLocalStorage from '@/hooks/ui/useLocalStorage';
import useHotkeys from '@/hooks/ui/useHotkeys';
import useClock from '@/hooks/ui/useClock';
import { ALL_NAV } from '@/app/config/navigation';
import { STORAGE_KEYS } from '@/app/config/constants';
import { env } from '@/app/config/env';

/**
 * Coque applicative : navbar, barre latérale, zone de contenu et barre d'état.
 *
 * C'est le cadre permanent du logiciel — il ne défile jamais, seule la zone de
 * contenu possède son propre défilement, comme dans un client lourd.
 */
export default function AppShell() {
  const navigate = useNavigate();
  const clock = useClock();
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    STORAGE_KEYS.SIDEBAR_COLLAPSED,
    false,
  );

  /** Ctrl+B : repli de la barre latérale · Ctrl+1..9 : accès direct aux modules. */
  const hotkeys = useMemo(() => {
    const bindings = {
      'ctrl+b': () => setSidebarCollapsed((value) => !value),
    };
    for (const item of ALL_NAV) {
      if (!item.shortcut) continue;
      bindings[`ctrl+${item.shortcut}`] = () => navigate(item.path);
    }
    return bindings;
  }, [navigate, setSidebarCollapsed]);

  useHotkeys(hotkeys);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((value) => !value)}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflow: 'hidden',
          }}
        >
          {/*
            Une frontière d'erreur par zone de contenu : la défaillance d'un
            module n'emporte jamais le chrome ni la session.
          */}
          <ErrorBoundary scope="module">
            <Suspense fallback={<ModuleSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>

      <StatusBar>
        <StatusItem icon={<MdCircle size={8} />} color="var(--ok)">
          SYSTÈME OPÉRATIONNEL
        </StatusItem>
        <StatusItem icon={<MdStorage size={12} />} tooltip="Projet Firebase actif">
          {env.firebase.projectId || 'non configuré'}
        </StatusItem>
        <StatusItem icon={<MdWifi size={12} />} tooltip="Mode d'exécution">
          {env.useEmulators
            ? 'ÉMULATEURS LOCAUX'
            : env.isDev
              ? 'DÉVELOPPEMENT · FIREBASE DISTANT'
              : 'PRODUCTION'}
        </StatusItem>

        <StatusSpacer />

        <StatusItem mono tooltip="Heure de service">
          {clock}
        </StatusItem>
      </StatusBar>
    </Box>
  );
}
