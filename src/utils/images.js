import { ALLOWED_IMAGE_HOSTS } from '@/app/config/constants';

/**
 * Contrôles sur les URL d'images.
 *
 * L'application n'héberge aucun fichier : une photographie est une URL
 * distante. On restreint les hôtes acceptés pour deux raisons — éviter qu'une
 * fiche pointe vers un contenu arbitraire, et empêcher qu'un lien serve de
 * traceur au chargement d'un dossier.
 */

/**
 * Vérifie qu'une URL pointe vers un hébergeur d'images autorisé, en HTTPS.
 *
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isAllowedImageUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_IMAGE_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

/**
 * Normalise une saisie d'URL : espaces retirés, chaîne vide convertie en `null`.
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function normalizeImageUrl(url) {
  const trimmed = String(url ?? '').trim();
  return trimmed === '' ? null : trimmed;
}
