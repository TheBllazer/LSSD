# LSSD RMS — Inventaire des composants React

Convention : `PascalCase.jsx`, un composant exporté par défaut + sous-composants
nommés. Tous les composants de présentation sont **purs** (aucun accès Firebase).

---

## 1. `app/` — composition

| Composant | Rôle | Props principales |
|---|---|---|
| `AppProviders` | Empile Theme → Query → Auth → Workspace → CommandPalette → ContextMenu → Confirm → Notification → Toaster | `children` |
| `QueryProvider` | `QueryClient` + persistance IndexedDB + devtools en dev | `children` |
| `AppThemeProvider` | Thème MUI sombre + `CssBaseline` + tokens CSS | `children` |
| `AppRouter` | `HashRouter` + arbre de routes `lazy` | — |
| `ProtectedRoute` | Redirige vers `/login` si non authentifié ; affiche `BootSplash` pendant l'hydratation | `children` |
| `RoleRoute` | Bloque une route selon une permission | `permission`, `fallback` |
| `Can` | Rend les enfants si la permission est accordée | `do`, `any`, `fallback` |
| `ErrorBoundary` | Capture les erreurs de rendu, écran « défaillance système » + rechargement | `children`, `scope` |

---

## 2. `layouts/`

| Composant | Contenu |
|---|---|
| `AuthLayout` | Fond carte assombri, panneau centré, bandeau d'avertissement légal |
| `AppShell` | `Navbar` + `Sidebar` + `TabBar` + `<Outlet/>` + `StatusBar` + overlays globaux |
| `ModuleLayout` | `ModuleHeader` (titre, icône, compteur, actions) + `Breadcrumb` + zone filtres + contenu |
| `RecordLayout` | `RecordHeader` (photo, identité, badges de statut, actions) + `RecordTabs` + grille contenu/panneau latéral |
| `SplitLayout` | Deux volets redimensionnables persistés (`localStorage`) |

---

## 3. `components/system/` — chrome « logiciel »

`Panel` · `PanelHeader` · `PanelBody` · `PanelFooter` · `TitleBar` ·
`Toolbar` · `ToolbarButton` · `ToolbarSeparator` · `ToolbarToggleGroup` ·
`StatusBar` · `StatusItem` · `SplitPane` · `ResizeHandle` · `WindowFrame`
(modale « fenêtre » déplaçable avec barre de titre, minimiser/agrandir/fermer) ·
`SectionCard` · `FieldGroup` · `KeyValueRow` · `MetaBadge` · `StatusChip` ·
`SeverityChip` · `Divider` · `ScrollArea` · `Kbd`.

---

## 4. `components/data/`

| Composant | Description |
|---|---|
| `DataTable` | Enveloppe `@mui/x-data-grid` : densité, virtualisation, sélection multiple, tri serveur, colonnes persistées, double-clic, clic droit, état vide, squelette |
| `TableSkeleton` | N lignes shimmer calées sur les largeurs de colonnes |
| `TableToolbar` | Recherche instantanée + filtres + `ColumnPicker` + `DensityToggle` + `ExportMenu` |
| `BulkActionBar` | Barre d'actions groupées (slide depuis le bas) |
| `CursorPagination` | Pagination Firestore `startAfter`/`endBefore` + taille de page |
| `ColumnPicker` | Visibilité/ordre des colonnes (drag & drop dnd-kit) |
| `ExportMenu` | CSV · JSON · PDF (via le moteur de templates) |
| `EmptyState` | Icône + message + action primaire |
| `StatCard` | KPI animé (`CountUp`, delta 7 j, sparkline) |
| `MiniTable` | Table compacte pour les onglets de fiche (relations) |
| `RelationList` | Liste de relations avec vignette, libellé, badge, action « ouvrir » |
| `Timeline` | Chronologie verticale filtrable |
| `AuditTrail` | Journal d'entité (qui / quoi / quand / diff) |

---

## 5. `components/form/`

`Form` (wrapper RHF + zod) · `FormSection` · `FormRow` · `FormActions` ·
`TextField` · `TextAreaField` · `NumberField` · `SelectField` · `MultiSelectField` ·
`DateField` · `DateTimeField` · `SwitchField` · `RadioGroupField` · `TagInput` ·
`PhotoUrlField` (validation PostImage + aperçu live) · `ColorField` · `IconField` ·
`AddressField` · `LicenseEditor` · `TattooEditor` · `AffiliationEditor` ·
`ChargeEditor` (codes pénaux avec autocomplétion) · `SentenceEditor` ·
**Pickers reliés au registre** : `CitizenPicker`, `VehiclePicker`, `WeaponPicker`,
`AgentPicker`, `ReportPicker` (autocomplétion asynchrone, vignette + statut,
création à la volée) · `InvolvedPartyList` (picker + rôle + suppression) ·
`AutoSaveIndicator` · `DirtyGuard` (blocage de navigation si non sauvegardé).

---

## 6. `components/feedback/`

