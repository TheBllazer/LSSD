# LSSD RMS — Authentification, rôles et règles de sécurité

---

## 1. Firebase Authentication

| Point | Décision |
|---|---|
| Fournisseur | **E-mail / mot de passe uniquement**. Google/Anonyme désactivés dans la console. |
| Inscription publique | **Aucune UI d'inscription.** Le réglage Firebase *Enable create (sign-up)* reste techniquement coché — il ne peut pas être réservé aux administrateurs (cf. §1 bis) — mais un compte sans document `/permissions/{uid}` ne peut rien lire : l'application affiche « Compte non provisionné — contactez un administrateur ». |
| Création de comptes | Depuis `AgentCreateAccountDialog`, via une **instance Firebase secondaire** : `initializeApp(config, 'provisioning')` → `createUserWithEmailAndPassword` → `signOut(secondaryAuth)`. La session de l'administrateur n'est jamais interrompue. |
| Persistance | `browserLocalPersistence` si « Rester connecté », sinon `browserSessionPersistence`. |
| Réinitialisation | `sendPasswordResetEmail` déclenché par un administrateur (pas de lien public sur l'écran de connexion). |
| Désactivation | `permissions/{uid}.disabled = true` → coupe-circuit **immédiat** côté règles, sans attendre l'expiration du jeton. Complété par la désactivation du compte dans la console pour le cas définitif. |
| Journalisation | `LOGIN` / `LOGOUT` écrits dans `/auditLogs` + mise à jour de `agents/{uid}.lastLoginAt`. |
| App Check | reCAPTCHA v3 (`VITE_RECAPTCHA_SITE_KEY`), mode debug en local. Attaché **aux deux instances** — principale et provisionnement. Mise en service : §1 ter. |

> **Rappel** : la clé API Firebase d'une application web est publique par conception.
> Elle n'autorise rien à elle seule — la sécurité repose intégralement sur les
> règles Firestore ci-dessous.

### 1 bis. Pourquoi la création de comptes reste ouverte côté Firebase

Le réglage *Authentication → Settings → User actions → Enable create (sign-up)*
doit rester **coché**. C'est une contrainte de Firebase, pas un choix de
confort : `createUserWithEmailAndPassword` est un appel **non authentifié** —
créer un compte, c'est devenir un nouvel utilisateur. Firebase n'a donc aucun
appelant à inspecter et ne peut pas réserver l'opération aux administrateurs.
Le réglage est binaire et global ; la seule alternative serait le SDK Admin,
donc un serveur.

La porte est refermée par deux mécanismes indépendants :

| Mécanisme | Ce qu'il empêche |
|---|---|
| **App Check** (reCAPTCHA v3) | Les appels qui ne proviennent pas de l'application déclarée. Un script tiers muni de la clé API publique est rejeté avant d'atteindre Auth. |
| **Absence de `/permissions/{uid}`** | Un compte créé hors du terminal n'a aucune habilitation. Il peut s'authentifier, et rien d'autre : chaque règle passe par `perms()`, qui échoue. L'écran « Compte non provisionné » s'affiche. |

Le premier filtre l'accès à l'API, le second rend inoffensif tout compte qui
passerait quand même. Aucun des deux ne dépend de l'interface.

> **App Check est attaché à une instance Firebase, pas au projet.** L'instance
> secondaire de provisionnement (`lssd-provisioning`) doit donc être attestée
> elle aussi. Sans cela, la création de comptes — et elle seule — échouerait dès
> l'activation de l'enforcement, le reste de l'application continuant de
> fonctionner : une panne qu'on ne relie pas spontanément à sa cause.

### 1 ter. Mise en service d'App Check

1. **Console Firebase → App Check → Applications → enregistrer l'application web**,
   fournisseur **reCAPTCHA v3**. Firebase renvoie une *clé de site*.
2. Renseigner `VITE_RECAPTCHA_SITE_KEY` dans `.env.local` **puis reconstruire** :
   la clé est lue au moment du build, pas à l'exécution.
3. Déployer, vérifier que l'application fonctionne — les jetons sont émis et
   comptabilisés alors même que l'enforcement est encore inactif.
4. **App Check → API → Authentication et Cloud Firestore → Appliquer**, une fois
   que les métriques montrent des requêtes attestées. Activer l'enforcement
   avant cette vérification coupe l'accès à tout le monde, y compris soi-même.

En développement, `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` fait afficher un
jeton de debug dans la console du navigateur ; il doit être enregistré dans
*App Check → Applications → ⋮ → Gérer les jetons de debug*, faute de quoi le
poste local est rejeté dès l'enforcement actif.

---

## 2. Rôles et hiérarchie

| Rôle | `level` | Portée |
|---|---|---|
| `ADMINISTRATOR` | 100 | Technique. Tout, y compris permissions, paramètres, purge. |
| `SHERIFF` | 90 | Commandement. Tout le métier + gestion du personnel. |
| `UNDERSHERIFF` | 80 | Idem Sheriff sauf suppression définitive. |
| `CAPTAIN` | 70 | Supervision de division, validation, scellés. |
| `LIEUTENANT` | 60 | Supervision, validation des rapports, purge des révisions. |
| `SERGEANT` | 50 | Terrain encadrant : création/édition complète, accès confidentiel. |
| `DEPUTY` | 30 | Terrain : création, édition de ses propres rapports. |
| `CADET` | 10 | Lecture seule + création de rapports en brouillon. |

## 3. Matrice des permissions (valeurs par défaut du rôle)

`L` lecture · `C` création · `U` modification · `D` suppression (soft) · `—` aucun

| Domaine | ADMIN | SHERIFF | UNDER. | CAPT. | LT | SGT | DEP | CADET |
|---|---|---|---|---|---|---|---|---|
| citizens | LCUD | LCUD | LCUD | LCU D | LCU | LCU | LCU | L |
| vehicles | LCUD | LCUD | LCUD | LCU D | LCU | LCU | LCU | L |
| weapons | LCUD | LCUD | LCUD | LCU D | LCU | LCU | LCU | L |
| reports (own) | LCU | LCU | LCU | LCU | LCU | LCU | LCU | LCU |
| reports (any) | U D | U D | U D | U | U | — | — | — |
| reports.validate | ✔ | ✔ | ✔ | ✔ | ✔ | — | — | — |
| reports SEALED | ✔ | ✔ | ✔ | ✔ | — | — | — | — |
| reports CONFIDENTIAL | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | — | — |
| records | LCUD | LCUD | LCUD | LCU D | LCU | LCU | LC | L |
| map | LCUD | LCUD | LCUD | LCUD | LCU | LCU | LCU | L |
| agents | LCUD | LCUD | LCU | LU | L | L | L | L |
| admin.permissions | ✔ | ✔ | — | — | — | — | — | — |
| admin.settings | ✔ | ✔ | — | — | — | — | — | — |
| admin.audit | ✔ | ✔ | ✔ | ✔ | ✔ | — | — | — |

**Codes de permission** (`src/utils/permissions.js`) :

```
citizens.read      citizens.create   citizens.update   citizens.delete
vehicles.read      vehicles.create   vehicles.update   vehicles.delete
weapons.read       weapons.create    weapons.update    weapons.delete
reports.read       reports.create    reports.update.own
reports.update.any reports.delete    reports.validate
records.read       records.create    records.update    records.delete
map.read           map.create        map.update        map.delete
agents.read        agents.create     agents.update     agents.delete
admin.permissions  admin.settings    admin.audit       admin.export
```

### Compilation des permissions

`/permissions/{uid}` est un document **compilé**, jamais saisi à la main :

```
abilities = ROLE_DEFAULTS[role]  ∪  grants  \  revokes
```

Le calcul se fait dans `utils/permissions.js::compileAbilities()` et est écrit
par `agents.service.js::savePermissions()` (réservé à `admin.permissions`).
Les règles ne lisent que `abilities`, `level`, `role`, `disabled` — un seul
`get()` par requête, cache Firestore inclus.

```jsonc
// /permissions/{uid}
{
  "role": "SERGEANT",
  "level": 50,
  "grants":  ["reports.validate"],
  "revokes": ["citizens.delete"],
  "abilities": ["citizens.read", "citizens.create", "…", "reports.validate"],
  "disabled": false
}
```

---

## 4. Règles Firestore

Fichier déployable : [`firebase/firestore.rules`](../firebase/firestore.rules).

### Invariants garantis

1. **Aucune donnée accessible sans document `/permissions/{uid}` actif.**
2. **Nul ne modifie ses propres droits** : `targetUid != uid()` sur `/permissions`,
   et `request.resource.data.level <= level()` interdit d'élever quelqu'un
   au-dessus de soi.
3. **`createdAt` / `createdBy` immuables**, `updatedAt == request.time`,
   `updatedBy == uid()` sur toute écriture.
4. **Aucune suppression physique** hors administrateur : la « suppression » est
   une mise à jour restreinte à `deletedAt/updatedAt/updatedBy`.
5. **Journal d'audit immuable** : `create` + `read` seulement, `actorUid`
   forcé à l'appelant, horodatage serveur.
6. **Confidentialité des rapports** appliquée en lecture (`CONFIDENTIAL` ≥ 50,
   `SEALED` ≥ 70), l'auteur gardant toujours l'accès aux siens.
7. **Transition de statut d'un rapport** (validation/rejet) isolée derrière
   `reports.validate` avec `hasOnly([...])` : impossible de modifier le contenu
   en même temps que le statut.
8. **Un casier ne change jamais de titulaire** (`unchanged('citizenId')`).
9. **Compteurs** : incrément strict de 1 (ou remise à zéro annuelle), ce qui
   empêche la falsification des numéros de dossier.
10. **Refus global final** : toute collection non déclarée est inaccessible.

### Tests des règles (émulateur)

```bash
npm run emulators           # firebase emulators:start --only firestore
npm run test:rules          # @firebase/rules-unit-testing
```

Scénarios couverts par `firebase/tests/rules.test.js` :
- lecture refusée sans authentification ;
- lecture refusée si `disabled: true` ;
- un `CADET` ne peut ni créer ni modifier un citoyen ;
- un `DEPUTY` ne peut pas éditer le rapport d'un autre agent ;
- un `DEPUTY` ne peut pas lire un rapport `SEALED` ;
- un `SERGEANT` ne peut pas s'auto-attribuer `admin.permissions` ;
- `createdBy` falsifié → refus ;
- `delete` physique d'un citoyen par un `LIEUTENANT` → refus ;
- écriture dans `/auditLogs` avec un `actorUid` tiers → refus ;
- incrément de compteur de +5 → refus.

---

## 5. Défense en profondeur côté client

| Couche | Mécanisme |
|---|---|
| Route | `ProtectedRoute` (session) + `RoleRoute` (permission) |
| Rendu | `<Can do="citizens.delete">` masque les actions interdites |
| Formulaire | Validation zod partagée UI ↔ service (mêmes schémas) |
| Service | Refus préalable si permission absente → évite un aller-retour et un log d'erreur |
| Réseau | App Check + règles Firestore = autorité finale |

## 6. Confidentialité opérationnelle

* Toute consultation de fiche « sensible » (`SEALED`, `CONFIDENTIAL`) écrit un
  événement `VIEW` dans `/auditLogs` (traçabilité type CJIS).
* L'écran de connexion affiche l'avertissement d'usage restreint.
* Les exports PDF portent la classification, l'identité du demandeur et
  l'horodatage en pied de page — un document fuité reste attribuable.
