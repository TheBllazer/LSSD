import {
  col,
  docRef,
  subCol,
  subDoc,
  getDoc,
  getDocs,
  setDoc,
  query as fsQuery,
  where,
  orderBy,
  limit as fsLimit,
  startAfter,
  documentId,
  writeBatch,
  increment,
  serverTimestamp,
  requireDb,
} from '@/firebase/db';
import { COLLECTIONS, DOC_IDS, searchIndexKey } from '@/firebase/paths';
import { buildAuditEntry } from '@/services/audit.service';
import { buildSearchTokens, toQueryToken } from '@/utils/tokens';
import { AUDIT_ACTIONS } from '@/types/agents';
import { PAGINATION } from '@/app/config/constants';

/**
 * Fabrique de services CRUD.
 *
 * Tous les registres (citoyens, véhicules, armes, rapports, casiers) partagent
 * exactement les mêmes invariants ; les écrire une fois évite qu'ils divergent
 * module après module :
 *
 *  1. **Atomicité** — une création ou une modification, sa trace d'audit, son
 *     événement d'historique, son entrée d'index de recherche et ses compteurs
 *     partent dans un seul `writeBatch`. Rien ne peut être à moitié écrit.
 *  2. **Aucune suppression physique** — `remove()` pose `deletedAt` ; la donnée
 *     reste consultable par un administrateur et les liens ne se brisent pas.
 *  3. **Index de recherche systématique** — impossible de créer une fiche
 *     introuvable par la recherche globale.
 *  4. **Curseurs sérialisables** — la pagination transporte des valeurs, pas
 *     des `DocumentSnapshot`, pour que le cache TanStack Query soit persistable
 *     en IndexedDB.
 *
 * @typedef {object} CrudConfig
 * @property {string} collection      Nom de collection (`COLLECTIONS.*`)
 * @property {string} entityType      Type court (`citizen`, `vehicle`, …)
 * @property {(doc: object) => string} labelOf      Libellé affiché
 * @property {(doc: object) => string[]} tokensOf   Champs à indexer
 * @property {(doc: object) => string} [subtitleOf] Sous-titre de l'index
 * @property {(doc: object) => string} [photoOf]    URL de vignette
 * @property {string} [statKey]       Clé de compteur dans `stats/dashboard`
 * @property {(id: string) => string[]} [historyPath] Chemin de l'historique
 * @property {{field: string, direction: 'asc'|'desc'}} [defaultOrder]
 * @property {string} [searchOrderField] Champ de tri lors d'une recherche serveur
 */

/**
 * Construit l'événement d'historique attaché à une fiche.
 *
 * @param {object} actor
 * @param {object} event
 * @param {string} event.type
 * @param {string} event.label
 * @param {string} [event.refType]
 * @param {string} [event.refId]
 * @param {Record<string, unknown>} [event.meta]
 * @returns {object}
 */
export function buildHistoryEvent(actor, event) {
  return {
    type: event.type,
    label: event.label,
    refType: event.refType ?? null,
    refId: event.refId ?? null,
    meta: event.meta ?? null,
    at: serverTimestamp(),
    byUid: actor?.uid ?? null,
    byName: actor?.name ?? 'Système',
  };
}

/**
 * Compare deux états d'un document et retourne les champs réellement modifiés.
 * Sert à rendre l'historique lisible (« Statut : CLEAR → WANTED ») plutôt que
 * d'enregistrer un opaque « fiche modifiée ».
 *
 * @param {object} before
 * @param {object} after
 * @param {string[]} [ignore]
 * @returns {{field: string, from: unknown, to: unknown}[]}
 */
export function diffFields(before = {}, after = {}, ignore = []) {
  const skipped = new Set([
    'updatedAt',
    'updatedBy',
    'createdAt',
    'createdBy',
    'searchTokens',
    ...ignore,
  ]);

  const changes = [];
  for (const [field, value] of Object.entries(after)) {
    if (skipped.has(field)) continue;
    const previous = before[field];
    if (JSON.stringify(previous ?? null) === JSON.stringify(value ?? null)) continue;
    changes.push({ field, from: previous ?? null, to: value ?? null });
  }
  return changes;
}

