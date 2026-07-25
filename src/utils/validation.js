import * as z from 'zod';
import { ALLOWED_IMAGE_HOSTS } from '@/app/config/constants';
import { isAllowedImageUrl } from './images';

/**
 * Socle de validation partagé entre les formulaires et les services.
 *
 * Un seul schéma par entité sert à la fois à React Hook Form et au contrôle
 * effectué avant écriture Firestore : impossible qu'un formulaire accepte une
 * valeur que le service refuserait, ou l'inverse.
 */

// Messages d'erreur en français par défaut.
z.config(z.locales.fr());

export { z };

/* ------------------------------------------------------- schémas réutilisables */

/** Chaîne obligatoire, espaces superflus retirés. */
export const requiredString = (label, max = 120) =>
  z
    .string({ error: `${label} est obligatoire.` })
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(max, `${label} ne peut pas dépasser ${max} caractères.`);

/** Chaîne facultative — la chaîne vide est convertie en `null`. */
export const optionalString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Ce champ ne peut pas dépasser ${max} caractères.`)
    .optional()
    .nullable()
    .transform((value) => (value === '' ? null : (value ?? null)));

/**
 * URL de photo.
 *
 * Les images ne sont jamais hébergées par l'application : seules des URL
 * distantes sont stockées. On restreint aux hôtes autorisés pour éviter qu'une
 * fiche pointe vers n'importe quoi (traçage, contenu arbitraire).
 */
export const photoUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === '' ? null : (value ?? null)))
  .refine((value) => !value || isAllowedImageUrl(value), {
    message: `L'URL doit être une adresse https de ${ALLOWED_IMAGE_HOSTS[0]}.`,
  });

/** Adresse e-mail facultative. */
export const optionalEmail = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === '' ? null : (value ?? null)))
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Adresse e-mail invalide.',
  });

/** Numéro de téléphone facultatif (formats américains courants). */
export const optionalPhone = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === '' ? null : (value ?? null)))
  .refine((value) => !value || /^[\d\s()+-]{7,20}$/.test(value), {
    message: 'Numéro de téléphone invalide.',
  });

/** Date facultative acceptant `Date`, chaîne ISO ou champ vide. */
export const optionalDate = z
  .union([z.date(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  });

/** Date obligatoire. */
export const requiredDate = (label) =>
  optionalDate.refine((value) => value !== null, { message: `${label} est obligatoire.` });

/** Entier positif facultatif. */
export const optionalPositiveInt = (label, max = 1_000_000) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => value === null || (!Number.isNaN(value) && value >= 0 && value <= max), {
      message: `${label} doit être un nombre entre 0 et ${max}.`,
    });

/** Valeur appartenant à une énumération. */
export const enumOf = (values, label) =>
  z.enum(values, { error: `${label} : valeur non reconnue.` });

/* --------------------------------------------------------------- résolveur RHF */

/**
 * Insère une valeur à un chemin imbriqué (`['licenses', 0, 'number']`).
 * @param {Record<string, unknown>} target
 * @param {(string|number)[]} path
 * @param {unknown} value
 */
function setPath(target, path, value) {
  let cursor = target;
  path.forEach((key, index) => {
    if (index === path.length - 1) {
      // Le premier message rencontré fait foi : RHF affiche une erreur par champ.
      if (cursor[key] === undefined) cursor[key] = value;
      return;
    }
    if (cursor[key] === undefined) {
      cursor[key] = typeof path[index + 1] === 'number' ? [] : {};
    }
    cursor = cursor[key];
  });
}

/**
 * Adaptateur zod → React Hook Form.
 *
 * Écrit ici plutôt qu'importé de `@hookform/resolvers` : ce paquet tire une
 * chaîne de dépendances optionnelles (`@typeschema`, `valibot`) dont le graphe
 * de pairs est cassé, alors que l'adaptation tient en une vingtaine de lignes
 * et nous laisse la main sur le format des messages.
 *
 * @param {import('zod').ZodType} schema
 * @returns {(values: unknown) => Promise<{values: unknown, errors: object}>}
 *
 * @example
 * useForm({ resolver: zodResolver(citizenSchema), defaultValues })
 */
export function zodResolver(schema) {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path : ['root'];
      setPath(errors, path, { type: issue.code, message: issue.message });
    }

    return { values: {}, errors };
  };
}
