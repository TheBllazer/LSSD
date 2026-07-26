/**
 * Conversion entre les coordonnées stockées et celles de Leaflet.
 *
 * En projection plane, Leaflet raisonne en `[latitude, longitude]`, c'est-à-dire
 * `[y, x]`. L'inversion est systématique : la centraliser ici évite qu'elle
 * soit oubliée à un endroit et que des entités apparaissent en miroir.
 */

/**
 * Point stocké `{x, y}` → coordonnée Leaflet `[y, x]`.
 * @param {{x: number, y: number}} point
 * @returns {[number, number]}
 */
export const toLatLng = (point) => [point.y, point.x];

/**
 * Coordonnée Leaflet → point stocké, arrondi au pixel.
 * @param {{lat: number, lng: number}} latlng
 * @returns {{x: number, y: number}}
 */
export const toPoint = (latlng) => ({
  x: Math.round(latlng.lng),
  y: Math.round(latlng.lat),
});
