# Amorçage — création du premier administrateur

Le LSSD RMS **n'a pas d'inscription publique** : un compte n'existe que s'il a
été provisionné. Il faut donc créer manuellement le tout premier administrateur,
qui pourra ensuite créer tous les autres agents depuis le module Agents
(phase 9).

Cette procédure ne se fait qu'**une seule fois**, à la mise en service.

---

## 1. Activer l'authentification

Console Firebase → **Authentication** → *Sign-in method* :

- activer **E-mail/Mot de passe** ;
- laisser **Lien e-mail (connexion sans mot de passe)** désactivé.

Puis **Authentication → Settings → User actions** :

- **décocher « Enable create (sign-up) »**.

> Sans cette dernière étape, n'importe qui disposant de la clé API publique
> pourrait créer un compte Firebase. Il resterait sans document de permissions
> et ne verrait rien, mais autant fermer la porte.

---

## 2. Créer le compte

**Authentication → Users → Add user**

- E-mail : celui de l'administrateur (ex. `admin@lssd.gov`)
- Mot de passe : 12 caractères minimum

Copier l'**UID** généré (chaîne d'environ 28 caractères). Il sert d'identifiant
de document dans les deux étapes suivantes.

> **Raccourci** : si le compte existe déjà et que vous vous connectez à
> l'application, l'écran « Compte non provisionné » affiche l'UID avec un bouton
> de copie. Inutile d'aller le chercher dans la console.

---

## 3. Créer le document de permissions

**Firestore Database → Démarrer une collection** → ID de collection
`permissions` → **ID du document = l'UID copié**.

```json
{
  "role": "ADMINISTRATOR",
  "level": 100,
  "grants": [],
  "revokes": [],
  "disabled": false,
  "abilities": [
    "admin.audit",
    "admin.export",
    "admin.permissions",
    "admin.settings",
    "agents.create",
    "agents.delete",
    "agents.read",
    "agents.update",
    "citizens.create",
    "citizens.delete",
    "citizens.read",
    "citizens.update",
    "map.create",
    "map.delete",
    "map.read",
    "map.update",
    "records.create",
    "records.delete",
    "records.read",
    "records.update",
    "reports.create",
    "reports.delete",
    "reports.read",
    "reports.update.any",
    "reports.update.own",
    "reports.validate",
    "vehicles.create",
    "vehicles.delete",
    "vehicles.read",
    "vehicles.update",
    "weapons.create",
    "weapons.delete",
    "weapons.read",
    "weapons.update"
  ]
}
```

**Types attendus** : `role` chaîne · `level` nombre · `grants`, `revokes`,
`abilities` tableaux de chaînes · `disabled` booléen.

Le même contenu, complet et prêt à l'emploi, est disponible dans
[`permissions-admin.json`](permissions-admin.json). Il est régénéré par la
commande indiquée plus bas à chaque évolution de la table des permissions.

> Ce document est régénéré automatiquement par l'application à partir de
> `compileAbilities()` dès qu'un administrateur modifie les droits d'un agent.
> La saisie manuelle ne concerne que ce premier compte.
>
> Pour régénérer la liste après une évolution du code :
> ```bash
> node --input-type=module -e "const m = await import('./src/utils/permissions.js'); console.log(JSON.stringify(m.buildPermissionDocument({ role: 'ADMINISTRATOR' }), null, 2));"
> ```

---

## 4. Créer la fiche agent

Nouvelle collection `agents` → **ID du document = le même UID**.

```json
{
  "uid": "<UID>",
  "badgeNumber": "0001",
  "firstName": "John",
  "lastName": "Marston",
  "email": "admin@lssd.gov",
  "phone": "555-0100",
  "photoUrl": "",
  "rank": "SHERIFF",
  "role": "ADMINISTRATOR",
  "division": "ADMIN",
  "service": "Station centrale",
  "callsign": "1-ADAM-1",
  "status": "ACTIVE",
  "certifications": [],
  "supervisorId": null,
  "notes": "",
  "loginCount": 0,
  "lastLoginAt": null,
  "deletedAt": null,
  "searchTokens": [],
  "createdAt": "<timestamp — type Horodatage, mettre la date du jour>",
  "createdBy": "<UID>",
  "updatedAt": "<timestamp — type Horodatage>",
  "updatedBy": "<UID>"
}
```

> ⚠️ `createdAt`, `createdBy`, `updatedAt` et `updatedBy` sont **obligatoires** :
> les règles vérifient leur immutabilité à chaque mise à jour. Sans eux,
> l'enregistrement de la dernière connexion échouerait silencieusement.
> Dans la console, choisir le type **timestamp** pour les deux dates.

Valeurs possibles de `rank` : `SHERIFF`, `UNDERSHERIFF`, `CAPTAIN`,
`LIEUTENANT`, `SERGEANT`, `CORPORAL`, `DEPUTY`, `CADET`.
Valeurs de `division` : `PATROL`, `INVESTIGATIONS`, `SWAT`, `AIR`, `TRAFFIC`,
`CUSTODY`, `ADMIN`.

---

## 5. Déployer les règles et les index

Depuis la racine du projet :

```bash
npm run rules:deploy
```

La commande demande une authentification Firebase au premier lancement
(`npx firebase-tools login`). Elle publie `firebase/firestore.rules` et
`firebase/firestore.indexes.json`.

> **Tant que les règles ne sont pas déployées**, Firestore applique celles du
> projet. Si le projet est en mode test, tout est ouvert ; s'il est en mode
> verrouillé, rien ne fonctionnera. Cette étape n'est pas optionnelle.

---

## 6. Autoriser le domaine de publication

**Authentication → Settings → Authorized domains** : ajouter le domaine depuis
lequel l'application est servie (`<utilisateur>.github.io`, ou le domaine
personnalisé). `localhost` y figure déjà par défaut.

---

## 7. Vérifier

1. `npm run dev`, ouvrir `http://localhost:5173/LSSD/`
2. Se connecter avec l'e-mail et le mot de passe créés
3. Le tableau de bord doit afficher :
   - votre identité de service dans le panneau **Ma session** ;
   - **34 permissions actives sur 34** dans le panneau **Habilitations** ;
   - votre propre présence dans **Agents connectés** ;
   - votre matricule et votre habilitation dans la barre d'état inférieure.
4. Dans Firestore, la collection `auditLogs` doit contenir une entrée `LOGIN`,
   et `presence/<UID>` un document rafraîchi toutes les 60 secondes.

## Diagnostic

| Symptôme | Cause probable |
|---|---|
| « Compte non provisionné » | Document `permissions/<UID>` absent, ou ID de document ≠ UID |
| « Compte désactivé » | `disabled: true` dans le document de permissions |
| « Système inaccessible » | Règles non déployées, ou projet Firestore non créé |
| Connexion refusée sans message clair | Domaine absent des *Authorized domains* |
| Barre d'état sans matricule | Document `agents/<UID>` absent — la session fonctionne, mais le profil est vide |
| `0 en ligne` alors que vous êtes connecté | Règles non déployées : l'écriture dans `/presence` est refusée |
