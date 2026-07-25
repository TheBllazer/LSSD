# LSSD RMS — Wireframes textuels

Grille de référence : **1600 × 900** minimum (desktop uniquement).
Chrome fixe : Navbar 48 px · Sidebar 236 px (repliable 56 px) · StatusBar 26 px.

Palette : `--navy-900 #0A0F1A` · `--navy-800 #0E1626` · `--navy-700 #142033`
`--steel-600 #1E2C42` · `--line #22314A` · `--text #E6EDF7` · `--muted #8A9AB4`
`--accent #2D7DD2` (bleu LSSD) · `--gold #C9A227` (étoile) · `--danger #C0392B`
`--warn #D68910` · `--ok #1E8E5A`

---

## 0. Chrome global

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ★ LSSD RMS │ Citoyens ▸ M. De Santa        [🔍 Rechercher…  Ctrl+K]   🔔3 ⚙ │ SGT J.M ▾│ 48px
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ ◧ TABLEAU    │ ┌ TabBar ────────────────────────────────────────────────────────────┐  │
│   DE BORD    │ │ ⌂ Tableau de bord │ 👤 M. De Santa ✕ │ 📄 LSSD-2026-000148 • ✕ │ + │  │ 34px
│ ▸ CITOYENS   │ └────────────────────────────────────────────────────────────────────┘  │
│ ▸ VÉHICULES  │                                                                          │
│ ▸ ARMES      │                        ZONE DE CONTENU (Outlet)                          │
│ ▸ RAPPORTS   │                                                                          │
│ ▸ CASIERS    │                                                                          │
│ ▸ CARTE      │                                                                          │
│ ▸ AGENTS     │                                                                          │
│ ──────────   │                                                                          │
│ ★ FAVORIS    │                                                                          │
│   • M. De S. │                                                                          │
│   • 46EEK572 │                                                                          │
│ ──────────   │                                                                          │
│ ⚙ ADMIN      │                                                                          │
├──────────────┴─────────────────────────────────────────────────────────────────────────┤
│ ● EN LIGNE │ SGT J. Marston #1042 │ 1L-24 │ PATROL │ 12 agents connectés │ 25/07 14:32 │ 26px
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* Sidebar : icône + libellé, indicateur actif = barre `--accent` 3 px à gauche,
  badge numérique par module (ex. rapports en attente de validation).
* Chaque item = `Ctrl+1..9`. Repli via `Ctrl+B` (animation width 236↔56, 180 ms).

---

## 1. Écran de connexion — `/login`

```
┌───────────────────────────────── plein écran, fond carte LS assombri ─────────────────────────────┐
│                                                                                                   │
│                              ┌──────── panneau 420×480 ────────┐                                  │
│                              │            ★  (étoile LSSD)     │                                  │
│                              │   LOS SANTOS SHERIFF'S DEPT.    │                                  │
│                              │   Records Management System     │                                  │
│                              │   ─────────────────────────     │                                  │
│                              │   ▣ Adresse e-mail              │                                  │
│                              │   ▣ Mot de passe            👁  │                                  │
│                              │   ☐ Rester connecté             │                                  │
│                              │   [ ▶ AUTHENTIFICATION ]        │                                  │
│                              │   ─────────────────────────     │                                  │
│                              │   ⚠ SYSTÈME RESTREINT — Toute   │                                  │
│                              │   activité est journalisée.     │                                  │
│                              │   v1.0.0 · Terminal LSSD-WEB    │                                  │
│                              └─────────────────────────────────┘                                  │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
```
États : idle · `loading` (barre de progression indéterminée sous le bouton) ·
`error` (panneau qui tremble 200 ms + bandeau rouge) · `disabled` (compte désactivé).

---

## 2. Tableau de bord — `/dashboard`

