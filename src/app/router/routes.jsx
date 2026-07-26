import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import AppShell from '@/layouts/AppShell';
import WorkspaceProvider from '@/contexts/WorkspaceProvider';
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
const CitizenDetailPage = lazy(() => import('@/modules/citizens/pages/CitizenDetailPage'));
const VehicleListPage = lazy(() => import('@/modules/vehicles/pages/VehicleListPage'));
const VehicleDetailPage = lazy(() => import('@/modules/vehicles/pages/VehicleDetailPage'));
const WeaponListPage = lazy(() => import('@/modules/weapons/pages/WeaponListPage'));
const WeaponDetailPage = lazy(() => import('@/modules/weapons/pages/WeaponDetailPage'));
const ReportListPage = lazy(() => import('@/modules/reports/pages/ReportListPage'));
const ReportEditorPage = lazy(() => import('@/modules/reports/pages/ReportEditorPage'));
const RecordListPage = lazy(() => import('@/modules/criminal-records/pages/RecordListPage'));
const RecordDetailPage = lazy(() => import('@/modules/criminal-records/pages/RecordDetailPage'));
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
        {/* L'espace de travail vit dans le routeur : ouvrir un onglet navigue. */}
        <WorkspaceProvider>
          <AppShell />
        </WorkspaceProvider>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'citizens', element: guarded(PERMISSIONS.CITIZENS_READ, <CitizenListPage />) },
      {
        path: 'citizens/:id',
        element: guarded(PERMISSIONS.CITIZENS_READ, <CitizenDetailPage />),
      },
      { path: 'vehicles', element: guarded(PERMISSIONS.VEHICLES_READ, <VehicleListPage />) },
      {
        path: 'vehicles/:id',
        element: guarded(PERMISSIONS.VEHICLES_READ, <VehicleDetailPage />),
      },
      { path: 'weapons', element: guarded(PERMISSIONS.WEAPONS_READ, <WeaponListPage />) },
      {
        path: 'weapons/:id',
        element: guarded(PERMISSIONS.WEAPONS_READ, <WeaponDetailPage />),
      },
      { path: 'reports', element: guarded(PERMISSIONS.REPORTS_READ, <ReportListPage />) },
      {
        path: 'reports/:id',
        element: guarded(PERMISSIONS.REPORTS_READ, <ReportEditorPage />),
      },
      { path: 'records', element: guarded(PERMISSIONS.RECORDS_READ, <RecordListPage />) },
      {
        path: 'records/:id',
        element: guarded(PERMISSIONS.RECORDS_READ, <RecordDetailPage />),
      },
      { path: 'map', element: guarded(PERMISSIONS.MAP_READ, <MapPage />) },
      { path: 'agents', element: guarded(PERMISSIONS.AGENTS_READ, <AgentListPage />) },
      { path: 'admin', element: guarded(PERMISSIONS.ADMIN_SETTINGS, <AdminPage />) },
      { path: 'forbidden', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export default routes;
