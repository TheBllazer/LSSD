# LSSD RMS — Architecture technique

> Los Santos Sheriff's Department — Records Management System
> Application web statique (GitHub Pages) · React 19 + Vite 7 + Firebase 12

---

## 1. Principes directeurs

| Principe | Application concrète |
|---|---|
| **Zéro backend** | Toute la logique métier vit côté client ; l'intégrité est garantie par les *Firestore Security Rules* (voir `05-SECURITY-RULES.md`). |
| **Modulaire par domaine** | Chaque module (citoyens, véhicules, armes, rapports, casiers, carte, agents) est une *feature* auto-contenue : pages, composants, hooks, service Firestore, types, template PDF. |
| **Une seule source de vérité par entité** | Les relations sont stockées par **référence d'ID** (jamais de duplication de fiche), avec dénormalisation contrôlée pour l'affichage (nom + photo uniquement). |
| **Séparation stricte des couches** | `pages` → `hooks` (TanStack Query) → `services` (Firestore) → `firebase` (SDK). Un composant ne parle **jamais** directement au SDK Firebase. |
| **Design system unique** | Un thème MUI unique (`src/styles/theme.js`) + tokens CSS. Aucun style « inline magique » dispersé. |
| **Performance par défaut** | Code splitting par route, virtualisation des tables, pagination cursor-based, cache TanStack Query persistant (IndexedDB). |

---

## 2. Stack verrouillée

```
React            19.x        UI
Vite              7.x        Build / dev server / code splitting
react-router-dom  7.x        Routing (HashRouter — cf. §7 GitHub Pages)
firebase         12.x        App / Auth / Firestore (modular SDK, tree-shakable)
@tanstack/react-query 5.x    Cache serveur, invalidation, pagination infinie
@tanstack/react-query-persist-client + idb-keyval   Cache offline
@mui/material     7.x        Composants de base + theming (CSS variables)
@mui/icons-material            Icônes système
@mui/x-data-grid  8.x        Tables pro (tri, filtres, colonnes, virtualisation)
framer-motion    12.x        Animations fenêtres / panneaux / listes
react-hook-form   7.x        Formulaires (uncontrolled, perf)
zod + @hookform/resolvers      Validation de schéma partagée UI ↔ service
@tiptap/react     3.x        Éditeur de rapports
@react-pdf/renderer 4.x      Génération PDF (documents officiels)
react-leaflet     5.x  + leaflet 1.9   Carte SIG (CRS.Simple sur SVG)
react-icons       5.x        Icônes complémentaires (Fa/Md/Tb)
react-hot-toast   2.x        Notifications
dayjs             1.x        Dates (locale fr, plugins relativeTime/utc)
@tanstack/react-virtual 3.x  Virtualisation des listes hors DataGrid
dnd-kit           6.x        Drag & drop (pièces jointes, ordre de colonnes)
```

> **Interdits** : aucun serveur Node, aucune Cloud Function requise au fonctionnement
> nominal, aucun appel réseau hors Firebase + PostImage (images).

---

## 3. Arborescence du projet

