import {
  MdSpaceDashboard,
  MdPeopleAlt,
  MdDirectionsCar,
  MdDescription,
  MdGavel,
  MdMap,
  MdLocalPolice,
  MdSettings,
} from 'react-icons/md';
import { GiPistolGun } from 'react-icons/gi';
import { ROUTES } from './constants';

/**
 * Définition de la navigation principale.
 *
 * `permission` sera évaluée par le Sidebar (phase 1) : un module dont l'agent
 * n'a pas la permission de lecture n'apparaît tout simplement pas.
 * `shortcut` correspond à Ctrl+<n>.
 *
 * @typedef {object} NavItem
 * @property {string} id
 * @property {string} label
 * @property {string} path
 * @property {React.ComponentType} icon
 * @property {string} [permission]
 * @property {number} [shortcut]
 * @property {string} [description]
 */

/** @type {NavItem[]} */
export const PRIMARY_NAV = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    path: ROUTES.DASHBOARD,
    icon: MdSpaceDashboard,
    shortcut: 1,
    description: 'Vue opérationnelle du service',
  },
  {
    id: 'citizens',
    label: 'Citoyens',
    path: ROUTES.CITIZENS,
    icon: MdPeopleAlt,
    permission: 'citizens.read',
    shortcut: 2,
    description: 'Registre de la population',
  },
  {
    id: 'vehicles',
    label: 'Véhicules',
    path: ROUTES.VEHICLES,
    icon: MdDirectionsCar,
    permission: 'vehicles.read',
    shortcut: 3,
    description: 'Registre des immatriculations',
  },
  {
    id: 'weapons',
    label: 'Armes',
    path: ROUTES.WEAPONS,
    icon: GiPistolGun,
    permission: 'weapons.read',
    shortcut: 4,
    description: 'Registre des armes déclarées',
  },
  {
    id: 'reports',
    label: 'Rapports',
    path: ROUTES.REPORTS,
    icon: MdDescription,
    permission: 'reports.read',
    shortcut: 5,
    description: "Rapports d'incident et d'arrestation",
  },
  {
    id: 'records',
    label: 'Casiers',
    path: ROUTES.RECORDS,
    icon: MdGavel,
    permission: 'records.read',
    shortcut: 6,
    description: 'Casiers judiciaires',
  },
  {
    id: 'map',
    label: 'Carte',
    path: ROUTES.MAP,
    icon: MdMap,
    permission: 'map.read',
    shortcut: 7,
    description: 'Système d\'information géographique',
  },
  {
    id: 'agents',
    label: 'Agents',
    path: ROUTES.AGENTS,
    icon: MdLocalPolice,
    permission: 'agents.read',
    shortcut: 8,
    description: 'Annuaire du personnel',
  },
];

/** @type {NavItem[]} */
export const SECONDARY_NAV = [
  {
    id: 'admin',
    label: 'Administration',
    path: ROUTES.ADMIN,
    icon: MdSettings,
    permission: 'admin.settings',
    shortcut: 9,
    description: 'Référentiels, paramètres et journal d\'audit',
  },
];

/** Tous les éléments de navigation, tous groupes confondus. */
export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export default { PRIMARY_NAV, SECONDARY_NAV, ALL_NAV };