```
┌─ EN-TÊTE ────────────────────────────────────────────────────────────────────────────────┐
│ TABLEAU DE BORD OPÉRATIONNEL          Poste : Station Vespucci   ⟳ Actualisé il y a 12 s │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌KPI──────┐┌KPI──────┐┌KPI──────┐┌KPI──────┐┌KPI──────┐┌KPI──────┐                       │
│ │ 👤 1 284││ 📄  418 ││ ⛓  212 ││ 🚗  967 ││ 🔫  341 ││ 🟢   12 ││  ← compteurs animés   │
│ │ CITOYENS││ RAPPORTS││ ARREST.││ VÉHIC.  ││ ARMES   ││ EN LIGNE│                        │
│ │ +12 ⭡7j ││ +31 ⭡7j ││ +9  ⭡7j││ +18 ⭡7j ││ +4  ⭡7j ││         │                       │
│ └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘                       │
├───────────────────────────────────────────┬──────────────────────────────────────────────┤
│ ┌ ACTIVITÉ 30 JOURS (aires empilées) ────┐│ ┌ AGENTS CONNECTÉS ───────────────────────┐  │
│ │  rapports · arrestations · citations   ││ │ ● SGT J. Marston  1L-24  PATROL   14:32 │  │
│ │  ▁▂▄▆█▆▄▂▁▂▄▆█▇▅▃▂▁▂▄▅▇█▆▄▃▂▁          ││ │ ● DEP A. Cruz     1A-11  PATROL   14:30 │  │
│ └────────────────────────────────────────┘│ │ ◐ LT  M. Hoang    LT-2   INVEST.  13:58 │  │
│ ┌ RÉPARTITION PAR TYPE (donut) ──────────┐│ └─────────────────────────────────────────┘  │
│ │  Incident 42% · Arrest. 27% · …        ││ ┌ NOTIFICATIONS ──────────────────────────┐  │
│ └────────────────────────────────────────┘│ │ ⚠ Rapport 000148 en attente de validat. │  │
├───────────────────────────────────────────┤ │ ✔ Casier CR-2026-00087 créé             │  │
│ ┌ DERNIERS RAPPORTS ─────────────────────┐│ └─────────────────────────────────────────┘  │
│ │ N°       │ Type    │ Agent  │ Statut   ││ ┌ DERNIÈRES RECHERCHES ───────────────────┐  │
│ │ …000148  │ ARREST  │ J.M.   │ ⬤ REVUE  ││ │ 🔍 "de santa"    · 14:21 · 3 résultats  │  │
│ │ …000147  │ TRAFFIC │ A.C.   │ ⬤ APPR.  ││ │ 🔍 "46EEK"       · 13:44 · 1 résultat   │  │
│ └────────────────────────────────────────┘│ └─────────────────────────────────────────┘  │
│ ┌ DERNIÈRES ARRESTATIONS ────────────────┐│ ┌ ACTIVITÉ RÉCENTE (journal) ─────────────┐  │
│ │ 📷 T. Philips · PC 211 · 12/07 · 180j  ││ │ 14:31 SGT J.M. a modifié VEH 46EEK572   │  │
│ └────────────────────────────────────────┘│ │ 14:12 DEP A.C. a créé CIT F. Clinton    │  │
└───────────────────────────────────────────┴──────────────────────────────────────────────┘
```
Chargement : 6 `KpiSkeleton` pulsés → apparition en cascade (stagger 40 ms).
Chaque carte est une `Panel` avec `TitleBar` (titre + actions ⋮ + repli).

---

## 3. Registre des citoyens — `/citizens`

```
┌ CITOYENS ─────────────────────────────────────────────── [+ NOUVEAU CITOYEN] [⇩ EXPORT] │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔍 Recherche instantanée (nom, alias, téléphone, adresse…)     ⌨ tape → filtre < 50 ms   │
│ Statut ▾  Sexe ▾  Signalement ▾  Gang ▾  Permis ▾   ⟲ Réinitialiser   ▦ Colonnes  ⚏ Vue │
├──┬──────┬────────────────┬──────────┬─────┬───────────┬────────────┬──────────┬──────────┤
│☐ │ PHOTO│ NOM            │ NAISS.   │ SEXE│ TÉLÉPHONE │ ADRESSE    │ STATUT   │ ⚑ FLAGS  │
├──┼──────┼────────────────┼──────────┼─────┼───────────┼────────────┼──────────┼──────────┤
│☐ │ [📷] │ DE SANTA, M.   │12/04/1978│  M  │ 555-0199  │ Rockford…  │ ⬤ CLEAR  │ —        │
│☑ │ [📷] │ PHILIPS, T.    │09/11/1972│  M  │ 555-0143  │ Sandy Sh…  │ ⬤ WANTED │ ⚠ ARMÉ   │
│  │      │  ▸ 3 véhicules · 2 armes · 4 rapports · 3 casiers   (aperçu au survol)         │
└──┴──────┴────────────────┴──────────┴─────┴───────────┴────────────┴──────────┴──────────┘
│ 2 sélectionnés → [⇩ Exporter] [🖨 Fiches PDF] [✕ Supprimer]     ◀ 1 2 3 … 43 ▶  25/page  │
```
* Squelette de table : 12 lignes shimmer pendant le chargement.
* **Double-clic** → ouvre la fiche dans un onglet interne.
* **Clic droit** → Ouvrir · Ouvrir dans un onglet · Copier le nom · Ajouter aux favoris ·
  Exporter en PDF · Créer un rapport lié · Supprimer.
