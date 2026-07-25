import { createHashRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

/**
 * Routeur de l'application.
 *
 * `createHashRouter` est un choix imposé par l'hébergement GitHub Pages :
 * aucune réécriture d'URL n'y est possible, un rafraîchissement sur
 * `/LSSD/citizens/abc` renverrait un 404. Les routes vivent donc après le « # »
 * (`/LSSD/#/citizens/abc`), ce qui fonctionne sur n'importe quel hébergeur
 * statique. Un `public/404.html` convertit les anciens liens en chemin réel.
 */
const router = createHashRouter(routes);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
