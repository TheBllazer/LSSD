import { Suspense, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  MdCircle,
  MdGroups,
  MdShield,
  MdBadge,
  MdStorage,
} from 'react-icons/md';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import TabBar from '@/components/navigation/TabBar';
import { StatusBar, StatusItem, StatusSpacer } from '@/components/system';
import ErrorBoundary from '@/components/feedback/ErrorBoundary';
import ModuleSkeleton from '@/components/feedback/ModuleSkeleton';
import useLocalStorage from '@/hooks/ui/useLocalStorage';
import useHotkeys from '@/hooks/ui/useHotkeys';
import useClock from '@/hooks/ui/useClock';
import useAuth from '@/hooks/auth/useAuth';
import useWorkspace from '@/hooks/ui/useWorkspace';
import useOnlineAgents from '@/hooks/data/useOnlineAgents';
import { ALL_NAV } from '@/app/config/navigation';
import { STORAGE_KEYS } from '@/app/config/constants';
import { ROLE_LABELS, hasAbility } from '@/utils/permissions';
import { DIVISION_LABELS } from '@/types/agents';
import { agentSignature } from '@/utils/format';
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
  const { agent, role, abilities } = useAuth();
  const { tabs, activeKey, closeTab } = useWorkspace();
  const { count: onlineCount } = useOnlineAgents();
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    STORAGE_KEYS.SIDEBAR_COLLAPSED,
    false,
  );

  /**
   * Ctrl+B : repli de la barre latérale.
   * Ctrl+W : fermeture de l'onglet courant.
   * Ctrl+1..9 : accès direct à un module — uniquement ceux auxquels l'agent a
   * droit, sinon le raccourci mènerait à un écran « accès refusé ».
   */
  const hotkeys = useMemo(() => {
    const bindings = {
      'ctrl+b': () => setSidebarCollapsed((value) => !value),
      'ctrl+w': () => {
        if (activeKey) closeTab(activeKey);
      },
    };
    for (const item of ALL_NAV) {
      if (!item.shortcut) continue;
      if (item.permission && !hasAbility(abilities, item.permission)) continue;
      bindings[`ctrl+${item.shortcut}`] = () => navigate(item.path);
    }
    return bindings;
  }, [navigate, setSidebarCollapsed, abilities, activeKey, closeTab]);

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
            position: 'relative',
          }}
        >
          {/* La barre d'onglets n'apparaît qu'une fois une fiche ouverte. */}
          {tabs.length > 0 && <TabBar />}

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
        <StatusItem icon={<MdCircle size={8} />} color="var(--ok)" tooltip="État du terminal">
          EN SERVICE
        </StatusItem>

        <StatusItem icon={<MdBadge size={12} />} mono tooltip="Agent connecté">
          {agentSignature(agent)}
        </StatusItem>

        <StatusItem icon={<MdShield size={12} />} tooltip="Habilitation">
          {ROLE_LABELS[role] ?? '—'}
        </StatusItem>

        {agent?.division && (
          <StatusItem tooltip="Division d'affectation">
            {DIVISION_LABELS[agent.division] ?? agent.division}
          </StatusItem>
        )}

        {agent?.callsign && (
          <StatusItem mono tooltip="Indicatif radio">
            {agent.callsign}
          </StatusItem>
        )}

        <StatusSpacer />

        <StatusItem
          icon={<MdGroups size={13} />}
          tooltip="Agents actuellement connectés"
          color={onlineCount > 0 ? 'var(--ok)' : undefined}
        >
          {onlineCount} en ligne
        </StatusItem>

        <StatusItem icon={<MdStorage size={12} />} tooltip="Projet Firebase actif">
          {env.firebase.projectId || 'non configuré'}
        </StatusItem>

        <StatusItem mono tooltip="Heure de service">
          {clock}
        </StatusItem>
      </StatusBar>
    </Box>
  );
}
