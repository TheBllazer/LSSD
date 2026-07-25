# LSSD RMS — Plan de développement par phases

Règle du projet : **chaque phase se termine par un livrable exécutable et testable**
(`npm run dev` fonctionnel, critères d'acceptation vérifiés) avant de passer à la
suivante. Aucun `TODO`, aucun pseudo-code, aucune fonction laissée vide.

---

## Phase 0 — Fondations (socle exécutable)

**Contenu**
- `npm create vite` + installation de la stack complète, `vite.config.js`
  (base `/LSSD/`, alias `@`, `manualChunks`), `.env.example`, `.gitignore`.
- `src/firebase/*` : init App / Auth / Firestore, `paths.js`, converters génériques.
- `src/styles/` : thème MUI sombre « poste de commandement », tokens CSS,
  scrollbar personnalisée, styles globaux.
- `AppProviders`, `AppRouter` (HashRouter), `ErrorBoundary`, `BootSplash`.
- `components/system/*` (Panel, TitleBar, Toolbar, StatusBar, SplitPane…).
- `.github/workflows/deploy.yml`, `firebase/firestore.rules`,
  `firebase/firestore.indexes.json`, `README.md`.

**Test** : `npm run dev` affiche l'AppShell avec sidebar/navbar/statusbar et une
page « Tableau de bord » vide ; `npm run build` passe ; le déploiement Pages sert
l'application.

---

## Phase 1 — Authentification & autorisations

- `AuthContext` (session, agent, permissions, login/logout, heartbeat de présence).
- Écran `/login` complet (états, erreurs, animation, avertissement légal).
- `utils/permissions.js` (codes, `ROLE_DEFAULTS`, `compileAbilities`),
  `usePermission`, `<Can>`, `ProtectedRoute`, `RoleRoute`, `PermissionDenied`.
- `audit.service.js` + `presence.service.js`.
- Script d'amorçage `firebase/seed/bootstrap-admin.md` (procédure de création du
  premier ADMINISTRATOR depuis la console).

**Test** : connexion/déconnexion réelles, redirection, blocage d'un compte
`disabled`, masquage des actions selon le rôle, `LOGIN` visible dans `/auditLogs`.

---

## Phase 2 — Socle de données & composants transverses

- `services/base/crudFactory.js` : CRUD + soft delete + audit + `searchIndex` +
  compteurs `stats`, tout en `writeBatch`.
- Hooks génériques TanStack Query (liste paginée, détail, mutations optimistes).
- `DataTable`, `TableToolbar`, `TableSkeleton`, `BulkActionBar`,
  `CursorPagination`, `EmptyState`, `ExportMenu`.
- `components/form/*` de base + `Form` (RHF + zod), `AutoSaveIndicator`, `DirtyGuard`.
- `ConfirmContext`/`DeleteConfirmDialog`, `ContextMenuContext`, `WorkspaceContext`
  + `TabBar`, `useHotkeys`, `Breadcrumb`, favoris.
- `components/media/*` (PostImage : aperçu, galerie, lightbox).

**Test** : une page de démonstration liste des documents factices avec squelette,
tri, filtre instantané, sélection multiple, clic droit, ouverture en onglet.

---

## Phase 3 — Module CITOYENS (module de référence)

- Liste complète (filtres, recherche instantanée, colonnes, export).
- Fiche complète : 8 onglets, édition inline, auto-save, chronologie, notes,
  galerie photos, panneau de résumé.
- Formulaires : identité, permis, tatouages, affiliations.
- Relations en lecture (onglets véhicules/armes/rapports/casiers alimentés dès
  que les modules suivants existent — contrats de service déjà en place).

**Test** : créer, modifier, supprimer (soft) un citoyen ; historique et index de
recherche mis à jour ; compteurs du dashboard cohérents.

---

## Phase 4 — Modules VÉHICULES & ARMES

- Registres complets, fiches, formulaires, `CitizenPicker` opérationnel.
- Liaison bidirectionnelle : onglets « Véhicules »/« Armes » de la fiche citoyen,
  navigation croisée, transfert de propriétaire avec historique.
- Alerte permis d'arme invalide, gestion fourrière et signalements (BOLO/volé).

**Test** : attribuer un véhicule à un citoyen depuis les deux côtés ; changer de
propriétaire crée un événement dans les deux historiques.