* Multi-sélection `Maj`/`Ctrl`, barre d'actions groupées qui remonte depuis le bas (slide).

---

## 4. Fiche citoyen — `/citizens/:id`

```
┌ FICHE CITOYEN ─────────────────────────────────────────────────────────────────────────┐
│ ┌────────┐  DE SANTA, Michael          ⬤ CLEAR    ★ Favori  ⇩ PDF  ✎ Modifier  ⋮       │
│ │ PHOTO  │  ID LSSD-C-00421 · H · 48 ans (12/04/1978) · 182 cm · 88 kg                  │
│ │ 128×160│  📞 555-0199 · ✉ m.desanta@ls.mail · 🏠 1 Portola Dr, Rockford Hills         │
│ │ (zoom) │  💼 Producteur — Richards Majestic     ⚑ —                                   │
│ └────────┘  Permis : 🚗 VALID · 🔫 SUSPENDED                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [IDENTITÉ] [VÉHICULES 2] [ARMES 1] [RAPPORTS 4] [CASIER 3] [PHOTOS 6] [HISTORIQUE] [NOTES]│
├──────────────────────────────────────────────────┬─────────────────────────────────────┤
│  ┌ IDENTITÉ ──────────────────────────────────┐  │ ┌ RÉSUMÉ ───────────────────────┐  │
│  │ Nom / Prénom / Alias      [champs éditables]│  │ │ ⛓ 3 arrestations              │  │
│  │ Naissance / Sexe / Taille / Poids           │  │ │ 📄 4 rapports                  │  │
│  │ Yeux / Cheveux                              │  │ │ 🚗 2 véhicules                 │  │
│  ├ COORDONNÉES ───────────────────────────────┤  │ │ 🔫 1 arme                      │  │
│  │ Téléphone / Mail / Adresse / District       │  │ │ Dernier contact : 12/07/2026   │  │
│  ├ PROFESSIONNEL ─────────────────────────────┤  │ └───────────────────────────────┘  │
│  │ Profession / Employeur                      │  │ ┌ AFFILIATIONS ─────────────────┐  │
│  ├ SIGNALEMENT ───────────────────────────────┤  │ │ 🏴 Aucun gang connu            │  │
│  │ Description / Signes particuliers           │  │ └───────────────────────────────┘  │
│  │ Tatouages [+ ajouter]  (liste + vignettes)  │  │ ┌ CHRONOLOGIE ──────────────────┐  │
│  ├ PERMIS ────────────────────────────────────┤  │ │ ● 12/07 Arrestation PC 211    │  │
│  │ Tableau : type / n° / statut / expiration   │  │ │ ● 04/06 Véhicule enregistré   │  │
│  └────────────────────────────────────────────┘  │ │ ● 01/02 Fiche créée           │  │
│  💾 Enregistré automatiquement il y a 3 s        │ └───────────────────────────────┘  │
└──────────────────────────────────────────────────┴─────────────────────────────────────┘
```
* Ouverture : Framer Motion `scale .97→1`, `y 8→0`, 180 ms, `easeOut`.
* Onglet **VÉHICULES** : mini-table cliquable → ouvre la fiche véhicule (nouvel onglet).
* Onglet **PHOTOS** : galerie masonry, lightbox avec zoom molette + navigation ←/→.
* Onglet **HISTORIQUE** : timeline verticale avec filtres par type d'événement.
* Auto-save : 1,2 s après la dernière frappe, indicateur `AutoSaveIndicator`
  (`Modifié…` → `Enregistrement…` → `✔ Enregistré 14:32`).

---

## 5. Registre des véhicules — `/vehicles` · `/vehicles/:id`

