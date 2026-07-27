/**
 * Retrait de l'écran d'amorçage HTML.
 *
 * Le voile `#boot` est inscrit directement dans `index.html` pour couvrir le
 * temps de téléchargement du bundle — sans lui, l'utilisateur verrait une page
 * blanche. Il est posé en `z-index: 9999` : tant qu'il n'est pas retiré,
 * l'application est invisible et inutilisable, quand bien même React aurait
 * démarré normalement.
 *
 * Son retrait ne doit donc dépendre d'aucune condition incertaine. En
 * particulier **pas de `requestAnimationFrame`** : le navigateur ne déclenche
 * pas ses rappels tant que l'onglet ne compose pas d'image — onglet en arrière
 * plan, fenêtre réduite, écran verrouillé. Le voile restait alors en place
 * indéfiniment. C'est exactement le symptôme observé : « bloqué sur
 * initialisation du terminal », avec le terminal de connexion rendu dessous.
 *
 * Le retrait est désormais déclenché par l'effet de montage de React, qui
 * s'exécute quelle que soit la visibilité de l'onglet.
 */

/** Durée du fondu, alignée sur la transition CSS de `#boot`. */
const FADE_MS = 240;

/**
 * Retire l'écran d'amorçage, en fondu.
 *
 * Sans effet si le voile a déjà été retiré : la fonction peut être appelée
 * plusieurs fois sans dommage (StrictMode monte les composants deux fois en
 * développement).
 */
export function dismissBootSplash() {
  const boot = document.getElementById('boot');
  if (!boot) return;

  boot.classList.add('hidden');
  // `remove()` plutôt qu'un simple masquage : un élément en `position: fixed`
  // couvrant tout l'écran reste un piège à événements même invisible.
  window.setTimeout(() => boot.remove(), FADE_MS);
}