---

## Phase 5 — Module RAPPORTS + éditeur TipTap

- Liste, filtres, statuts, verrou d'édition, révisions.
- Éditeur complet (toutes les extensions), panneau de métadonnées, parties
  impliquées via pickers, pièces jointes en drag & drop, signature.
- Workflow brouillon → soumis → revue → approuvé/rejeté avec permissions.
- Auto-save + historique des versions + restauration.

**Test** : rédiger un rapport, l'auto-save, restaurer une version, le soumettre,
le valider avec un compte gradé, le voir apparaître sur la fiche citoyen.

---

## Phase 6 — Module CASIERS JUDICIAIRES

- Liste, fiche, chefs d'accusation, peine (progression), tribunal, commentaires.
- Liaison automatique citoyen ↔ casier ↔ rapport, mise à jour du statut du
  citoyen (`INCARCERATED`, `PROBATION`), compteur d'arrestations du dashboard.

**Test** : créer un casier depuis un rapport d'arrestation ; le citoyen change de
statut, son onglet « Casier » et le KPI « arrestations » se mettent à jour.

---

## Phase 7 — Export PDF

- Moteur (`PdfDocument`, blocs, thème, polices, pagination, filigrane).
- Templates : citoyen, rapport (rendu du JSON TipTap), casier, véhicule, arme,
  effectif.
- `PdfPreviewDialog` avec options, téléchargement, entrée d'audit `EXPORT`.

**Test** : exporter les 5 types de fiches, vérifier en-tête/pied/pagination/photos
et la conformité visuelle « document officiel ».

---

## Phase 8 — Carte interactive (SIG)

- `MapCanvas` (CRS.Simple + SVG Los Santos), calibration des coordonnées.
- Outils de tracé (point, cercle, rectangle, polygone, polyligne), édition,
  suppression, style, icônes, catégories, couches, filtres, recherche.
- Persistance Firestore, liaison à un rapport/citoyen, panneau de propriétés.

**Test** : tracer une zone, la recharger après rafraîchissement, la filtrer par
catégorie, l'ouvrir depuis un rapport.

---

## Phase 9 — Module AGENTS & administration

- Annuaire (cartes/table), fiche agent, activité, rapports rédigés.
- Création de compte via app Firebase secondaire, matrice de permissions,
  activation/désactivation, réinitialisation de mot de passe.
- Panneau d'administration : référentiels (grades, divisions, types, codes
  pénaux), paramètres PDF, journal d'audit consultable.

**Test** : créer un compte deputy sans perdre sa propre session ; retirer une
permission et constater le blocage effectif (UI + règle Firestore).

---

## Phase 10 — Dashboard, recherche globale, finitions

- Dashboard complet (KPI temps réel, graphiques, panneaux, activité).
- Spotlight `Ctrl+K` (index local, préfixes de type, commandes, prefetch).
- Notifications (cloche + toasts), dernières recherches, favoris.
- Passe finale : animations, skeletons partout, virtualisation, memoization,
  code splitting vérifié, accessibilité clavier, `README` + guide de déploiement,
  jeu de données de démonstration.

**Test** : audit Lighthouse ≥ 90 en performance, bundle initial < 350 kB gzip,
parcours complet sans rechargement de page, aucun avertissement console.

---

## Suivi

| Phase | Livrable | Statut |
|---|---|---|
| 0 | Socle exécutable | ✅ livrée — `lint` et `build` verts, terminal fonctionnel |
| 1 | Auth & permissions | ✅ livrée — reste à activer Authentication côté console Firebase |
| 2 | Socle données & UI | ✅ livrée — `npm run check` couvre tokens et permissions |
| 3 | Citoyens | ⏳ |
| 4 | Véhicules & Armes | ⏳ |
| 5 | Rapports & éditeur | ⏳ |
| 6 | Casiers | ⏳ |
| 7 | PDF | ⏳ |
| 8 | Carte SIG | ⏳ |
| 9 | Agents & admin | ⏳ |
| 10 | Dashboard, recherche, finitions | ⏳ |

**Extensions envisageables après la phase 10** (hors périmètre actuel) : mandats
d'arrêt & BOLO dédiés, module CAD (dispatch temps réel), gestion des scellés,
statistiques UCR, mode hors-ligne complet.
