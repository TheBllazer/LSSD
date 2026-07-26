import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import Image from '@tiptap/extension-image';
import { Placeholder, CharacterCount } from '@tiptap/extensions';

/**
 * Extensions de l'éditeur de rapports.
 *
 * Le jeu est volontairement limité à ce qu'un rapport de police contient
 * réellement : titres de section, mise en forme, listes, listes de contrôle,
 * tableaux d'horodatage, citations, images de scène. Pas de police
 * fantaisiste, pas de couleur de fond arbitraire — un rapport doit rester
 * imprimable et lisible en noir et blanc.
 *
 * @param {object} [options]
 * @param {string} [options.placeholder]
 * @returns {import('@tiptap/core').Extensions}
 */
export function buildExtensions({ placeholder } = {}) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // La liaison hypertexte est conservée : elle sert à référencer un autre
      // dossier ou une pièce jointe.
      link: { openOnClick: false, autolink: true },
      codeBlock: { HTMLAttributes: { class: 'report-code' } },
    }),

    // Couleur de texte et surlignage : le surlignage sert au relecteur.
    TextStyleKit.configure({ fontFamily: false, fontSize: false, lineHeight: false }),
    Highlight.configure({ multicolor: true }),

    TextAlign.configure({ types: ['heading', 'paragraph'] }),

    TableKit.configure({
      table: { resizable: true, HTMLAttributes: { class: 'report-table' } },
    }),

    TaskList,
    TaskItem.configure({ nested: true }),

    Image.configure({
      inline: false,
      allowBase64: false, // Les images sont des URL distantes, jamais embarquées.
      HTMLAttributes: { class: 'report-image' },
    }),

    Placeholder.configure({
      placeholder: placeholder ?? 'Rédigez le corps du rapport…',
    }),

    CharacterCount,
  ];
}

/**
 * Modèles de rapport préremplis.
 *
 * Ils reproduisent la trame attendue par le service : un agent ne part jamais
 * d'une page blanche, et deux rapports du même type se relisent de la même
 * façon.
 */
export const REPORT_TEMPLATES = {
  INCIDENT: {
    label: "Rapport d'incident",
    sections: ['SYNOPSIS', 'FAITS CONSTATÉS', 'PERSONNES PRÉSENTES', 'MESURES PRISES', 'SUITES'],
  },
  ARREST: {
    label: "Rapport d'arrestation",
    sections: [
      'SYNOPSIS',
      'MOTIF DE L\'INTERPELLATION',
      'DÉROULEMENT',
      'NOTIFICATION DES DROITS',
      'OBJETS SAISIS',
      'CHEFS D\'ACCUSATION',
    ],
  },
  TRAFFIC: {
    label: 'Contrôle routier',
    sections: ['MOTIF DU CONTRÔLE', 'DÉROULEMENT', 'DOCUMENTS PRÉSENTÉS', 'SUITES DONNÉES'],
  },
  USE_OF_FORCE: {
    label: 'Usage de la force',
    sections: [
      'SYNOPSIS',
      'MENACE PERÇUE',
      'FORCE EMPLOYÉE',
      'ÉTAT DES PERSONNES',
      'SECOURS ENGAGÉS',
      'NOTIFICATION HIÉRARCHIQUE',
    ],
  },
};

/**
 * Construit le document TipTap d'un modèle.
 *
 * @param {string} type Clé de `REPORT_TEMPLATES`
 * @returns {object|null} Document ProseMirror
 */
export function buildTemplateContent(type) {
  const template = REPORT_TEMPLATES[type];
  if (!template) return null;

  const content = [];
  template.sections.forEach((section, index) => {
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: `${romanize(index + 1)}. ${section}` }],
    });
    content.push({ type: 'paragraph' });
  });

  return { type: 'doc', content };
}

/**
 * Convertit un entier en chiffres romains (numérotation des sections).
 * @param {number} value
 * @returns {string}
 */
function romanize(value) {
  const table = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = value;
  let output = '';
  for (const [amount, symbol] of table) {
    while (remaining >= amount) {
      output += symbol;
      remaining -= amount;
    }
  }
  return output;
}
