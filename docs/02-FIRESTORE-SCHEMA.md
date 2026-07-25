# LSSD RMS — Schéma Firestore

Conventions communes à **tous** les documents :

```jsonc
{
  "createdAt":  "Timestamp",
  "createdBy":  "uid",          // agent auteur
  "updatedAt":  "Timestamp",
  "updatedBy":  "uid",
  "deletedAt":  "Timestamp|null", // soft delete — jamais de suppression physique
  "searchTokens": ["str", ...]    // tokens minuscules pour la recherche (max 60)
}
```

* Les **relations sont des IDs** (`string`), jamais des `DocumentReference`
  (sérialisation simple, cache TanStack Query, export PDF trivial).
* Dénormalisation autorisée **uniquement** pour l'affichage : `{id, label, photoUrl}`
  sous le suffixe `Snapshot` (ex. `ownerSnapshot`). Rafraîchie par le service parent.
* Toutes les dates métier (naissance, faits) sont des `Timestamp`, jamais des chaînes.

---

## 1. Cartographie des collections

```
/agents/{uid}                          Annuaire du personnel (1 doc = 1 compte Auth)
   └─ /activity/{activityId}           Connexions, actions notables
/permissions/{uid}                     Doc "léger" lu par les Security Rules
/citizens/{citizenId}
   ├─ /history/{eventId}               Chronologie (créé, modifié, arrêté, cité…)
   ├─ /photos/{photoId}                Galerie (URLs PostImage)
   └─ /notes/{noteId}                  Notes internes horodatées
/vehicles/{vehicleId}
   └─ /history/{eventId}
/weapons/{weaponId}
   └─ /history/{eventId}
/reports/{reportId}
   ├─ /revisions/{revisionId}          Auto-save (rolling 30)
   ├─ /attachments/{attachmentId}
   └─ /comments/{commentId}
/criminalRecords/{recordId}
   └─ /comments/{commentId}
/mapFeatures/{featureId}               Points, cercles, polygones, zones
/searchIndex/{entityKey}               Index plat global (Spotlight CTRL+K)
/auditLogs/{logId}                     Journal immuable (lecture admin)
/notifications/{notificationId}        Ciblées agent ou diffusion
/presence/{uid}                        Agents connectés (heartbeat)
/counters/{counterId}                  Séquences (numéros de rapport, de casier)
/stats/{docId}                         Agrégats dashboard (doc unique "dashboard")
/settings/{docId}                      Config app (grades, types, unités, PDF)
```

---

## 2. `/agents/{uid}`

```jsonc
{
  "uid": "aBcD…",
  "badgeNumber": "1042",              // unique
  "firstName": "John", "lastName": "Marston",
  "photoUrl": "https://i.postimg.cc/…",
  "email": "j.marston@lssd.gov",
  "phone": "555-0142",
  "rank": "SERGEANT",                 // enum RANKS
  "role": "SERGEANT",                 // enum ROLES (= base de permissions)
  "division": "PATROL",               // PATROL | INVESTIGATIONS | SWAT | AIR | TRAFFIC | CUSTODY | ADMIN
  "service": "Station Vespucci",
  "callsign": "1L-24",
  "hiredAt": "Timestamp",
  "status": "ACTIVE",                 // ACTIVE | LEAVE | SUSPENDED | INACTIVE
  "certifications": ["FTO", "K9"],
  "supervisorId": "uid|null",
  "lastLoginAt": "Timestamp|null",
  "loginCount": 128,
  "notes": "…"
}
```

## 3. `/permissions/{uid}` — document d'autorité des règles

Volontairement minuscule : lu par `get()` dans **chaque** règle Firestore.

