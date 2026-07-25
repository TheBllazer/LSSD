import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import BootSplash from '@/components/feedback/BootSplash';
import { ROUTES } from '@/app/config/constants';
import { PERMISSIONS } from '@/utils/permissions';

/**
 * Table de routage.
 *
 * Deux niveaux de garde :
 *   - `ProtectedRoute` : session ouverte et compte opérationnel ;
 *   - `RoleRoute` : permission de lecture du module concerné.
 *
 * Chaque page est chargée à la demande (`React.lazy`). Le `Suspense` des routes
 * internes est fourni par `AppShell` (squelette de module) ; les routes hors
 * coque applicative portent le leur.
 */

const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
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

/**
 * Enveloppe une page de module dans sa garde de permission.
 * @param {string} permission
 * @param {React.ReactNode} element
 */
const guarded = (permission, element) => (
  <RoleRoute permission={permission}>{element}</RoleRoute>
);

/** @type {import('react-router-dom').RouteObject[]} */
export const routes = [
  {
    path: ROUTES.LOGIN,
    element: (
      <Suspense fallback={<BootSplash message="Ouverture du terminal" />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: ROUTES.ROOT,
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'citizens', element: guarded(PERMISSIONS.CITIZENS_READ, <CitizenListPage />) },
      { path: 'vehicles', element: guarded(PERMISSIONS.VEHICLES_READ, <VehicleListPage />) },
      { path: 'weapons', element: guarded(PERMISSIONS.WEAPONS_READ, <WeaponListPage />) },
      { path: 'reports', element: guarded(PERMISSIONS.REPORTS_READ, <ReportListPage />) },
      { path: 'records', element: guarded(PERMISSIONS.RECORDS_READ, <RecordListPage />) },
      { path: 'map', element: guarded(PERMISSIONS.MAP_READ, <MapPage />) },
      { path: 'agents', element: guarded(PERMISSIONS.AGENTS_READ, <AgentListPage />) },
      { path: 'admin', element: guarded(PERMISSIONS.ADMIN_SETTINGS, <AdminPage />) },
      { path: 'forbidden', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export default routes;