```
┌ VÉHICULES ──────────────────────────────────── [+ NOUVEAU VÉHICULE] [⇩ EXPORT]         │
│ 🔍 Plaque, VIN, marque, modèle, propriétaire…   Type ▾ État ▾ Assurance ▾ ⚑ Signalé ▾  │
├───┬───────┬──────────┬──────────────────┬──────┬────────┬──────────────┬───────────────┤
│ ☐ │ PHOTO │ PLAQUE   │ MARQUE / MODÈLE  │ ANNÉE│ COULEUR│ PROPRIÉTAIRE │ ÉTAT          │
│ ☐ │ [📷]  │ 46EEK572 │ Bravado Buffalo  │ 2021 │ Noir   │ ▸ M. De Santa│ ⬤ VALID       │
│ ☐ │ [📷]  │ 8FTR201  │ Declasse Tornado │ 1998 │ Rouge  │ ▸ T. Philips │ ⬤ VOLÉ ⚑      │
└───┴───────┴──────────┴──────────────────┴──────┴────────┴──────────────┴───────────────┘

FICHE VÉHICULE
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ┌ PHOTO ┐  46EEK572 — Bravado Buffalo STX (2021)   ⬤ VALID   ⇩ PDF  ✎  ⋮            │
│ │240×160│  VIN 1HGBH41JXMN109186 · Noir · Berline                                    │
│ └───────┘  Propriétaire ▸ [📷 M. De Santa]  (clic → fiche citoyen)                    │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ [FICHE TECHNIQUE] [PROPRIÉTAIRE] [RAPPORTS LIÉS 2] [PHOTOS] [HISTORIQUE]             │
│ Assurance : Mors Mutual · VALID · expire 12/2026    Fourrière : non                  │
│ État / description : « Pare-chocs avant enfoncé »                                    │
│ Signalements : ⚑ BOLO (ajouté par SGT J.M. le 12/07)                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Registre des armes — `/weapons` · `/weapons/:id`

```
┌ ARMES ────────────────────────────────────────── [+ ENREGISTRER UNE ARME] [⇩ EXPORT]   │
│ 🔍 N° de série, marque, modèle, propriétaire…  Catégorie ▾ Classification ▾ Statut ▾   │
├───┬───────┬──────────────┬──────────────────┬─────────┬────────────┬──────────────────┤
│ ☐ │ PHOTO │ N° SÉRIE     │ MARQUE / MODÈLE  │ CALIBRE │ CATÉGORIE  │ PROPRIÉTAIRE     │
│ ☐ │ [📷]  │ SN-77-A4192  │ Vom Feuer Combat │ .45 ACP │ HANDGUN    │ ▸ M. De Santa    │
└───┴───────┴──────────────┴──────────────────┴─────────┴────────────┴──────────────────┘

