# LSSD RMS

**Los Santos Sheriff's Department — Records Management System**

Application web de gestion des dossiers du LSSD pour serveur GTA V RP (FiveM),
conçue à l'image des logiciels réellement utilisés par les *Sheriff's Offices*
américains (Spillman Flex, Motorola PremierOne, CentralSquare).

Front statique **React 19 + Vite**, données et authentification **Firebase**,
hébergement **GitHub Pages**. Aucun serveur applicatif.

---

## Sommaire

| Document | Contenu |
|---|---|
| [docs/01-ARCHITECTURE.md](docs/01-ARCHITECTURE.md) | Architecture, arborescence, flux de données, contraintes Pages |
| [docs/02-FIRESTORE-SCHEMA.md](docs/02-FIRESTORE-SCHEMA.md) | Collections, documents, index, relations |
| [docs/03-WIREFRAMES.md](docs/03-WIREFRAMES.md) | Wireframes textuels de chaque écran |
| [docs/04-COMPONENTS.md](docs/04-COMPONENTS.md) | Inventaire des composants et des hooks |
| [docs/05-SECURITY-RULES.md](docs/05-SECURITY-RULES.md) | Rôles, permissions, règles Firestore |
| [docs/06-ROADMAP.md](docs/06-ROADMAP.md) | Plan de développement par phases |

---

## Démarrage

### 1. Prérequis

- Node.js **≥ 20.19**
- Un projet Firebase avec **Firestore** et **Authentication (e-mail/mot de passe)** activés

### 2. Installation

```bash
npm install
```

### 3. Configuration

```bash
cp .env.example .env.local
```

Renseignez les valeurs `VITE_FIREBASE_*` (Console Firebase → Paramètres du
projet → Vos applications → Web). Sans configuration valide, l'application
affiche un écran d'instructions au lieu de démarrer.

Il faut ensuite **provisionner le premier compte administrateur** : la
procédure complète est décrite dans
[`firebase/seed/bootstrap-admin.md`](firebase/seed/bootstrap-admin.md).
Sans elle, aucune connexion n'est possible — l'application n'a pas
d'inscription publique.

> La clé API Firebase d'une application web est **publique par conception** :
> elle est incluse dans le bundle. La sécurité repose sur les règles Firestore
> et App Check, pas sur le secret de cette clé.

### 4. Développement

```bash
npm run dev
```

Le terminal est servi sur `http://localhost:5173/LSSD/`.

### 5. Vérifications

```bash
npm run lint
```

```bash
npm run check
```

```bash
npm run build
```

`npm run check` exécute les contrôles de non-régression des modules purs
(tokenisation de recherche, système de permissions) — les deux endroits où une
régression passerait inaperçue : une recherche qui ne trouve plus rien, ou un
rôle qui gagne un droit qu'il ne devrait pas avoir.

### 6. Fond de carte

Le fond de carte servi à l'application est `public/map/los-santos.png`, versionné.
Il est produit à partir du SVG source — 63 Mo de tracés vectoriels — placé dans
`map-source/MAP.svg`, **ignoré par Git** :

```bash
npm run build:map
```

> `map-source/` est volontairement **hors de `public/`** : Vite recopie tout le
> contenu de `public/` dans `dist/`, donc un fichier de travail laissé là serait
> publié à chaque déploiement sans jamais apparaître dans un `git status`.

---

## Déploiement des règles Firestore

Les règles et les index sont versionnés dans `firebase/`.

```bash
npm run rules:deploy
```

Émulateurs locaux (Firestore + Auth + interface sur `localhost:4000`) :

```bash
npm run emulators
```

Passez `VITE_USE_EMULATORS=1` dans `.env.local` pour brancher l'application
dessus.

---

## Déploiement

Le déploiement est **manuel et local** : le build est produit sur le poste, à
partir de `.env.local`, puis envoyé chez l'hébergeur. Aucune intégration
continue, **aucune dépendance de déploiement** — les deux scripts n'utilisent
que `git` et `firebase-tools`.

### Firebase Hosting *(voie recommandée)*

```bash
npm run deploy
```

Le projet Firebase porte déjà Firestore et Authentication ; l'hébergement
statique est compris dans le forfait gratuit et ne dépend **ni de GitHub, ni
d'une quelconque facturation GitHub**.

Le site est servi à la racine (`https://<projet>.web.app/`), donc le bundle est
compilé avec `base = '/'` : le script force cette valeur dans l'environnement du
build, `.env.local` n'a pas à être modifié.

Prérequis, une seule fois sur le poste :

```bash
npx --yes firebase-tools login
```

Pour construire et vérifier le bundle sans rien mettre en ligne :

```bash
npm run deploy:hosting -- --dry-run
```

Les domaines `*.web.app` et `*.firebaseapp.com` du projet sont autorisés
d'office par Firebase Authentication : rien à configurer côté connexion.

### GitHub Pages *(voie alternative)*

```bash
npm run deploy:pages
```

Build, puis publication de `dist/` sur la branche `gh-pages` **en git
ordinaire**, dans un *worktree* supprimé en fin d'exécution. Pour voir ce qui
serait publié sans rien pousser :

```bash
npm run deploy:pages -- --dry-run
```