```jsonc
{
  "role": "SERGEANT",
  "level": 50,                        // hiérarchie numérique
  "grants": ["reports.validate"],     // permissions ajoutées hors rôle (modèle d'édition)
  "revokes": ["citizens.delete"],     // permissions retirées (modèle d'édition)
  "abilities": ["citizens.read", "…"],// LISTE EFFECTIVE compilée — seule lue par les règles
  "disabled": false                   // coupe-circuit immédiat
}
```
> `abilities = ROLE_DEFAULTS[role] ∪ grants \ revokes`, calculé par
> `utils/permissions.js::compileAbilities()` et écrit par `agents.service.js`.
> Écriture réservée à `admin.permissions`. Un agent ne peut **jamais** modifier le sien.

---

## 4. `/citizens/{citizenId}`

```jsonc
{
  "photoUrl": "https://i.postimg.cc/…",
  "firstName": "Michael", "lastName": "De Santa",
  "aliases": ["Michael Townley"],
  "birthDate": "Timestamp",
  "sex": "M",                          // M | F | X
  "height": 182, "weight": 88,         // cm / kg
  "eyeColor": "BROWN", "hairColor": "BLACK",
  "phone": "555-0199", "email": "…",
  "address": { "street": "1 Portola Dr", "district": "Rockford Hills", "postal": "90210" },
  "occupation": "Producteur", "employer": "Richards Majestic",
  "affiliations": [{ "type": "GANG|ORG|BUSINESS", "name": "Ballas", "role": "Membre" }],
  "licenses": [{ "type": "DRIVER|FIREARM|HUNTING|PILOT|COMMERCIAL",
                 "number": "DL-88421", "status": "VALID|SUSPENDED|REVOKED|EXPIRED",
                 "issuedAt": "Timestamp", "expiresAt": "Timestamp" }],
  "status": "CLEAR",                   // CLEAR | WANTED | INCARCERATED | PROBATION | DECEASED | MISSING
  "flags": ["ARMED_DANGEROUS", "MENTAL_HEALTH", "GANG_MEMBER"],
  "description": "…",
  "distinctiveMarks": "Cicatrice avant-bras droit",
  "tattoos": [{ "location": "Bras gauche", "description": "Tête de mort", "photoUrl": "…" }],
  "notes": "…",
  "counters": { "reports": 4, "vehicles": 2, "weapons": 1, "records": 3 }, // dénormalisé
  "lastSeenAt": "Timestamp|null"
}
```

**Sous-collections**

| Chemin | Contenu |
|---|---|
| `/citizens/{id}/history/{eventId}` | `{ type: "CREATED\|UPDATED\|ARREST\|CITATION\|REPORT_LINKED\|VEHICLE_ADDED\|…", label, refType, refId, at, byUid, byName, diff? }` |
| `/citizens/{id}/photos/{photoId}` | `{ url, caption, category: "MUGSHOT\|SCENE\|TATTOO\|OTHER", takenAt, addedBy }` |
| `/citizens/{id}/notes/{noteId}` | `{ body, authorUid, authorName, createdAt, pinned }` |

---

## 5. `/vehicles/{vehicleId}`

```jsonc
{
  "plate": "46EEK572",                 // unique, majuscules
  "vin": "1HGBH41JXMN109186",
  "make": "Bravado", "model": "Buffalo STX", "year": 2021,
  "color": "Noir", "type": "SEDAN",    // SEDAN|SUV|TRUCK|MOTORCYCLE|VAN|EMERGENCY|BOAT|AIRCRAFT
  "insurance": { "status": "VALID|EXPIRED|NONE", "company": "Mors Mutual", "expiresAt": "Timestamp" },
  "registrationStatus": "VALID|EXPIRED|SUSPENDED|STOLEN|IMPOUNDED|DESTROYED",
  "condition": "Bon état, pare-chocs avant enfoncé",
  "description": "…",
  "photoUrl": "…", "photos": ["…"],
  "ownerId": "citizenId|null",
  "ownerSnapshot": { "id": "…", "label": "Michael De Santa", "photoUrl": "…" },
  "flags": ["STOLEN", "BOLO"],
  "impound": { "isImpounded": false, "lot": null, "since": null, "reason": null }
}
```
`/vehicles/{id}/history/{eventId}` : changements de propriétaire, saisies, signalements.

---

## 6. `/weapons/{weaponId}`