FICHE ARME : en-tête photo + n° série + statut ; onglets
[FICHE] [PROPRIÉTAIRE & PERMIS] [RAPPORTS LIÉS] [HISTORIQUE]
Bandeau d'alerte rouge si permis SUSPENDED/REVOKED alors que l'arme est REGISTERED.
```

---

## 7. Rapports — `/reports`

```
┌ RAPPORTS D'INCIDENT ─────────────────────────── [+ NOUVEAU RAPPORT] [⇩ EXPORT]         │
│ 🔍 N°, titre, contenu, agent, citoyen…  Type ▾ Statut ▾ Priorité ▾ Période ▾ Mes rapp.☐│
├───┬──────────────────┬───────────────────────┬─────────┬──────────┬────────┬──────────┤
│ ☐ │ N°               │ TITRE                 │ TYPE    │ DATE     │ AGENT  │ STATUT   │
│ ☐ │ LSSD-2026-000148 │ Vol à main armée…     │ ARREST  │ 12/07 14h│ J.M.   │ ⬤ REVUE  │
│ ☐ │ LSSD-2026-000147 │ Contrôle routier —…   │ TRAFFIC │ 12/07 09h│ A.C.   │ ⬤ APPR.  │
└───┴──────────────────┴───────────────────────┴─────────┴──────────┴────────┴──────────┘
```

## 7 bis. Éditeur de rapport — `/reports/:id/edit`

```
┌ LSSD-2026-000148 · BROUILLON ────── 💾 Auto-save 14:32 · 🔒 Verrouillé par vous ────────┐
│ [⇦ Retour] [👁 Aperçu] [⇩ PDF] [✔ SOUMETTRE] [⋮ Historique des versions]                │
├──────────────────────────────────────────────────────┬─────────────────────────────────┤
│ ┌ BARRE D'OUTILS ───────────────────────────────────┐│ ┌ MÉTADONNÉES ────────────────┐ │
│ │ ↶ ↷ │ P H1 H2 H3 │ B I U S │ 🎨 A │ ≡ ≣ ≡ │ • 1. ☑ ││ │ Titre        [_____________]│ │
│ │ ” <> ─ │ 🔗 🖼 ▦ │ Tableau ▾ │ Σ Modèles ▾        ││ │ Type         [ARREST      ▾]│ │
│ └───────────────────────────────────────────────────┘│ │ Classification [RESTRICTED ▾]│ │
│ ┌ ZONE D'ÉDITION (A4, 794 px, ombre portée) ────────┐│ │ Priorité     [HIGH        ▾]│ │
│ │ ★ LOS SANTOS SHERIFF'S DEPARTMENT                 ││ │ Date/heure   [12/07 14:20 ]│ │
│ │ RAPPORT D'ARRESTATION — LSSD-2026-000148          ││ │ Lieu         [Vespucci…   ]│ │
│ │ ────────────────────────────────────────────────  ││ ├ PERSONNES IMPLIQUÉES ───────┤ │
│ │ I. SYNOPSIS                                       ││ │ [🔍 Ajouter un citoyen…   ] │ │
│ │ Le 12/07/2026 à 14h20, en patrouille sur…         ││ │ 📷 T. Philips   SUSPECT   ✕ │ │
│ │                                                   ││ │ 📷 L. Ling      TÉMOIN    ✕ │ │
│ │ II. NARRATIF                                      ││ ├ AGENTS ────────────────────┤ │
│ │ ☑ Sommations effectuées                           ││ │ SGT J. Marston  PRIMAIRE  ✕ │ │
│ │ ☐ Assistance médicale                             ││ ├ VÉHICULES ─────────────────┤ │
│ │ [tableau : heure | événement | agent]             ││ │ 8FTR201  SUSPECT          ✕ │ │
│ │ [image collée depuis PostImage]                   ││ ├ ARMES ─────────────────────┤ │
│ │                                                   ││ │ SN-77-A4192  SAISIE       ✕ │ │
│ │ III. SIGNATURE                                    ││ ├ CHEFS D'ACCUSATION ────────┤ │
│ │ ______________  SGT J. Marston #1042              ││ │ PC 211 Vol qualifié       ✕ │ │
│ └───────────────────────────────────────────────────┘│ ├ PIÈCES JOINTES (drag&drop) ─┤ │
│  Mots : 412 · Caractères : 2 841 · Version 14        ││ │ ⬚ Déposez des URL PostImage │ │
└──────────────────────────────────────────────────────┴─┴─────────────────────────────┴─┘
```
* Panneau latéral redimensionnable (`SplitPane`, 320–520 px, position persistée).
* `Ctrl+S` force la sauvegarde ; auto-save toutes les 20 s si `dirty`.
* Sortie sans sauvegarde → `ConfirmDialog` bloquant.

---

## 8. Casiers judiciaires — `/records` · `/records/:id`

```
┌ CASIERS JUDICIAIRES ──────────────────────── [+ NOUVEAU CASIER] [⇩ EXPORT]             │
│ 🔍 Citoyen, n° de casier, chef d'accusation…  Type ▾ Disposition ▾ Statut ▾ Période ▾  │
├───┬──────┬───────────────┬──────────────┬────────────────┬──────────┬─────────┬───────┤
│ ☐ │ 📷   │ CITOYEN       │ N° CASIER    │ CHEFS          │ PEINE    │ AMENDE  │ STATUT│
│ ☐ │ [📷] │ PHILIPS, T.   │ CR-2026-00087│ PC 211 (+2)    │ 180 j    │ 12 500$ │ ⬤ ACT.│
└───┴──────┴───────────────┴──────────────┴────────────────┴──────────┴─────────┴───────┘