> ⚠️ Le contenu de la branche `gh-pages` est **intégralement remplacé**, y
> compris un éventuel `CNAME`. Pour conserver un domaine personnalisé, placez le
> `CNAME` dans `public/` : Vite le recopie alors dans `dist/` à chaque build.

Cette voie suppose que **GitHub Pages soit activé** sur le dépôt
(*Settings → Pages → Source : Deploy from a branch → `gh-pages` / `(root)`*),
et que `VITE_BASE_PATH` corresponde à la cible :

| Cible | `VITE_BASE_PATH` | `public/CNAME` |
|---|---|---|
| `https://<utilisateur>.github.io/LSSD/` | `/LSSD/` *(valeur actuelle)* | absent — et le domaine personnalisé retiré des réglages Pages |
| Domaine personnalisé (`lssd.exemple.fr`) | `/` | présent, contenant le domaine |

Les deux sont exclusifs : un domaine personnalisé configuré dans les réglages
Pages sert le site à la racine, ce qui casse un build compilé avec `/LSSD/`.
Pensez alors à ajouter le domaine dans **Console Firebase → Authentication →
Settings → Authorized domains**, sans quoi la connexion sera refusée.

### Pourquoi le paquet `gh-pages` a été retiré

Il entretenait un clone du dépôt dans `node_modules/.cache/gh-pages` et le
réutilisait d'un déploiement à l'autre. Ce cache se désynchronise (branche
recréée, force-push, dépôt re-cloné), et le paquet masque alors l'erreur réelle
derrière des messages sans rapport — *« Failed to get remote.origin.url »* étant
le plus connu. `scripts/deploy-pages.mjs` fait le même travail sans conserver le
moindre état entre deux exécutions.

### État actuel de la publication

**GitHub Pages est désactivé sur le dépôt** (`has_pages: false`) et les deux
URL répondent **404**, constaté au 28/07/2026. Origine : les exécutions GitHub
Actions échouent avec *« your account is locked due to a billing issue »*, et le
déployeur natif de la branche `gh-pages` est lui aussi une exécution Actions.

**Tant que la facturation n'est pas régularisée, `npm run deploy:pages` poussera
la branche sans que rien ne soit mis en ligne.** C'est la raison pour laquelle
Firebase Hosting est la voie par défaut.

La version précédente de l'application reste intacte sur la branche
`legacy-mdt`. *Un workflow GitHub Actions avait été mis en place puis retiré ;
il reste récupérable dans l'historique Git.*

### Routage

Le routage utilise `HashRouter` (`/LSSD/#/citizens/…`) : c'est le seul moyen
fiable d'obtenir des liens directs et un rafraîchissement fonctionnel sur un
hébergement statique sans réécriture d'URL.

## Branches du dépôt

| Branche | Contenu |
|---|---|
| `main` | Réécriture en cours (Vite + React 19 + MUI) — ce dépôt |
| `legacy-mdt` | Sauvegarde de la version précédente « LSSD Mobile Data Terminal » (Create React App), conservée intacte |
| `gh-pages` | Build publié — porte encore celui de la version précédente tant que `npm run deploy:pages` n'a pas été lancé |

---

## Structure du code

```
src/
├─ app/          Composition : providers, routeur, configuration
├─ firebase/     Seule couche autorisée à importer le SDK Firebase
├─ services/     Accès données (sans React, testable)
├─ hooks/        data/ (TanStack Query) · ui/ · auth/
├─ contexts/     Session, espace de travail, menus, confirmations
├─ layouts/      AuthLayout, AppShell, ModuleLayout, RecordLayout
├─ components/   system/ data/ form/ feedback/ media/ navigation/
│                search/ editor/ map/ pdf/
├─ modules/      Une fonctionnalité = un dossier autonome
├─ pdf/          Moteur et modèles de documents officiels
├─ utils/        Formatage, dates, permissions, tokens de recherche
└─ styles/       Thème MUI, jetons CSS, styles globaux
```

**Règle d'or** : un composant ne parle jamais directement à Firebase.
Le chemin est toujours `composant → hook → service → firebase/`.

---

## État d'avancement

| Phase | Périmètre | État |
|---|---|---|
| 0 | Socle : build, thème, chrome applicatif, routage, CI | ✅ livrée |
| 1 | Authentification et permissions | ✅ livrée |
| 2 | Socle de données et composants transverses | ✅ livrée |
| 3 | Registre des citoyens | ✅ livrée |
| 4 | Registres véhicules et armes | ✅ livrée |
| 5 | Rapports et éditeur TipTap | ✅ livrée |
| 6 | Casiers judiciaires | ✅ livrée |
| 7 | Export PDF | ✅ livrée |
| 8 | Carte interactive (SIG) | ✅ livrée |
| 9 | Agents et administration | ✅ livrée |
| 10 | Tableau de bord, recherche globale, finitions | ✅ livrée |

Détail et critères d'acceptation : [docs/06-ROADMAP.md](docs/06-ROADMAP.md).

---

## Raccourcis clavier

| Combinaison | Action |
|---|---|
| `Ctrl` + `B` | Replier / déplier la barre latérale |
| `Ctrl` + `1…9` | Accès direct à un module |
| `Ctrl` + `K` | Recherche globale (Spotlight) |
| `Ctrl` + `W` | Fermer l'onglet courant |
