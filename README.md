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

## Déploiement GitHub Pages

Le déploiement est **manuel et local** : le build est produit sur le poste puis
publié sur la branche `gh-pages`, prise en charge par le déployeur natif de
GitHub Pages. Aucune intégration continue n'est utilisée.

1. **Settings → Pages → Source : Deploy from a branch → `gh-pages` / `(root)`**
2. Renseigner `.env.local` — les clés Firebase sont lues au moment du build
3. Publier :

```bash
npm run deploy
```

> ⚠️ Cette commande **remplace intégralement** le contenu de la branche
> `gh-pages`, y compris le fichier `CNAME` qui porte le domaine personnalisé.
> À n'exécuter qu'en connaissance de cause.

### État actuel de la publication

**GitHub Pages ne publie plus rien sur ce compte.** Constats au 25/07/2026 :

- `https://thebllazer.github.io/LSSD/` et `https://lssd.thebllazer.fr/`
  répondent tous deux **404** ;
- le dernier déploiement Pages enregistré date du **15/07/2026** ;
- les exécutions GitHub Actions échouent avec
  *« your account is locked due to a billing issue »*.

Le déployeur natif de la branche `gh-pages` (`pages build and deployment`) est
lui aussi une exécution Actions : il est soumis au même verrou. **Tant que la
situation de facturation n'est pas régularisée, `npm run deploy` poussera bien
la branche, mais rien ne sera mis en ligne.**

La version précédente de l'application reste intacte sur la branche
`legacy-mdt`, et son build sur `gh-pages`.

*Un workflow GitHub Actions avait été mis en place puis retiré ; il reste
récupérable dans l'historique Git si la facturation est rétablie.*

### Chemin de base et domaine

Le chemin de base est piloté par `VITE_BASE_PATH` :

| Cible | `VITE_BASE_PATH` | Fichier `public/CNAME` |
|---|---|---|
| `https://<utilisateur>.github.io/LSSD/` | `/LSSD/` *(valeur actuelle)* | absent — et le domaine personnalisé doit être retiré des réglages Pages |
| Domaine personnalisé (ex. `lssd.exemple.fr`) | `/` | présent, contenant le domaine |

Les deux sont exclusifs : un domaine personnalisé configuré dans les réglages
Pages sert le site à la racine, ce qui casse un build compilé avec `/LSSD/`.

Enfin, **Console Firebase → Authentication → Settings → Authorized domains** :
ajouter le domaine de publication, sans quoi la connexion sera refusée.

### Routage

Le routage utilise `HashRouter` (`/LSSD/#/citizens/…`) : c'est le seul moyen
fiable d'obtenir des liens directs et un rafraîchissement fonctionnel sur un
hébergement statique sans réécriture d'URL.

## Branches du dépôt

| Branche | Contenu |
|---|---|
| `main` | Réécriture en cours (Vite + React 19 + MUI) — ce dépôt |
| `legacy-mdt` | Sauvegarde de la version précédente « LSSD Mobile Data Terminal » (Create React App), conservée intacte |
| `gh-pages` | Build déployé de la version précédente |

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
| 8 | Carte interactive (SIG) | ⏳ |
| 9 | Agents et administration | ⏳ |
| 10 | Tableau de bord, recherche globale, finitions | ⏳ |

Détail et critères d'acceptation : [docs/06-ROADMAP.md](docs/06-ROADMAP.md).

---

## Raccourcis clavier

| Combinaison | Action |
|---|---|
| `Ctrl` + `B` | Replier / déplier la barre latérale |
| `Ctrl` + `1…9` | Accès direct à un module |
| `Ctrl` + `K` | Recherche globale *(phase 10)* |
| `Ctrl` + `S` | Enregistrer la fiche courante *(phase 3)* |
