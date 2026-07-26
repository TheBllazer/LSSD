import { createElement } from 'react';
import CitizenPdf from './templates/CitizenPdf';
import ReportPdf from './templates/ReportPdf';
import RecordPdf from './templates/RecordPdf';
import VehiclePdf from './templates/VehiclePdf';
import WeaponPdf from './templates/WeaponPdf';
import { registryName } from '@/utils/format';

/**
 * Catalogue des documents officiels.
 *
 * Ajouter un document consiste à écrire un modèle et à l'inscrire ici :
 * l'aperçu, le téléchargement, la journalisation et le nom de fichier sont
 * mutualisés.
 */

/**
 * @typedef {object} TemplateDefinition
 * @property {string} label       Nom affiché dans l'aperçu
 * @property {React.ComponentType} component
 * @property {(data: object) => string} filename
 */

/** @type {Record<string, TemplateDefinition>} */
export const PDF_TEMPLATES = {
  citizen: {
    label: 'Fiche citoyen',
    component: CitizenPdf,
    filename: ({ citizen }) =>
      `fiche-citoyen-${slug(registryName(citizen, 'sans-nom'))}.pdf`,
  },
  report: {
    label: "Rapport d'incident",
    component: ReportPdf,
    filename: ({ report }) => `${report.number}.pdf`,
  },
  record: {
    label: 'Extrait de casier',
    component: RecordPdf,
    filename: ({ record }) => `${record.number}.pdf`,
  },
  vehicle: {
    label: 'Fiche véhicule',
    component: VehiclePdf,
    filename: ({ vehicle }) => `vehicule-${slug(vehicle.plate)}.pdf`,
  },
  weapon: {
    label: 'Fiche arme',
    component: WeaponPdf,
    filename: ({ weapon }) => `arme-${slug(weapon.serialNumber)}.pdf`,
  },
};

/**
 * Instancie le document d'un modèle.
 *
 * @param {string} templateId Clé de `PDF_TEMPLATES`
 * @param {object} data       Données attendues par le modèle
 * @returns {React.ReactElement}
 */
export function renderTemplate(templateId, data) {
  const template = PDF_TEMPLATES[templateId];
  if (!template) throw new Error(`Modèle de document inconnu : ${templateId}`);
  return createElement(template.component, data);
}

/**
 * Nom de fichier proposé au téléchargement.
 * @param {string} templateId
 * @param {object} data
 * @returns {string}
 */
export function templateFilename(templateId, data) {
  const template = PDF_TEMPLATES[templateId];
  if (!template) return 'document.pdf';
  try {
    return template.filename(data);
  } catch {
    return 'document.pdf';
  }
}

/**
 * Normalise une chaîne pour en faire un nom de fichier.
 * @param {string} value
 * @returns {string}
 */
function slug(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
