import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@/styles/global.css';
import '@/utils/dates'; // Charge la locale française et les plugins dayjs

/**
 * Point d'entrée du terminal LSSD RMS.
 *
 * L'écran d'amorçage inséré dans `index.html` reste visible jusqu'au premier
 * rendu de React, puis disparaît en fondu : aucune transition blanche.
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

/** Retire l'écran d'amorçage HTML une fois l'application montée. */
requestAnimationFrame(() => {
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('hidden');
  setTimeout(() => boot.remove(), 240);
});
