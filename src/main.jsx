import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@/styles/global.css';
import '@/utils/dates'; // Charge la locale française et les plugins dayjs

/**
 * Point d'entrée du terminal LSSD RMS.
 *
 * L'écran d'amorçage inséré dans `index.html` reste visible jusqu'au premier
 * rendu de React, puis disparaît en fondu : aucune transition blanche. Son
 * retrait est déclenché par l'effet de montage de `App` (cf. `app/bootSplash.js`)
 * et non depuis ce fichier — un rappel posé ici ne saurait pas quand React a
 * réellement affiché quelque chose.
 */

const container = document.getElementById('root');
if (!container) {
  throw new Error("Élément racine #root introuvable dans index.html");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