```
LSSD/
├─ .github/workflows/deploy.yml      CI → build → GitHub Pages
├─ docs/                             Les 6 documents de conception
├─ firebase/
│  ├─ firestore.rules                Règles de sécurité (déployables)
│  ├─ firestore.indexes.json         Index composites
│  └─ seed/                          Jeux de données de démarrage (import manuel)
├─ public/
│  ├─ 404.html                       Fallback GitHub Pages
│  ├─ map/los-santos.svg             Fond de carte SIG
│  └─ brand/lssd-star.svg            Logo (PDF + UI)
├─ index.html
├─ vite.config.js
├─ .env.example                      Variables VITE_FIREBASE_*
└─ src/
   ├─ main.jsx                       Bootstrap : providers + router
   ├─ App.jsx                        Arbre de routes + Suspense global
   │
   ├─ app/                           Composition applicative
   │  ├─ providers/                  AppProviders, QueryProvider, ThemeProvider
   │  ├─ router/                     routes.jsx, ProtectedRoute, RoleRoute
   │  └─ config/                     constants.js, env.js, featureFlags.js
   │
   ├─ firebase/                      ⚠️ Seule couche autorisée à importer le SDK
   │  ├─ app.js                      initializeApp + App Check
   │  ├─ auth.js                     getAuth, persistence, secondaryApp (création comptes)
   │  ├─ db.js                       getFirestore, collections(), converters
   │  ├─ converters/                 FirestoreDataConverter par entité
   │  └─ paths.js                    Chemins centralisés (COLLECTIONS.CITIZENS…)
   │
   ├─ services/                      Accès données (pure JS, testable, sans React)
   │  ├─ base/crudFactory.js         Générateur CRUD + audit + searchIndex
   │  ├─ citizens.service.js
   │  ├─ vehicles.service.js
   │  ├─ weapons.service.js
   │  ├─ reports.service.js
   │  ├─ criminalRecords.service.js
   │  ├─ mapFeatures.service.js
   │  ├─ agents.service.js
   │  ├─ search.service.js           Index global (Spotlight)
   │  ├─ audit.service.js            Journal + historique d'entité
   │  ├─ presence.service.js         Agents connectés
   │  ├─ stats.service.js            Compteurs dashboard
   │  └─ notifications.service.js
   │
   ├─ hooks/                         React Query + hooks UI
   │  ├─ data/                       useCitizens, useCitizen, useCreateCitizen…
   │  ├─ ui/                         useDialog, useContextMenu, useHotkeys,
   │  │                              useAutoSave, useDebounce, useSelection,
   │  │                              useVirtualTable, useBreadcrumbs
   │  └─ auth/                       useAuth, usePermission, useRoleGuard
   │
   ├─ contexts/
   │  ├─ AuthContext.jsx             user + agent + permissions + login/logout
   │  ├─ WorkspaceContext.jsx        Onglets internes (fiches ouvertes)
   │  ├─ CommandPaletteContext.jsx   CTRL+K
   │  ├─ ContextMenuContext.jsx      Menu clic droit global
   │  ├─ ConfirmContext.jsx          Confirmations (suppression…)
   │  └─ NotificationContext.jsx     Cloche + toasts
   │
   ├─ layouts/
   │  ├─ AuthLayout.jsx              Écran de connexion (plein écran)
   │  ├─ AppShell.jsx                Navbar + Sidebar + StatusBar + Outlet
   │  ├─ ModuleLayout.jsx            En-tête module + breadcrumb + actions
   │  └─ RecordLayout.jsx            Fiche : en-tête + onglets + panneau latéral
   │
   ├─ components/
   │  ├─ system/                     Chrome « logiciel » : Window, Panel, TitleBar,
   │  │                              StatusBar, Toolbar, SplitPane, Ribbon
   │  ├─ data/                       DataTable, TableSkeleton, Pagination,
   │  │                              ColumnPicker, ExportMenu, EmptyState
   │  ├─ form/                       TextField, SelectField, DateField, PhotoField,
   │  │                              CitizenPicker, VehiclePicker, WeaponPicker,
   │  │                              TagInput, FormSection, AutoSaveIndicator
   │  ├─ feedback/                   Skeletons, ProgressBar, Toast, ConfirmDialog,
   │  │                              ErrorBoundary, LoadingOverlay
   │  ├─ media/                      PhotoPreview, PhotoGallery, Lightbox, Avatar
   │  ├─ navigation/                 Sidebar, Navbar, Breadcrumb, TabBar, Favorites
   │  ├─ search/                     CommandPalette, SearchResultRow, QuickFilter
   │  ├─ editor/                     TipTapEditor, EditorToolbar, extensions/
   │  ├─ map/                        MapCanvas, DrawToolbar, FeatureList, FeatureForm
   │  └─ pdf/                        PdfPreviewDialog, PdfDownloadButton
   │
   ├─ modules/                       Une feature = un dossier
   │  ├─ dashboard/
   │  ├─ citizens/
   │  ├─ vehicles/
   │  ├─ weapons/
   │  ├─ reports/
   │  ├─ criminal-records/
   │  ├─ map/
   │  ├─ agents/
   │  └─ admin/
   │     └─ (chacun : pages/ components/ hooks/ schemas/ columns.jsx index.js)
   │
   ├─ pdf/
   │  ├─ engine/                     PdfDocument, PdfTheme, registerFonts, blocks/
   │  ├─ templates/                  CitizenPdf, ReportPdf, RecordPdf, VehiclePdf,
   │  │                              WeaponPdf, RosterPdf
   │  └─ index.js                    renderTemplate(templateId, data)
   │
   ├─ utils/                         formatters, validators, permissions, tokens,
   │                                 dates, ids, csv, colors, clipboard
   ├─ types/                         JSDoc typedefs + enums (roles, statuts, crimes)
   ├─ styles/                        theme.js, tokens.css, global.css, scrollbar.css
   └─ assets/                        Fonts, images, sons (alertes discrètes)
```

---

## 4. Flux de données

```
Composant  ──useCitizens()──►  TanStack Query
                                   │  queryKey ['citizens', filters, cursor]
                                   ▼
                            citizens.service.js
                                   │  buildQuery(where/orderBy/limit/startAfter)
                                   ▼
                            firebase/db.js (converter)
                                   ▼
                               Firestore
```