```jsonc
{
  "serialNumber": "SN-77-A4192",       // unique
  "make": "Vom Feuer", "model": "Combat Pistol",
  "caliber": ".45 ACP",
  "category": "HANDGUN|RIFLE|SHOTGUN|SMG|SNIPER|MELEE|EXPLOSIVE|OTHER",
  "classification": "CIVIL|RESTRICTED|PROHIBITED|LAW_ENFORCEMENT",
  "registeredAt": "Timestamp",
  "status": "REGISTERED|SEIZED|STOLEN|DESTROYED|LOST",
  "ownerId": "citizenId|null",
  "ownerSnapshot": { … },
  "licenseId": "string|null",          // référence licences[] du citoyen
  "licenseSnapshot": { "number": "FA-2291", "status": "VALID" },
  "photoUrl": "…",
  "notes": "…"
}
```

---

## 7. `/reports/{reportId}`

```jsonc
{
  "number": "LSSD-2026-000148",        // généré par transaction sur /counters/reports
  "title": "Vol à main armée — Vespucci Beach",
  "type": "INCIDENT|ARREST|TRAFFIC|USE_OF_FORCE|FIELD_INTERVIEW|SUPPLEMENTAL|WARRANT|MISSING_PERSON",
  "classification": "PUBLIC|RESTRICTED|CONFIDENTIAL|SEALED",
  "status": "DRAFT|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|CLOSED",
  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
  "occurredAt": "Timestamp",
  "location": { "label": "Vespucci Beach", "district": "Vespucci", "lat": 0, "lng": 0 },
  "summary": "Résumé une ligne",
  "content": { /* JSON TipTap */ },
  "contentText": "version texte plate — alimente searchTokens et le PDF",
  "involvedAgents":   [{ "uid": "…", "name": "…", "badge": "…", "role": "PRIMARY|ASSIST|SUPERVISOR|WITNESS" }],
  "involvedCitizens": [{ "id": "…", "name": "…", "photoUrl": "…", "role": "SUSPECT|VICTIM|WITNESS|COMPLAINANT|OTHER" }],
  "involvedVehicles": [{ "id": "…", "plate": "…", "role": "SUSPECT|VICTIM|IMPOUNDED" }],
  "involvedWeapons":  [{ "id": "…", "serialNumber": "…", "role": "USED|SEIZED|FOUND" }],
  "charges": [{ "code": "PC 211", "label": "Vol qualifié", "citizenId": "…" }],
  "photos": ["https://i.postimg.cc/…"],
  "signature": { "uid": "…", "name": "…", "badge": "…", "signedAt": "Timestamp" },
  "review": { "byUid": "…", "byName": "…", "at": "Timestamp", "comment": "…" },
  "lockedBy": { "uid": "…", "name": "…", "at": "Timestamp" } // verrou d'édition
}
```

| Sous-collection | Contenu |
|---|---|
| `/revisions/{revisionId}` | `{ content, contentText, savedAt, savedBy, auto: true\|false }` — 30 dernières |
| `/attachments/{id}` | `{ url, name, kind: "IMAGE\|LINK\|DOC", size?, addedBy, addedAt }` |
| `/comments/{id}` | `{ body, authorUid, authorName, createdAt }` |

---

## 8. `/criminalRecords/{recordId}`

```jsonc
{
  "number": "CR-2026-00087",
  "citizenId": "…",
  "citizenSnapshot": { "id": "…", "label": "…", "photoUrl": "…" },
  "date": "Timestamp",
  "type": "FELONY|MISDEMEANOR|INFRACTION|CITATION|WARRANT",
  "charges": [{ "code": "PC 187", "label": "Homicide", "degree": "1", "counts": 1 }],
  "disposition": "CONVICTED|ACQUITTED|DISMISSED|PENDING|PLEA",
  "sentence": { "prisonDays": 180, "probationDays": 0, "communityServiceHours": 0, "fineAmount": 12500 },
  "court": "Los Santos Superior Court",
  "judge": "Hon. R. Blackwell",
  "prosecutor": "…", "defenseAttorney": "…",
  "arrestingAgent": { "uid": "…", "name": "…", "badge": "…" },
  "reportId": "reportId|null",
  "mugshotUrl": "…", "photos": ["…"],
  "status": "ACTIVE|SERVED|EXPUNGED|APPEALED",
  "notes": "…"
}
```