/**
 * Crée un service CRUD complet pour une collection.
 *
 * @param {CrudConfig} config
 */
export function createCrudService(config) {
  const {
    collection,
    entityType,
    labelOf,
    tokensOf,
    subtitleOf = () => '',
    photoOf = () => null,
    statKey = null,
    historyPath = null,
    defaultOrder = { field: 'updatedAt', direction: 'desc' },
    searchOrderField = null,
  } = config;

  /* ------------------------------------------------------------- écritures */

  /**
   * Ajoute au lot l'entrée d'index de recherche correspondant au document.
   * @param {import('firebase/firestore').WriteBatch} batch
   * @param {string} id
   * @param {object} data
   */
  function stageSearchIndex(batch, id, data) {
    batch.set(
      docRef(COLLECTIONS.SEARCH_INDEX, searchIndexKey(entityType, id)),
      {
        type: entityType,
        refId: id,
        label: labelOf(data),
        subtitle: subtitleOf(data),
        photoUrl: photoOf(data),
        status: data.status ?? null,
        tokens: buildSearchTokens(tokensOf(data)),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  /**
   * Ajoute au lot l'incrément d'un compteur du tableau de bord.
   * @param {import('firebase/firestore').WriteBatch} batch
   * @param {number} delta
   */
  function stageStat(batch, delta) {
    if (!statKey) return;
    batch.set(
      docRef(COLLECTIONS.STATS, DOC_IDS.DASHBOARD_STATS),
      { [statKey]: increment(delta), updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  /**
   * Ajoute au lot une entrée d'audit.
   * @param {import('firebase/firestore').WriteBatch} batch
   * @param {object} actor
   * @param {string} action
   * @param {string} id
   * @param {string} label
   * @param {Record<string, unknown>} [meta]
   */
  function stageAudit(batch, actor, action, id, label, meta) {
    batch.set(
      docRef(COLLECTIONS.AUDIT_LOGS, generateId()),
      buildAuditEntry(actor, {
        action,
        entityType,
        entityId: id,
        entityLabel: label,
        meta,
      }),
    );
  }

  /**
   * Ajoute au lot un événement d'historique de fiche.
   * @param {import('firebase/firestore').WriteBatch} batch
   * @param {string} id
   * @param {object} actor
   * @param {object} event
   */
  function stageHistory(batch, id, actor, event) {
    if (!historyPath) return;
    const ref = subDoc(historyPath(id), generateId());
    batch.set(ref, buildHistoryEvent(actor, event));
  }

  /**
   * Crée un document.
   *
   * @param {object} data                     Données validées
   * @param {object} options
   * @param {object} options.actor            `{ uid, name }`
   * @param {(batch, id) => void} [options.onBatch] Écritures liées supplémentaires
   * @returns {Promise<{id: string} & object>}
   */
  async function create(data, { actor, onBatch } = {}) {
    const ref = docRef(collection, generateId());
    const payload = {
      ...data,
      searchTokens: buildSearchTokens(tokensOf(data)),
      deletedAt: null,
      createdAt: serverTimestamp(),
      createdBy: actor?.uid ?? null,
      updatedAt: serverTimestamp(),
      updatedBy: actor?.uid ?? null,
    };

    const batch = writeBatch(requireDb());
    batch.set(ref, payload);
    stageSearchIndex(batch, ref.id, data);
    stageStat(batch, 1);
    stageAudit(batch, actor, AUDIT_ACTIONS.CREATE, ref.id, labelOf(data));
    stageHistory(batch, ref.id, actor, {
      type: 'CREATED',
      label: 'Fiche créée',
    });
    onBatch?.(batch, ref.id);

    await batch.commit();
    return { id: ref.id, ...data };
  }

  /**
   * Met à jour un document.
   *
   * @param {string} id
   * @param {object} patch                    Champs modifiés (déjà validés)
   * @param {object} options
   * @param {object} options.actor
   * @param {object} [options.previous]       État précédent, pour l'historique
   * @param {(batch: object) => void} [options.onBatch]
   * @returns {Promise<void>}
   */
  async function update(id, patch, { actor, previous, onBatch } = {}) {
    const merged = { ...(previous ?? {}), ...patch };

    const payload = {
      ...patch,
      searchTokens: buildSearchTokens(tokensOf(merged)),
      updatedAt: serverTimestamp(),
      updatedBy: actor?.uid ?? null,
    };

    const batch = writeBatch(requireDb());
    batch.set(docRef(collection, id), payload, { merge: true });
    stageSearchIndex(batch, id, merged);

    const changes = previous ? diffFields(previous, patch) : [];
    stageAudit(batch, actor, AUDIT_ACTIONS.UPDATE, id, labelOf(merged), {
      fields: changes.map((change) => change.field),
    });

    if (changes.length > 0) {
      stageHistory(batch, id, actor, {
        type: 'UPDATED',
        label:
          changes.length === 1
            ? `Champ modifié : ${changes[0].field}`
            : `${changes.length} champs modifiés`,
        meta: { changes },
      });
    }

    onBatch?.(batch);
    await batch.commit();
  }

  /**
   * Archive un document (suppression logique).
   *
   * @param {string} id
   * @param {object} options
   * @param {object} options.actor
   * @param {string} [options.reason]  Motif saisi dans la boîte de confirmation
   * @param {object} [options.previous]
   * @returns {Promise<void>}
   */
  async function remove(id, { actor, reason, previous } = {}) {
    const batch = writeBatch(requireDb());

    batch.set(
      docRef(collection, id),
      {
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: actor?.uid ?? null,
      },
      { merge: true },
    );

    // L'entrée d'index disparaît : une fiche archivée ne remonte plus dans la
    // recherche globale, mais reste accessible par son identifiant.
    batch.delete(docRef(COLLECTIONS.SEARCH_INDEX, searchIndexKey(entityType, id)));
    stageStat(batch, -1);
    stageAudit(batch, actor, AUDIT_ACTIONS.DELETE, id, labelOf(previous ?? {}), {
      reason: reason ?? null,
    });
    stageHistory(batch, id, actor, {
      type: 'ARCHIVED',
      label: reason ? `Fiche archivée — ${reason}` : 'Fiche archivée',
    });

    await batch.commit();
  }

  /**
   * Restaure un document archivé.
   * @param {string} id
   * @param {{actor: object, previous?: object}} options
   * @returns {Promise<void>}
   */
  async function restore(id, { actor, previous } = {}) {
    const batch = writeBatch(requireDb());

    batch.set(
      docRef(collection, id),
      {
        deletedAt: null,
        updatedAt: serverTimestamp(),
        updatedBy: actor?.uid ?? null,
      },
      { merge: true },
    );

    if (previous) stageSearchIndex(batch, id, previous);
    stageStat(batch, 1);
    stageAudit(batch, actor, AUDIT_ACTIONS.UPDATE, id, labelOf(previous ?? {}), {
      restored: true,
    });
    stageHistory(batch, id, actor, { type: 'RESTORED', label: 'Fiche restaurée' });

    await batch.commit();
  }

  /* -------------------------------------------------------------- lectures */

  /**
   * Lit un document par son identifiant.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async function get(id) {
    if (!id) return null;
    const snapshot = await getDoc(docRef(collection, id));
    return snapshot.exists() ? snapshot.data() : null;
  }

  /**
   * Liste paginée.
   *
   * @param {object} params
   * @param {{field: string, op: string, value: unknown}[]} [params.filters]
   * @param {string} [params.search]        Saisie utilisateur
   * @param {string} [params.orderField]
   * @param {'asc'|'desc'} [params.orderDirection]
   * @param {number} [params.pageSize]
   * @param {[unknown, string]|null} [params.cursor] `[valeurDeTri, id]`
   * @param {boolean} [params.includeDeleted]
   * @returns {Promise<{items: object[], cursor: [unknown, string]|null, hasMore: boolean}>}
   */
  async function listPage({
    filters = [],
    search = '',
    orderField = defaultOrder.field,
    orderDirection = defaultOrder.direction,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
    cursor = null,
    includeDeleted = false,
  } = {}) {
    const constraints = [];

    if (!includeDeleted) constraints.push(where('deletedAt', '==', null));

    for (const filter of filters) {
      if (filter.value === undefined || filter.value === null || filter.value === '') continue;
      constraints.push(where(filter.field, filter.op ?? '==', filter.value));
    }

    // Recherche serveur : un seul `array-contains` est permis par requête, et
    // il impose son propre champ de tri (index composite déclaré).
    const token = search ? toQueryToken(search) : null;
    let sortField = orderField;
    if (token) {
      constraints.push(where('searchTokens', 'array-contains', token));
      sortField = searchOrderField ?? orderField;
    }

    constraints.push(orderBy(sortField, orderDirection));
    // Départage les valeurs identiques et rend le curseur déterministe.
    constraints.push(orderBy(documentId(), orderDirection));

    if (cursor) constraints.push(startAfter(cursor[0], cursor[1]));

    // Une ligne de plus que demandé : permet de savoir s'il reste une page.
    constraints.push(fsLimit(pageSize + 1));

    const snapshot = await getDocs(fsQuery(col(collection), ...constraints));
    const docs = snapshot.docs.map((document) => document.data());

    const hasMore = docs.length > pageSize;
    const items = hasMore ? docs.slice(0, pageSize) : docs;
    const last = items.at(-1);

    return {
      items,
      hasMore,
      cursor: last ? [last[sortField] ?? null, last.id] : null,
    };
  }

  /**
   * Liste complète (sans pagination) — réservée aux petits ensembles :
   * listes déroulantes, sélecteurs, exports ciblés.
   *
   * @param {object} [params] Mêmes filtres que `listPage`
   * @param {number} [params.max=500] Garde-fou
   * @returns {Promise<object[]>}
   */
  async function listAll({ max = 500, ...params } = {}) {
    const page = await listPage({ ...params, pageSize: max });
    return page.items;
  }

  /**
   * Historique d'une fiche, du plus récent au plus ancien.
   * @param {string} id
   * @param {number} [max=100]
   * @returns {Promise<object[]>}
   */
  async function history(id, max = 100) {
    if (!historyPath || !id) return [];
    const snapshot = await getDocs(
      fsQuery(subCol(historyPath(id)), orderBy('at', 'desc'), fsLimit(max)),
    );
    return snapshot.docs.map((document) => document.data());
  }

  /**
   * Ajoute manuellement un événement d'historique (liaison d'un véhicule,
   * changement de statut décidé par un autre module…).
   *
   * @param {string} id
   * @param {object} actor
   * @param {object} event
   * @returns {Promise<void>}
   */
  async function addHistory(id, actor, event) {
    if (!historyPath) return;
    await setDoc(
      subDoc(historyPath(id), generateId()),
      buildHistoryEvent(actor, event),
    );
  }

  return {
    collection,
    entityType,
    labelOf,
    create,
    update,
    remove,
    restore,
    get,
    listPage,
    listAll,
    history,
    addHistory,
    // Exposés pour les services métier qui composent leurs propres lots.
    stageSearchIndex,
    stageStat,
    stageAudit,
    stageHistory,
  };
}

/**
 * Génère un identifiant de document côté client.
 * Firestore accepte les identifiants générés localement : cela permet de
 * connaître l'ID avant le commit et donc de le référencer dans le même lot.
 * @returns {string}
 */
export function generateId() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const random = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(random, (byte) => alphabet[byte % alphabet.length]).join('');
}