FICHE CASIER
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ┌MUGSHOT┐ CR-2026-00087 · PHILIPS, Trevor   ⬤ ACTIF   ⇩ PDF ✎ ⋮                        │
│ │160×200│ Délit majeur (FELONY) · 12/07/2026 · Los Santos Superior Court                │
│ └───────┘ Juge : Hon. R. Blackwell · Agent interpellateur : SGT J. Marston #1042        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ CHEFS D'ACCUSATION ───────────────┐ ┌ PEINE ──────────────────────────────────────┐  │
│ │ PC 211  Vol qualifié      ×1  1er │ │ Prison    180 jours   ▓▓▓▓▓▓░░░░ 62 j purgés│  │
│ │ PC 245  Agression armée   ×1      │ │ Probation   0 jour                          │  │
│ └───────────────────────────────────┘ │ TIG         40 heures                       │  │
│ ┌ PROCÉDURE ────────────────────────┐ │ Amende   12 500 $     ☑ Réglée              │  │
│ │ Disposition : CONVICTED           │ └─────────────────────────────────────────────┘  │
│ │ Rapport lié ▸ LSSD-2026-000148    │ ┌ PHOTOS ─┐ ┌ COMMENTAIRES ──────────────────┐  │
│ │ Citoyen ▸ [📷 T. Philips]         │ │ [][][]  │ │ LT M.H. — « Appel en cours »   │  │
│ └───────────────────────────────────┘ └─────────┘ └────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Carte interactive — `/map`

```
┌ SYSTÈME D'INFORMATION GÉOGRAPHIQUE ────────────────────────────────────────────────────┐
│ ┌ OUTILS ┐ ┌────────────────── CANEVAS CARTE (SVG Los Santos) ─────────┐ ┌ COUCHES ──┐ │
│ │ ⊹ Sélec.│ │                                                          │ │☑ Patrouille│ │
│ │ 📍 Point│ │        ●  Zone de patrouille Davis                       │ │☑ Scènes    │ │
│ │ ○ Cercle│ │       ╱ ╲                                                │ │☑ Gangs     │ │
│ │ ▱ Rect. │ │      ╱   ╲   ▲ Scène de crime — Vespucci                 │ │☐ POI       │ │
│ │ ⬠ Polyg.│ │     ╱_____╲                                              │ ├───────────┤ │
│ │ ⟋ Ligne │ │                    ○ Territoire Ballas (r=250)           │ │ ENTITÉS   │ │
│ │ ─────── │ │                                                          │ │🔍 filtre…  │ │
│ │ ✎ Modif.│ │                                                          │ │📍 Poste 1  │ │
│ │ ✕ Suppr.│ │                                                          │ │○ Ballas    │ │
│ │ ─────── │ │                                                          │ │⬠ Davis     │ │
│ │ ⤢ Recadr│ │  [+][-]  Échelle ▬▬ 500 m      X: 1 234  Y: -678         │ │(clic→zoom) │ │
│ └─────────┘ └──────────────────────────────────────────────────────────┘ └───────────┘ │
│ ┌ PROPRIÉTÉS DE L'ENTITÉ (panneau glissant depuis la droite) ─────────────────────────┐ │
│ │ Nom [Zone de patrouille Davis] Catégorie [PATROL_ZONE ▾] Couleur [■▾] Icône [🚔▾]   │ │
│ │ Description […] Visibilité [DIVISION ▾] Lier à ▸ [Rapport / Citoyen…] [✔] [✕]      │ │
│ └─────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
Molette = zoom (0.5× → 8×) · clic-glisser = déplacement · `Suppr` = supprimer la
sélection · `Échap` = annuler le tracé en cours · sauvegarde Firestore au relâchement.

---

## 10. Gestion des agents — `/agents`

```
┌ ANNUAIRE DU PERSONNEL ─────────────── [⚏ Cartes | ▤ Table] [+ CRÉER UN COMPTE] [⇩ PDF] │
│ 🔍 Nom, badge, indicatif…  Grade ▾ Division ▾ Statut ▾                                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌ CARTE AGENT ─────────┐ ┌──────────────────┐ ┌──────────────────┐                     │
│ │ ┌────┐ SGT           │ │ ┌────┐ DEP       │ │ ┌────┐ LT        │                     │
│ │ │📷  │ J. MARSTON    │ │ │📷  │ A. CRUZ   │ │ │📷  │ M. HOANG  │                     │
│ │ └────┘ #1042 · 1L-24 │ │ └────┘ #1188     │ │ └────┘ #0912     │                     │
│ │ PATROL · ● EN LIGNE  │ │ PATROL · ● LIGNE │ │ INVEST. · ◐ ABS. │                     │
│ │ Depuis le 04/02/2024 │ │ Depuis 11/2025   │ │ Depuis 06/2021   │                     │
│ │ [Fiche] [Permissions]│ │ …                │ │ …                │                     │
│ └──────────────────────┘ └──────────────────┘ └──────────────────┘                     │
└────────────────────────────────────────────────────────────────────────────────────────┘