---

## 9. `/mapFeatures/{featureId}`

```jsonc
{
  "name": "Zone de patrouille Davis",
  "kind": "POINT|CIRCLE|POLYGON|POLYLINE|RECTANGLE",
  "category": "PATROL_ZONE|CRIME_SCENE|GANG_TERRITORY|CHECKPOINT|SAFE_HOUSE|EVIDENCE|POI|INCIDENT",
  "geometry": {
    "center": { "x": 1234.5, "y": -678.9 },   // CRS.Simple, unités carte
    "radius": 250,                            // CIRCLE
    "points": [{ "x": 0, "y": 0 }]            // POLYGON | POLYLINE | RECTANGLE
  },
  "style": { "color": "#1E88E5", "fillOpacity": 0.25, "weight": 2, "icon": "MdLocalPolice" },
  "description": "…",
  "linkedType": "REPORT|CITIZEN|VEHICLE|null", "linkedId": "…|null",
  "visibility": "ALL|DIVISION|PRIVATE",
  "division": "PATROL|null"
}
```

---

## 10. `/searchIndex/{entityKey}` — moteur Spotlight

`entityKey = "{type}_{id}"` (ex. `citizen_a91Kd…`). Documents ultra-légers, chargés
une fois puis conservés en IndexedDB et rafraîchis par delta sur `updatedAt`.

```jsonc
{
  "type": "citizen|vehicle|weapon|report|record|agent|mapFeature",
  "refId": "…",
  "label": "Michael De Santa",
  "subtitle": "H · 1978-04-12 · WANTED",
  "photoUrl": "…",
  "tokens": ["mic","mich","michael","des","desa","santa","wanted"],
  "status": "WANTED",
  "updatedAt": "Timestamp"
}
```

**Tokenisation** (`utils/tokens.js`) : minuscules, suppression des accents,
découpage sur `[\s\-_/,.]`, préfixes de 2 à 12 caractères, plafond 60 tokens.
Recherche Firestore : `where('tokens','array-contains', q)` ; recherche instantanée
locale : filtrage en mémoire sur l'index mis en cache (0 lecture).

---

## 11. Collections techniques

| Collection | Document | Rôle |
|---|---|---|
| `/auditLogs/{logId}` | `{ at, actorUid, actorName, action, entityType, entityId, entityLabel, meta }` | Journal immuable (création/lecture seulement). `action` ∈ `CREATE\|UPDATE\|DELETE\|VIEW\|SEARCH\|EXPORT\|LOGIN\|LOGOUT\|PERMISSION_CHANGE`. |
| `/presence/{uid}` | `{ uid, name, badge, rank, photoUrl, status: "ONLINE\|AWAY\|BUSY", callsign, lastHeartbeat }` | Agents connectés (heartbeat 60 s, `onSnapshot` sur le dashboard). |
| `/notifications/{id}` | `{ title, body, level, targetUid\|null, targetRole\|null, entityType, entityId, createdAt, readBy: [] }` | Cloche + toasts. |
| `/counters/{name}` | `{ year: 2026, value: 148 }` | Numérotation via `runTransaction`. Documents : `reports`, `criminalRecords`, `citizens`. |
| `/stats/dashboard` | `{ citizens, vehicles, weapons, reports, arrests, wanted, updatedAt, byMonth: {"2026-07": {...}}, byType: {...} }` | Agrégats incrémentés par `increment()` dans les batches d'écriture → dashboard à **1 lecture**. |
| `/settings/app` | `{ ranks[], divisions[], reportTypes[], chargeCodes[], districts[], pdf: {header, footer, agency} }` | Référentiels éditables sans redéploiement. |
| `/agents/{uid}/favorites/{id}` | `{ type, refId, label, addedAt }` | Favoris personnels. |
| `/agents/{uid}/recentSearches/{id}` | `{ query, at, resultsCount }` | « Dernières recherches » du dashboard. |