`Skeletons/` : `KpiSkeleton`, `TableSkeleton`, `RecordSkeleton`, `CardSkeleton`,
`EditorSkeleton`, `MapSkeleton` — `LoadingOverlay` · `TopProgressBar` ·
`ProgressBar` · `ConfirmDialog` · `DeleteConfirmDialog` (motif obligatoire) ·
`ToastHost` (config `react-hot-toast` aux couleurs du thème) · `NotificationCenter` ·
`NotificationItem` · `InlineError` · `PermissionDenied` · `BootSplash`.

---

## 7. `components/media/`

`PhotoUrlPreview` (état chargement/erreur/valide) · `Avatar` (initiales de repli) ·
`PhotoThumb` · `PhotoGallery` (grille masonry, sélection, réordonnancement) ·
`Lightbox` (zoom molette, panoramique, navigation clavier, rotation) ·
`MugshotFrame` (cadre type fiche d'écrou avec règle de mesure) · `PhotoDropzone`.

---

## 8. `components/navigation/`

`Navbar` (logo, breadcrumb, recherche, notifications, menu agent) ·
`Sidebar` + `SidebarItem` + `SidebarSection` + `SidebarCollapseButton` ·
`TabBar` + `WorkspaceTab` (titre, icône, point « modifié », fermeture, réordonnancement) ·
`Breadcrumb` · `FavoritesList` · `RecentList` · `UserMenu` · `ModuleHeader` ·
`RecordTabs` · `BackButton` · `OpenInTabButton`.

---

## 9. `components/search/`

`CommandPalette` (overlay, groupes, navigation clavier, prefetch au survol) ·
`CommandGroup` · `CommandItem` · `SearchInput` (debounce 120 ms + indicateur) ·
`SearchResultRow` · `QuickFilterBar` · `FilterChip` · `SavedFilters` ·
`HighlightedText` (surlignage des correspondances).

---

## 10. `components/editor/` (TipTap)

| Composant | Détail |
|---|---|
| `TipTapEditor` | Éditeur contrôlé, JSON + texte plat, auto-save, mode lecture seule |
| `EditorToolbar` | Groupes : historique · titres · style · couleur · alignement · listes · tâches · insertion · tableau · bloc |
| `EditorBubbleMenu` | Menu contextuel sur sélection |
| `EditorFloatingMenu` | Menu « + » en début de ligne vide |
| `TableControls` | Ajouter/supprimer ligne, colonne, fusionner, en-tête |
| `ImageInsertDialog` | Insertion par URL PostImage + légende + alignement |
| `LinkDialog` | Insertion/édition de lien |
| `TemplateMenu` | Modèles préremplis (arrestation, contrôle routier, usage de la force…) |
| `SignatureBlock` | Bloc de signature verrouillé (nom, badge, date) |
| `RevisionHistoryDialog` | Liste des versions, aperçu, restauration |
| `EditorStatusBar` | Mots, caractères, version, état d'enregistrement |
| `extensions/` | StarterKit, Underline, TextStyle, Color, Highlight, TextAlign, Table*, TaskList, TaskItem, Image, Link, Placeholder, CharacterCount, `LssdSectionNode` (nœud « section officielle » personnalisé) |

---

## 11. `components/map/`

`MapCanvas` (react-leaflet, `CRS.Simple`, `ImageOverlay` du SVG, bornes calées sur
les coordonnées GTA V) · `MapToolbar` (outils de tracé) · `MapLayerPanel` (couches
par catégorie) · `MapFeatureList` · `MapFeatureForm` (panneau glissant) ·
`MapContextMenu` · `MapSearch` · `CoordinateReadout` · `ScaleBar` ·
`FeatureRenderer` (Marker / Circle / Polygon / Polyline / Rectangle selon `kind`) ·
`DrawController` (machine à états du tracé) · `MapLegend`.

---

## 12. `components/pdf/`

`PdfPreviewDialog` (aperçu + options + téléchargement) · `PdfDownloadButton`
(`BlobProvider`, nom de fichier normalisé) · `PdfOptionsPanel` · `PdfLoading`.

---

## 13. `pdf/` — moteur de templates

```
pdf/engine/
  registerFonts.js     Inter + Roboto Mono embarqués
  PdfTheme.js          Couleurs, tailles, espacements (miroir du thème UI)
  PdfDocument.jsx      Enveloppe : Page A4, en-tête, pied de page, pagination, filigrane
  blocks/
    PdfHeader.jsx      Étoile LSSD + agence + type de document + n° + classification
    PdfFooter.jsx      « Page X / Y » + généré le/par + mention de confidentialité
    PdfSection.jsx     Titre de section numéroté + trait
    PdfField.jsx       Libellé / valeur (2 colonnes)
    PdfTable.jsx       Tableau générique (colonnes, largeurs, zébrage)
    PdfPhoto.jsx       Image distante + cadre + légende
    PdfSignature.jsx   Ligne de signature + nom + badge + date
    PdfBadge.jsx       Puce de statut
    PdfRichText.jsx    Conversion JSON TipTap → primitives react-pdf
pdf/templates/
  CitizenPdf.jsx  ReportPdf.jsx  RecordPdf.jsx  VehiclePdf.jsx  WeaponPdf.jsx  RosterPdf.jsx
pdf/index.js      renderTemplate(id, data, options) → <Document/>
```
Un template = composition déclarative de blocs → **modification triviale** sans
toucher au moteur.

---

## 14. Composants par module

### `modules/dashboard/`
`DashboardPage` · `KpiRow` · `ActivityChart` · `TypeDonut` · `OnlineAgentsPanel` ·
`LatestReportsPanel` · `LatestArrestsPanel` · `RecentSearchesPanel` ·
`ActivityFeedPanel` · `NotificationsPanel` · `QuickActionsPanel`.

### `modules/citizens/`
`CitizenListPage` · `CitizenDetailPage` · `CitizenFormDialog` · `CitizenHeader` ·
`CitizenIdentityTab` · `CitizenVehiclesTab` · `CitizenWeaponsTab` ·
`CitizenReportsTab` · `CitizenRecordTab` · `CitizenPhotosTab` ·
`CitizenHistoryTab` · `CitizenNotesTab` · `CitizenSummaryPanel` ·
`CitizenAffiliationsPanel` · `CitizenTimelinePanel` · `citizenColumns.jsx` ·
`citizenSchema.js`.

### `modules/vehicles/`
`VehicleListPage` · `VehicleDetailPage` · `VehicleFormDialog` · `VehicleHeader` ·
`VehicleSpecsTab` · `VehicleOwnerTab` · `VehicleReportsTab` · `VehicleHistoryTab` ·
`VehicleFlagsPanel` · `ImpoundPanel` · `vehicleColumns.jsx` · `vehicleSchema.js`.

### `modules/weapons/`
`WeaponListPage` · `WeaponDetailPage` · `WeaponFormDialog` · `WeaponHeader` ·
`WeaponSpecsTab` · `WeaponOwnerTab` · `WeaponLicenseAlert` · `WeaponReportsTab` ·
`WeaponHistoryTab` · `weaponColumns.jsx` · `weaponSchema.js`.

### `modules/reports/`
`ReportListPage` · `ReportDetailPage` · `ReportEditorPage` · `ReportHeader` ·
`ReportMetaPanel` · `ReportInvolvedPanel` · `ReportChargesPanel` ·
`ReportAttachmentsPanel` · `ReportStatusFlow` (brouillon → soumis → revue →
approuvé/rejeté) · `ReportReviewDialog` · `ReportLockBanner` ·
`reportColumns.jsx` · `reportSchema.js`.

### `modules/criminal-records/`
`RecordListPage` · `RecordDetailPage` · `RecordFormDialog` · `RecordHeader` ·
`ChargesPanel` · `SentencePanel` (barre de progression de peine) · `CourtPanel` ·
`RecordPhotosPanel` · `RecordCommentsPanel` · `recordColumns.jsx` ·
`recordSchema.js`.

### `modules/map/`
`MapPage` · `MapSidebar` · `MapPropertiesPanel` · `MapFilters` · `mapSchema.js`.

### `modules/agents/`
`AgentListPage` · `AgentDetailPage` · `AgentCard` · `AgentFormDialog` ·
`AgentCreateAccountDialog` (app Firebase secondaire) · `AgentProfileTab` ·
`AgentPermissionsTab` (matrice) · `AgentActivityTab` · `AgentReportsTab` ·
`AgentStatusToggle` · `agentColumns.jsx` · `agentSchema.js`.

### `modules/admin/`
`AdminPage` · `SettingsGeneralPanel` · `RanksPanel` · `ChargeCodesPanel` ·
`ReportTypesPanel` · `PdfTemplatePanel` · `AuditLogPage` · `DangerZonePanel`.

---

## 15. Hooks

**Données** (`hooks/data/`) — un fichier par entité, factory commune :
`useCitizens(filters)` · `useCitizen(id)` · `useCitizenRelations(id)` ·
`useCreateCitizen()` · `useUpdateCitizen()` · `useDeleteCitizen()` — idem pour
véhicules, armes, rapports, casiers, entités carte, agents.
Transverses : `useDashboardStats`, `useOnlineAgents`, `useNotifications`,
`useAuditTrail(entityType, entityId)`, `useGlobalSearch(query)`, `useSettings`.

**UI** (`hooks/ui/`) : `useDebounce` · `useHotkeys` · `useContextMenu` ·
`useConfirm` · `useDialog` · `useAutoSave(save, {delay})` · `useSelection` ·
`useLocalStorage` · `usePersistedColumns` · `useOpenRecord` · `useBreadcrumbs` ·
`useFavorites` · `useCopyToClipboard` · `usePrefetchOnHover` · `useDirtyGuard` ·
`useVirtualList` · `useIntersection`.

**Auth** (`hooks/auth/`) : `useAuth` · `usePermission(code)` · `useCurrentAgent` ·
`useRoleGuard(permission)` · `usePresenceHeartbeat`.