FICHE AGENT : [PROFIL] [PERMISSIONS] [ACTIVITÉ] [RAPPORTS RÉDIGÉS] [ARRESTATIONS]
PERMISSIONS = matrice module × action, cases à cocher, héritage du rôle affiché en gris,
dérogations en bleu, bouton « Réinitialiser sur le rôle ». Réservé à `admin.permissions`.
```

---

## 11. Recherche globale — Spotlight (`Ctrl+K`)

```
              ┌──────────────── overlay flouté, panneau 720×480 ────────────────┐
              │ 🔍 de santa                                             ⏎ ouvrir│
              ├────────────────────────────────────────────────────────────────┤
              │ CITOYENS ───────────────────────────────────────────── 2       │
              │ ▸ 📷 DE SANTA, Michael   H · 1978 · ⬤ CLEAR         Ctrl+1     │
              │   📷 DE SANTA, Amanda    F · 1980 · ⬤ CLEAR                    │
              │ VÉHICULES ──────────────────────────────────────────── 1       │
              │   🚗 46EEK572  Bravado Buffalo — M. De Santa                   │
              │ RAPPORTS ───────────────────────────────────────────── 3       │
              │   📄 LSSD-2026-000148  Vol à main armée…                       │
              ├────────────────────────────────────────────────────────────────┤
              │ ↑↓ naviguer · ⏎ ouvrir · Ctrl+⏎ nouvel onglet · Échap fermer   │
              └────────────────────────────────────────────────────────────────┘
```
Filtres par préfixe : `c:` citoyens · `v:` véhicules · `w:` armes · `r:` rapports ·
`k:` casiers · `a:` agents · `>` commandes (créer un rapport, se déconnecter…).

---

## 12. Aperçu PDF

```
┌ APERÇU DU DOCUMENT — Fiche citoyen ─────────────────────────── [⇩ Télécharger] [🖨] [✕]│
│ ┌ Options ──────────┐ ┌───────────── rendu @react-pdf/renderer ────────────────────┐   │
│ │ ☑ Photo           │ │  ★ LOS SANTOS SHERIFF'S DEPARTMENT                         │   │
│ │ ☑ Véhicules       │ │    CITIZEN RECORD — CONFIDENTIAL                           │   │
│ │ ☑ Armes           │ │  ────────────────────────────────────────────────────────  │   │
│ │ ☑ Casier          │ │  [PHOTO]  DE SANTA, MICHAEL                                │   │
│ │ ☐ Historique      │ │           DOB 04/12/1978 · M · 6'0" · 194 lbs              │   │
│ │ Filigrane [CONF.▾]│ │  ▦ tableaux · § sections · ✎ bloc signature                │   │
│ └───────────────────┘ │  Page 1/3 · Généré le 25/07/2026 par SGT J. Marston #1042  │   │
│                       └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Éléments transverses

| Élément | Comportement |
|---|---|
| `ConfirmDialog` de suppression | Titre rouge, résumé de l'entité, saisie obligatoire du motif, bouton verrouillé 1,5 s. |
| `ContextMenu` | Apparition 90 ms (scale .95→1), repositionnement automatique près des bords, navigation clavier. |
| Toasts | Coin bas-droit, empilés, 4 s, barre de progression, icône par niveau. |
| Scroll | Barre personnalisée 10 px, piste `--navy-800`, poignée `--steel-600` → `--accent` au survol. |
| Skeletons | Dégradé shimmer 1,4 s, forme identique au contenu final (zéro saut de mise en page). |
| Ripple | Sur tous les boutons/lignes de table (MUI `TouchRipple`, opacité réduite à 0,12). |
| Barre de progression globale | 2 px sous la Navbar pendant les mutations réseau. |
