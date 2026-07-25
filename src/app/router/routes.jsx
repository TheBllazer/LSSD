import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import { ROUTES } from '@/app/config/constants';

/**
 * Table de routage.
 *
 * Chaque page est chargée à la demande (`React.lazy`) : le bundle initial ne
 * contient que le chrome applicatif. Le `Suspense` de secours est fourni par
 * `AppShell` (`ModuleSkeleton`), ce qui évite tout écran blanc.
 *
 * Phase 1 : `AppShell` sera enveloppé dans `<ProtectedRoute>` et chaque module
 * sensible dans `<RoleRoute permission="…">`.
 */

const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const CitizenListPage = lazy(() => import('@/modules/citizens/pages/CitizenListPage'));
const VehicleListPage = lazy(() => import('@/modules/vehicles/pages/VehicleListPage'));
const WeaponListPage = lazy(() => import('@/modules/weapons/pages/WeaponListPage'));
const ReportListPage = lazy(() => import('@/modules/reports/pages/ReportListPage'));
const RecordListPage = lazy(() => import('@/modules/criminal-records/pages/RecordListPage'));
const MapPage = lazy(() => import('@/modules/map/pages/MapPage'));
const AgentListPage = lazy(() => import('@/modules/agents/pages/AgentListPage'));
const AdminPage = lazy(() => import('@/modules/admin/pages/AdminPage'));
const ForbiddenPage = lazy(() => import('@/modules/system/pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('@/modules/system/pages/NotFoundPage'));

/** @type {import('react-router-dom').RouteObject[]} */
export const routes = [
  {
    path: ROUTES.ROOT,
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'citizens', element: <CitizenListPage /> },
      { path: 'vehicles', element: <VehicleListPage /> },
      { path: 'weapons', element: <WeaponListPage /> },
      { path: 'reports', element: <ReportListPage /> },
      { path: 'records', element: <RecordListPage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'agents', element: <AgentListPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export default routes;