* **Lecture** : `useQuery` / `useInfiniteQuery`, `staleTime` 60 s, cache persisté en IndexedDB → navigation instantanée entre modules.
* **Écriture** : `useMutation` + **mise à jour optimiste** + `invalidateQueries` ciblée + entrée d'audit écrite dans la même `writeBatch`.
* **Temps réel** : `onSnapshot` réservé à 4 usages (présence agents, notifications, compteurs dashboard, verrou d'édition d'un rapport) pour maîtriser la facture de lectures.

---

## 5. Sécurité applicative (couche client)

1. `AuthContext` charge `agents/{uid}` + `permissions/{uid}` à la connexion.
2. `usePermission('citizens.update')` → booléen mémoïsé.
3. `<Can do="citizens.delete">` masque l'action ; `RoleRoute` bloque la route.
4. **Le client ne fait que de l'ergonomie** : l'autorité reste les Security Rules.

---

## 6. Système de fenêtrage (« sensation logiciel »)

* `WorkspaceContext` maintient une pile d'**onglets internes** (`{id, type, entityId, title, icon, dirty}`).
* Ouvrir une fiche = `openRecord('citizen', id)` → nouvel onglet dans la `TabBar`, animation Framer Motion (scale 0.98 → 1, opacité, 160 ms, `easeOut`).
* Double-clic sur une ligne de table = ouverture ; clic droit = `ContextMenu` (Ouvrir, Ouvrir dans un onglet, Copier l'ID, Exporter PDF, Supprimer).
* Raccourcis globaux : `Ctrl+K` recherche, `Ctrl+S` sauvegarde, `Ctrl+W` fermer onglet, `Ctrl+1..9` modules, `Échap` fermer modale, `F2` renommer, `Suppr` supprimer la sélection.

---

## 7. Contraintes GitHub Pages

| Sujet | Décision |
|---|---|
| Base URL | `vite.config.js` → `base: '/LSSD/'` (surchargée par `VITE_BASE_PATH`). |
| Routing | **`HashRouter`** : zéro configuration serveur, aucun 404 sur rafraîchissement / lien direct. Un `public/404.html` de secours est fourni pour un futur passage en `BrowserRouter`. |
| Variables d'env | `VITE_FIREBASE_*` injectées au build par GitHub Actions (*Repository secrets*). La clé API Firebase est **publique par conception** — la sécurité repose sur les règles + App Check. |
| Assets | Toujours via `import` ou `import.meta.env.BASE_URL`, jamais de chemin absolu `/img/...`. |
| Déploiement | Workflow `deploy.yml` : `npm ci` → `npm run build` → `actions/deploy-pages`. |

---

## 8. Découpage du bundle

```
vendor-react     react, react-dom, react-router, scheduler
vendor-mui       @mui/*, @emotion, @popperjs, stylis, react-transition-group
vendor-firebase  firebase/app|auth|firestore, re2js
vendor-motion    framer-motion, motion-dom, motion-utils
vendor-query     @tanstack/*
vendor-icons     react-icons
vendor           dayjs, react-hot-toast, idb, @babel/runtime
vendor-editor    @tiptap/*              (chargé à l'ouverture d'un rapport)
vendor-pdf       @react-pdf/renderer    (chargé à l'export)
vendor-map       leaflet, react-leaflet (chargé à l'ouverture de la carte)
```

Chaque route est `React.lazy` + `<Suspense fallback={<ModuleSkeleton/>}>`.

### Coût réel mesuré (fin de phase 1)

| Chunk | gzip |
|---|---|
| vendor-firebase | 192 kB |
| vendor-react | 91 kB |
| vendor-mui | 86 kB |
| vendor-motion | 42 kB |
| index (code applicatif) | 18 kB |
| vendor + query + icons + css | 31 kB |
| **Total au premier chargement** | **≈ 460 kB** |

La cible initiale de 350 kB, posée avant toute mesure, n'est pas atteignable
avec cette pile : à elle seule, la paire `firebase/auth` + `firebase/firestore`
pèse 192 kB gzip (dont ~60 kB pour `re2js`, tiré par l'évaluation des
politiques de mot de passe). Les trois autres gros postes sont imposés par le
cahier des charges (React 19, Material UI, Framer Motion).

**Engagement révisé : premier chargement < 500 kB gzip, maintenu jusqu'à la
phase 10.** Il tient à une condition — que TipTap, React-PDF et Leaflet restent
strictement chargés à la demande. C'est la raison du découpage ci-dessus et de
la forme fonctionnelle de `manualChunks` dans `vite.config.js`.

Piste conservée si le budget devait être resserré : différer l'import de
`firebase/firestore` jusqu'après l'authentification, ce qui allégerait l'écran
de connexion d'environ 130 kB gzip. Le gain est nul pour un agent dont la
session est déjà ouverte — d'où le choix de ne pas complexifier pour l'instant.
