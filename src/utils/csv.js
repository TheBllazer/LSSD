/**
 * Export CSV.
 *
 * Sans backend, l'export se fait entièrement dans le navigateur : on construit
 * le fichier en mémoire et on déclenche un téléchargement.
 *
 * Le séparateur retenu est le point-virgule et l'encodage porte une marque
 * d'ordre d'octets UTF-8 — c'est la seule combinaison qu'Excel en configuration
 * française ouvre correctement, accents compris, sans passer par l'assistant
 * d'importation.
 */

/** Séparateur de colonnes. */
const SEPARATOR = ';';

/**
 * Échappe une valeur pour le format CSV.
 * @param {unknown} value
 * @returns {string}
 */
function escapeCell(value) {
  if (value === null || value === undefined) return '';

  const text = String(value);
  // Une cellule contenant le séparateur, un guillemet ou un saut de ligne doit
  // être entourée de guillemets, les guillemets internes étant doublés.
  if (text.includes(SEPARATOR) || text.includes('"') || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Sérialise des lignes en CSV.
 *
 * @param {Record<string, unknown>[]} rows Lignes, clés = en-têtes
 * @returns {string}
 */
export function toCsv(rows) {
  if (!rows || rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCell).join(SEPARATOR)];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(SEPARATOR));
  }

  return lines.join('\r\n');
}

/**
 * Déclenche le téléchargement d'un CSV.
 *
 * @param {string} filename Nom du fichier proposé
 * @param {Record<string, unknown>[]} rows
 */
export function downloadCsv(filename, rows) {
  const csv = toCsv(rows);
  if (!csv) return;

  // Marque d'ordre d'octets : sans elle, Excel lit le fichier en ANSI et
  // affiche « CitÃ© » au lieu de « Cité ».
  const BOM = '\uFEFF';

  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Libère la mémoire une fois le téléchargement lancé.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