---

## 12. Index composites (`firebase/firestore.indexes.json`)

| Collection | Champs | Usage |
|---|---|---|
| citizens | `deletedAt ASC, lastName ASC, firstName ASC` | Liste alphabétique |
| citizens | `deletedAt ASC, status ASC, updatedAt DESC` | Filtre statut / recherchés |
| citizens | `searchTokens ARRAY, lastName ASC` | Recherche serveur |
| vehicles | `deletedAt ASC, plate ASC` · `ownerId ASC, updatedAt DESC` · `flags ARRAY, updatedAt DESC` | Liste, fiche citoyen, BOLO |
| weapons | `deletedAt ASC, registeredAt DESC` · `ownerId ASC, registeredAt DESC` | Liste, fiche citoyen |
| reports | `deletedAt ASC, occurredAt DESC` · `status ASC, occurredAt DESC` · `type ASC, occurredAt DESC` · `involvedCitizenIds ARRAY, occurredAt DESC` · `createdBy ASC, updatedAt DESC` | Liste, filtres, fiche citoyen, « mes rapports » |
| criminalRecords | `citizenId ASC, date DESC` · `deletedAt ASC, date DESC` · `type ASC, date DESC` | Casier, liste |
| mapFeatures | `category ASC, updatedAt DESC` · `visibility ASC, updatedAt DESC` | Filtres carte |
| auditLogs | `entityType ASC, entityId ASC, at DESC` · `actorUid ASC, at DESC` | Historique de fiche, activité agent |
| searchIndex | `type ASC, updatedAt DESC` · `tokens ARRAY, type ASC` | Spotlight |
| notifications | `targetUid ASC, createdAt DESC` · `targetRole ASC, createdAt DESC` | Cloche |

> **Champs miroir** : `reports.involvedCitizenIds`, `involvedVehicleIds`,
> `involvedWeaponIds`, `involvedAgentUids` sont des tableaux d'IDs plats maintenus
> par le service en parallèle des objets `involved*` — indispensables pour
> `array-contains` (Firestore ne sait pas indexer un champ d'objet dans un tableau).

---

## 13. Graphe relationnel

```
                       ┌──────────────┐
             ┌────────►│   CITIZEN    │◄────────────┐
             │         └──────┬───────┘             │
             │                │ citizenId           │ ownerId
   ownerId   │                │                     │
   ┌─────────┴────┐   ┌───────▼────────┐   ┌────────┴──────┐
   │   VEHICLE    │   │ CRIMINAL RECORD│   │    WEAPON     │
   └──────┬───────┘   └───────┬────────┘   └───────┬───────┘
          │ involvedVehicleIds│ reportId           │ involvedWeaponIds
          └────────────┬──────┴────────────────────┘
                       ▼
                 ┌───────────┐   involvedAgentUids   ┌────────┐
                 │  REPORT   │◄─────────────────────►│ AGENT  │
                 └─────┬─────┘                       └────────┘
                       │ linkedId
                       ▼
                 ┌────────────┐
                 │ MAP FEATURE│
                 └────────────┘
```

**Règles d'intégrité appliquées côté service (`writeBatch` atomique)** :
1. Lier un véhicule à un citoyen → maj `vehicle.ownerId` + `vehicle.ownerSnapshot`
   + `citizen.counters.vehicles` (`increment`) + événement `citizens/{id}/history`.
2. Créer un casier → maj `citizen.counters.records`, `citizen.status` si
   incarcération, `stats/dashboard.arrests`, entrée d'historique, notification.
3. Supprimer (soft) un citoyen → ses véhicules/armes passent `ownerId = null`
   avec `ownerSnapshot` conservé (traçabilité) ; les rapports restent intacts.
4. Toute écriture met à jour `/searchIndex/{type}_{id}` dans le même batch.
