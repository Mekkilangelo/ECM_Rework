# FEATURES.md - Synergia ECM Monitoring

> Documentation complète et détaillée des fonctionnalités de l'application de suivi des traitements thermiques industriels.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Navigation & Interface](#2-navigation--interface)
3. [Authentification & Gestion des utilisateurs](#3-authentification--gestion-des-utilisateurs)
4. [Gestion hiérarchique des données](#4-gestion-hiérarchique-des-données)
5. [Formulaires & Saisie de données](#5-formulaires--saisie-de-données)
6. [Génération de rapports PDF](#6-génération-de-rapports-pdf)
7. [Fiche d'identification (Identification Sheet)](#7-fiche-didentification-identification-sheet)
8. [Gestion des fichiers](#8-gestion-des-fichiers)
9. [Recherche avancée](#9-recherche-avancée)
10. [Tables de référence](#10-tables-de-référence)
11. [Dashboard & Analytics](#11-dashboard--analytics)
12. [Logs & Monitoring](#12-logs--monitoring)
13. [Fonctionnalités avancées](#13-fonctionnalités-avancées)
14. [API Backend](#14-api-backend)
15. [Stack technique](#15-stack-technique)
16. [Import Excel des résultats de dureté](#16-import-excel-des-résultats-de-dureté)
17. [Spécifications dans les graphiques de dureté](#17-spécifications-dans-les-graphiques-de-dureté)
18. [Grilles de dimensions photos (PDF)](#18-grilles-de-dimensions-photos-pdf)
19. [CI/CD - Intégration et Déploiement Continus](#19-cicd---intégration-et-déploiement-continus)
20. [ETL - Import de données en masse](#20-etl---import-de-données-en-masse)
21. [ML API - Prédiction de recettes](#21-ml-api---prédiction-de-recettes)

---

## 1. Vue d'ensemble

**Synergia ECM Monitoring** est une application web complète de gestion et de suivi des processus de traitement thermique industriel (cémentation/carburation). Elle permet le suivi hiérarchique complet de la chaîne : Clients → Commandes → Pièces → Essais, avec gestion documentaire, génération automatique de rapports PDF et tableaux de bord analytiques.

### 1.1 Principaux cas d'usage

- Suivi des commandes clients et des essais de traitement thermique
- Enregistrement des paramètres de recettes (cycles thermiques et chimiques)
- Capture des résultats (micrographies, courbes de dureté, rapports four)
- Génération de rapports PDF professionnels avec signatures électroniques
- Recherche et analyse des essais passés
- Gestion des données de référence (aciers, fours, unités)

### 1.2 Architecture applicative

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  React 19 + React Router + Bootstrap + Chart.js + @react-pdf/renderer   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ REST API (axios)
┌─────────────────────────────────▼───────────────────────────────────────┐
│                              BACKEND                                     │
│           Node.js + Express + Sequelize ORM + JWT Auth                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   MySQL 8.0   │       │  File Storage   │       │  FastAPI (ML)   │
│   Database    │       │  (uploads/)     │       │  Prediction     │
└───────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 2. Navigation & Interface

### 2.1 Structure des pages

| Route | Page | Accès | Description |
|-------|------|-------|-------------|
| `/login` | Connexion | Public | Page d'authentification |
| `/dashboard` | Dashboard | Authentifié | Gestion hiérarchique principale |
| `/search` | Recherche | Authentifié | Recherche avancée des essais |
| `/reference` | Référence | Authentifié | Gestion des tables de référence |
| `/users` | Utilisateurs | Admin/Superuser | Gestion des comptes utilisateurs |
| `/logs` | Journaux | Admin/Superuser | Consultation des logs système |

### 2.2 Composants de navigation

| Composant | Fonctionnalité |
|-----------|----------------|
| **Sidebar** | Menu latéral collapsible avec icônes et labels |
| **Navbar** | Barre supérieure avec actions utilisateur |
| **Breadcrumb** | Fil d'Ariane pour la navigation hiérarchique |
| **Tab Navigation** | Onglets pour les sous-sections (formulaires, référence) |

### 2.3 Fonctionnalités UI/UX

| Fonctionnalité | Description |
|----------------|-------------|
| **Thème dark/light** | Toggle persistant entre mode sombre et clair |
| **Internationalisation** | Switcher français/anglais (i18n) |
| **Responsive design** | Adaptation mobile/tablet/desktop |
| **Routes protégées** | Redirection automatique si non authentifié |
| **État de chargement** | Spinners et skeleton loaders |
| **Notifications toast** | Feedback visuel des actions (succès, erreur, info) |
| **Modals de confirmation** | Validation avant actions destructives |
| **Raccourcis clavier** | Enter pour ajouter des cycles, navigation rapide |

---

## 3. Authentification & Gestion des utilisateurs

### 3.1 Authentification JWT

| Fonctionnalité | Description |
|----------------|-------------|
| **Login JWT** | Authentification par token JWT signé |
| **Refresh token** | Renouvellement automatique des tokens expirés |
| **Session timeout** | Déconnexion après période d'inactivité (`JWT_INACTIVITY_EXPIRE`) |
| **Auto-login** | Restauration de session au rechargement de page |
| **Déconnexion** | Invalidation des tokens côté client |

**Flux d'authentification :**
```
1. POST /api/auth/login (username, password)
2. Serveur valide credentials (bcrypt)
3. Génère JWT + Refresh Token
4. Client stocke dans localStorage
5. Axios interceptor ajoute Bearer token à chaque requête
6. Token expiré → Refresh automatique ou redirect /login
```

### 3.2 Gestion des utilisateurs (Admin/Superuser)

| Fonctionnalité | Description |
|----------------|-------------|
| **Création utilisateur** | Formulaire avec génération automatique de mot de passe |
| **Édition profil** | Modification des informations et du rôle |
| **Réinitialisation MDP** | Génération d'un mot de passe temporaire |
| **Suppression** | Suppression avec confirmation |
| **Liste paginée** | Affichage avec pagination et recherche |
| **Copie MDP** | Bouton copier vers presse-papier |

### 3.3 Rôles et permissions

| Rôle | Permissions |
|------|-------------|
| **user** | Lecture/écriture des données métier |
| **admin** | + Gestion utilisateurs, accès logs |
| **superuser** | + Mode lecture seule système, configuration avancée |

### 3.4 Sécurité

- Hashage bcrypt des mots de passe (salt rounds configurable)
- Tokens JWT signés avec secret configurable (`JWT_SECRET`)
- Protection CORS configurée
- Validation des entrées côté serveur (Yup/Joi)
- Logging des tentatives de connexion
- Rate limiting sur endpoints sensibles

---

## 4. Gestion hiérarchique des données

### 4.1 Modèle de données (Node-based Hierarchy)

L'application utilise un **modèle de nœuds universel** avec table de fermeture (closure table) pour gérer la hiérarchie.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              nodes                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  id | type    | parent_id | path           | name      | description   │
│  1  | client  | NULL      | /client/1      | ACME Corp | ...           │
│  2  | closure | 1         | /client/1/...  | CMD-001   | ...           │
│  3  | part    | 2         | /client/1/...  | Gear A    | ...           │
│  4  | trial   | 3         | /client/1/...  | TRL-001   | ...           │
│  5  | file    | 4         | /trial/4/...   | image.jpg | ...           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                             closure                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ancestor_id | descendant_id | depth                                    │
│  1           | 1             | 0      ← Self-relation                   │
│  1           | 2             | 1      ← Client → Order                  │
│  1           | 3             | 2      ← Client → Part (transitive)      │
│  1           | 4             | 3      ← Client → Trial (transitive)     │
│  2           | 3             | 1      ← Order → Part                    │
│  ...         | ...           | ...                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Hiérarchie métier

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│  (Entreprise cliente)                                           │
├─────────────────────────────────────────────────────────────────┤
│  - Nom, Code                                                    │
│  - Adresse (rue, ville, code postal, pays)                      │
│  - Contacts (nom, email, téléphone)                             │
│  - Groupe industriel                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ 1:N
┌───────────────────────────▼─────────────────────────────────────┐
│                    COMMANDE (Closure)                           │
│  (Demande d'essai / Order)                                      │
├─────────────────────────────────────────────────────────────────┤
│  - Référence commande                                           │
│  - Date de réception                                            │
│  - Contacts associés                                            │
│  - Documents attachés                                           │
│  - Statut de la commande                                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ 1:N
┌───────────────────────────▼─────────────────────────────────────┐
│                       PIÈCE (Part)                              │
│  (Échantillon à traiter)                                        │
├─────────────────────────────────────────────────────────────────┤
│  - Désignation, Référence                                       │
│  - Désignation client                                           │
│  - Dimensions (L × l × H, diamètre)                             │
│  - Poids (valeur + unité)                                       │
│  - Matériau / Acier (FK → steels)                               │
│  - Spécifications (dureté, profondeur ECD)                      │
│  - Photos de la pièce                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ 1:N
┌───────────────────────────▼─────────────────────────────────────┐
│                      ESSAI (Trial)                              │
│  (Test de traitement thermique)                                 │
├─────────────────────────────────────────────────────────────────┤
│  AVANT (Paramètres)           │  APRÈS (Résultats)              │
│  - Infos de base              │  - Statut final                 │
│  - Configuration four         │  - Résultats multiples          │
│  - Design de charge           │  - Micrographies                │
│  - Recette chimique           │  - Courbes de dureté            │
│  - Recette thermique          │  - Rapports four                │
│  - Paramètres trempe          │  - Post-traitement              │
│  - Préoxydation               │  - Observations                 │
│                               │  - Conclusion                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ 1:N
┌───────────────────────────▼─────────────────────────────────────┐
│                      FICHIERS (Files)                           │
│  (Documents, images, rapports associés)                         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Tables de données spécifiques

| Table | Clé primaire | Description |
|-------|--------------|-------------|
| `clients` | `node_id` (FK) | Données spécifiques client |
| `closures` | `node_id` (FK) | Données commande |
| `parts` | `node_id` (FK) | Données pièce |
| `trials` | `node_id` (FK) | Données essai |
| `files` | `node_id` (FK) | Métadonnées fichier |
| `recipes` | `id` | Recettes de traitement |
| `recipe_chemical_cycles` | `id` | Cycles chimiques |
| `recipe_thermal_cycles` | `id` | Cycles thermiques |

### 4.4 Opérations CRUD par niveau

| Niveau | Créer | Lire | Modifier | Supprimer | Cascade |
|--------|-------|------|----------|-----------|---------|
| Client | ✓ | ✓ | ✓ | ✓ | Supprime commandes, pièces, essais, fichiers |
| Commande | ✓ | ✓ | ✓ | ✓ | Supprime pièces, essais, fichiers |
| Pièce | ✓ | ✓ | ✓ | ✓ | Supprime essais, fichiers |
| Essai | ✓ | ✓ | ✓ | ✓ | Supprime fichiers |

### 4.5 Fonctionnalités de liste

- Pagination configurable (items par page : 10, 25, 50, 100)
- Tri par colonnes (date, nom, statut, référence)
- Recherche/filtrage rapide
- Actions inline (éditer, supprimer, dupliquer)
- Navigation drill-down vers le niveau enfant
- Indicateurs de statut colorés (badges)
- Sélection multiple pour actions groupées

---

## 5. Formulaires & Saisie de données

### 5.1 Formulaire Client

| Section | Champs |
|---------|--------|
| **Identification** | Nom*, Code client |
| **Adresse** | Rue, Ville, Code postal, Pays |
| **Contact** | Nom contact, Email, Téléphone |
| **Organisation** | Groupe industriel |

### 5.2 Formulaire Commande (Closure)

| Section | Champs |
|---------|--------|
| **Identification** | Référence commande*, Date réception |
| **Contacts** | Liste de contacts (ajout dynamique multiple) |
| **Documents** | Pièces jointes (cahier des charges, plans) |
| **Statut** | État de la commande |

### 5.3 Formulaire Pièce (Part)

| Section | Champs |
|---------|--------|
| **Identification** | Désignation*, Référence, Désignation client |
| **Dimensions** | Longueur, Largeur, Hauteur, Diamètre (avec unités) |
| **Masse** | Poids*, Unité de poids |
| **Matériau** | Sélection acier (dropdown avec recherche) |
| **Spécifications** | Dureté cible (min/max), Profondeur ECD (min/max) |
| **Visuels** | Upload photos de la pièce (drag & drop) |

### 5.4 Formulaire Essai (Trial) - Structure complète

#### Onglet AVANT (Paramètres d'essai)

**Section Informations de base**
| Champ | Type | Validation |
|-------|------|------------|
| Référence essai | Texte | Requis, unique |
| Date | Date picker | Requis |
| Statut | Select | Requis (En cours, Terminé, Annulé) |
| Emplacement | Select | FK → ref_location |
| N° de charge | Texte | Format spécifique |
| Type de montage | Select | FK → ref_mounting_type |
| Type de position | Select | FK → ref_position_type |
| Type de process | Select | FK → ref_process_type |

**Section Four**
| Champ | Type | Description |
|-------|------|-------------|
| Four | Select | FK → furnaces |
| Configuration | Options | Paramètres spécifiques au four |

**Section Design de charge (Load Design)**
| Champ | Type | Description |
|-------|------|-------------|
| Configuration | Visuel/Upload | Arrangement des pièces |
| Poids total | Nombre + Unité | Masse de la charge |
| Poids pièces | Nombre + Unité | Masse des pièces uniquement |
| Placement | Select | Position dans le four |

**Section Recette chimique (Chemical Cycle)**

Liste dynamique de cycles avec :

| Champ | Type | Description |
|-------|------|-------------|
| Type de cycle | Select | Carburation, Diffusion, Boost, etc. |
| Gaz 1/2/3 | Select | C2H2, N2, H2, etc. |
| Débit gaz 1/2/3 | Nombre | L/min |
| Temps d'attente gaz | Nombre | wait_gas (minutes) |
| Temps d'attente débit | Nombre | wait_flow (minutes) |
| Durée | Nombre + Unité | Temps du cycle |
| Potentiel carbone | Nombre | % C |

**Section Recette thermique (Thermal Cycle)**

Liste dynamique de paliers avec :

| Champ | Type | Description |
|-------|------|-------------|
| Température | Nombre | Consigne |
| Unité température | Select | °C, °F |
| Type de rampe | Select | up (montée), down (descente), continue (maintien) |
| Durée | Nombre | Temps au palier |
| Unité durée | Select | min, h |
| Pression | Nombre | Si applicable |
| Unité pression | Select | mbar, bar, Pa |

Actions : Boutons flèches pour ajouter/supprimer/réordonner les paliers

**Section Trempe (Quench)**

| Sous-section | Champs |
|--------------|--------|
| **Trempe huile** | Température huile (°C), Durée immersion (min), Type huile |
| **Trempe gaz** | Type de gaz (N2, He), Pression (bar), Débit, Vitesse ventilateur |

**Section Préoxydation**
| Champ | Type | Description |
|-------|------|-------------|
| Activée | Toggle | Oui/Non |
| Température | Nombre | Température de préox (°C) |
| Durée | Nombre | Temps de préox (min) |
| Atmosphère | Select | Air, N2 + O2, etc. |

**Section Preview Recette**
| Élément | Description |
|---------|-------------|
| Graphique temps/température | Chart.js en temps réel |
| Courbes gaz | Superposition des débits gaz |
| Mise à jour automatique | Réactif aux modifications |

#### Onglet APRÈS (Résultats d'essai)

**Section Résultats (structure dynamique)**
```
Résultat 1
├── Échantillon 1
│   ├── Micrographies (x50, x500, x1000, autre)
│   └── Description
├── Échantillon 2
│   └── ...
├── Courbes de dureté
│   ├── Tableau profondeur/dureté
│   └── Graphique automatique
└── Profondeurs (case, core)

Résultat 2
└── ...
```

**Sous-section Micrographies (par échantillon)**
| Grossissement | Type | Description |
|---------------|------|-------------|
| x50 | Image upload | Vue d'ensemble |
| x500 | Image upload | Détail structure |
| x1000 | Image upload | Haute résolution |
| Autre | Image upload | Grossissement personnalisé |
| Description | Textarea | Annotation de l'image |

**Sous-section Courbes de dureté**
| Champ | Type | Description |
|-------|------|-------------|
| Données | Tableau éditable | Colonnes : Profondeur (µm), Dureté (HV/HRC) |
| Graphique | Chart.js | Visualisation automatique |
| Profondeur case | Nombre | Profondeur de cémentation mesurée |
| Profondeur core | Nombre | Profondeur au cœur mesurée |
| Unité profondeur | Select | µm, mm |
| Unité dureté | Select | HV, HRC, HB |

**Section Rapports four (Furnace Reports)**
| Type | Description | Format |
|------|-------------|--------|
| Heating | Rapport de chauffe | PDF, Image |
| Cooling | Rapport de refroidissement | PDF, Image |
| Tempering | Rapport de revenu | PDF, Image |
| Alarms | Rapport des alarmes | PDF, Excel |
| Datapaq | Données de monitoring thermique | PDF, Image, CSV |

**Section Post-traitement**
| Champ | Description |
|-------|-------------|
| Grenaillage | Type, Intensité, Couverture, Durée |
| Détensionnement | Température, Durée |
| Lavage | Type, Durée, Produit |
| Rectification | Si applicable |

**Section Observations**
| Champ | Type | Description |
|-------|------|-------------|
| Observations | Textarea (rich) | Texte libre, notes, remarques |

**Section Conclusion**
| Champ | Type | Description |
|-------|------|-------------|
| Résultat | Select | PASS / FAIL / CONDITIONAL |
| Conclusion | Textarea | Texte de conclusion |
| Défauts | Liste tags | Défauts constatés (multi-select) |
| Actions correctives | Textarea | Si applicable |

### 5.5 Validation des formulaires

| Fonctionnalité | Technologie | Description |
|----------------|-------------|-------------|
| Schémas de validation | Yup | Règles déclaratives par champ |
| Gestion d'état | Formik | État formulaire et soumission |
| Validation temps réel | onChange | Feedback immédiat à la saisie |
| Messages d'erreur | i18n | Localisés FR/EN |
| Champs requis | Indicateurs | Astérisque rouge (*) |
| Validation croisée | Custom validators | Dépendances entre champs |
| Validation async | API calls | Unicité référence, existence FK |

### 5.6 Fonctionnalités avancées des formulaires

| Fonctionnalité | Description |
|----------------|-------------|
| Auto-save draft | Sauvegarde automatique du brouillon (localStorage) |
| Détection modifications | Alerte si fermeture avec changements non sauvés |
| Copier/coller | Duplication rapide de données entre champs |
| Raccourcis clavier | Enter pour ajouter ligne, Escape pour annuler |
| Focus management | Navigation au clavier optimisée (Tab, Shift+Tab) |
| Sections collapsibles | Accordéons avec état persistant |
| Undo/Redo | Historique des modifications (limité) |

---

## 6. Génération de rapports PDF

### 6.1 Architecture du système PDF

```
client/src/features/reports/
├── presentation/
│   └── components/
│       ├── ReportPDFDocument.jsx      ← Document principal
│       ├── ReportConfiguration.jsx    ← UI de configuration
│       └── PartIdentificationReport.jsx ← Fiche d'identification
├── infrastructure/
│   └── pdf/
│       ├── ReportPDFDocument.jsx      ← Composant @react-pdf
│       ├── components/
│       │   ├── CoverPage.jsx          ← Page de garde
│       │   ├── CommonReportHeader.jsx ← En-tête commun
│       │   ├── CommonReportFooter.jsx ← Pied de page commun
│       │   ├── PhotoContainer.jsx     ← Wrapper photos
│       │   └── RecipeCurveChartPDF.jsx ← Graphique SVG recette
│       ├── sections/
│       │   ├── IdentificationSectionPDF.jsx
│       │   ├── LoadSectionPDF.jsx
│       │   ├── RecipeSectionPDF.jsx
│       │   ├── ControlSectionPDF.jsx
│       │   ├── CurvesSectionPDF.jsx
│       │   ├── DatapaqSectionPDF.jsx
│       │   ├── MicrographySectionPDF.jsx
│       │   ├── PostTreatmentSectionPDF.jsx
│       │   └── ObservationsSectionPDF.jsx
│       ├── theme/
│       │   ├── colors.js
│       │   ├── typography.js
│       │   ├── spacing.js
│       │   ├── photoSizes.js
│       │   └── index.js
│       └── utils/
│           └── photoHelpers.js
```

### 6.2 Configuration du rapport

| Fonctionnalité | Description |
|----------------|-------------|
| Sélection sections | Checkbox pour activer/désactiver chaque section |
| Ordre personnalisé | Drag & drop pour réorganiser les sections |
| Preview | Aperçu temps réel avant génération |
| Smart rendering | Sections vides automatiquement ignorées |

**Sections disponibles :**
| Section | Clé | Activée par défaut |
|---------|-----|-------------------|
| Page de garde | `cover` | ✓ |
| Identification | `identification` | ✓ |
| Charge | `load` | ✓ |
| Recette | `recipe` | ✓ |
| Contrôle/Résultats | `control` | ✓ |
| Courbes | `curves` | ✓ |
| Datapaq | `datapaq` | ○ |
| Micrographies | `micrography` | ✓ |
| Post-traitement | `postTreatment` | ○ |
| Observations | `observations` | ✓ |

### 6.3 Structure détaillée du document PDF

#### Page de garde (CoverPage)

```
┌─────────────────────────────────────────────────────────────────┐
│  [HEADER: Logo ECM | ESSAI THERMIQUE | ECM SYNERGIA]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DÉSIGNATION PIÈCE                                        │   │
│  │ Client designation: XXXX        Steel: 16MnCr5          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SPÉCIFICATIONS TECHNIQUES                                │   │
│  │ Dureté: 58-62 HRC          ECD: 0.8-1.2 mm              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌───────────────────┬──────────────────┬──────────────────┐   │
│  │      GLOBAL       │     HEATING      │     COOLING      │   │
│  ├───────────────────┼──────────────────┼──────────────────┤   │
│  │ Wait time: 30min  │ Gas C2H2: 5 L/m  │ Pressure: 6 bar  │   │
│  │ Treatment: 240min │ Gas N2: 10 L/m   │ Fan: 100%        │   │
│  │ Total: 320min     │ Pressure: 8 mbar │ Oil temp: 80°C   │   │
│  └───────────────────┴──────────────────┴──────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ OBSERVATIONS                                             │   │
│  │ [Texte libre des observations...]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ CONCLUSIONS                                              │   │
│  │ [Texte de conclusion...]                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [FOOTER: Date génération | Logo Synergia | Page 1/X]          │
└─────────────────────────────────────────────────────────────────┘
```

**Calculs automatiques de la page de garde :**
- Wait time : `recipe.wait_time`
- Treatment time : `wait_time + Σ(chemical_cycle.duration)`
- Total cycle : `treatment_time + quench_time`
- Gas totals : Accumulation par type de gaz sur tous les paliers

#### Header commun (CommonReportHeader)

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────┐  ┌────────────────────────────┐│
│ │  ESSAI THERMIQUE            │  │         [ECM LOGO]         ││
│ │  ECM SYNERGIA               │  │          120×45px          ││
│ └─────────────────────────────┘  └────────────────────────────┘│
│ ┌─────────────────────────────┐  ┌────────────────────────────┐│
│ │ Client: ACME CORPORATION    │  │ Load: CHG-2024-001         ││
│ │ [Bordure rouge gauche]      │  │ Date: 15/01/2024           ││
│ │                             │  │ Process: Cémentation       ││
│ └─────────────────────────────┘  └────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

- Background : `#1e293b` (slate 800)
- Titre : 32pt, blanc, Helvetica-Bold
- Sous-titre : 12pt, rouge `#dc3545`
- Box client : fond blanc, bordure rouge gauche 4px
- Box info : fond blanc, aligné droite

#### Footer commun (CommonReportFooter)

```
┌─────────────────────────────────────────────────────────────────┐
│  Généré le 15/01/2024     [SYNERGIA LOGO]         Page 2 / 12  │
└─────────────────────────────────────────────────────────────────┘
```

- Position fixe en bas de page
- Date de génération dynamique
- Numérotation automatique via render prop

### 6.4 Sections détaillées

#### Section Identification

**Layout page 1 :**
```
┌─────────────────────────────────────────────────────────────────┐
│                    IDENTIFICATION                               │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┬────────────────┬─────────────┐                │
│ │ CUSTOMER DATA│   DIMENSIONS   │   WEIGHT    │                │
│ │    (40%)     │     (35%)      │    (25%)    │                │
│ ├──────────────┼────────────────┼─────────────┤                │
│ │ Designation  │ Length: 150mm  │ Weight: 2.5 │                │
│ │ Reference    │ Width: 80mm    │ Unit: kg    │                │
│ │ Quantity     │ Diameter: -    │             │                │
│ │ Steel        │ Height: 50mm   │             │                │
│ └──────────────┴────────────────┴─────────────┘                │
│                                                                 │
│ ┌──────────────────────────────────────────────┐               │
│ │            TECHNICAL SPECIFICATIONS           │               │
│ │  Hardness: 58-62 HRC    |    ECD: 0.8-1.2 mm │               │
│ └──────────────────────────────────────────────┘               │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │                    [HERO PHOTO]                          │    │
│ │                     340 × 190 px                         │    │
│ └─────────────────────────────────────────────────────────┘    │
│ ┌────────────────────┐  ┌────────────────────┐                 │
│ │   [Small Photo 1]  │  │   [Small Photo 2]  │                 │
│ │     165 × 110 px   │  │     165 × 110 px   │                 │
│ └────────────────────┘  └────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

**Pages suivantes (si > 3 photos) :**
- Grille 2×2 (4 photos par page)
- Taille : 220 × 140 px par photo
- Pagination : "IDENTIFICATION (continued) - 2 / 3"

#### Section Recette

**Thème 3 colonnes colorées :**
| Colonne | Couleur | Contenu |
|---------|---------|---------|
| Thermal | Rose `#fdf2f8` | Cycles thermiques |
| Chemical | Vert `#f0fdf4` | Cycles chimiques |
| Cooling | Bleu `#eff6ff` | Paramètres trempe |

**Graphique SVG du cycle thermique :**

```
Temperature (°C)
    ▲
950 │          ┌─────────────┐
    │         /│             │\
850 │        / │             │ \
    │       /  │             │  \
750 │      /   │             │   \
    │     /    │             │    \
    │    /     │             │     \
    │   /      │             │      \
    └──/───────┴─────────────┴───────\────────▶ Time (min)
       0      30     90     180    240

    ── Temperature curve (red #dc3545)
    ── C2H2 flow (green #14960e)
    ── N2 flow (blue #0064ff)
```

**Implémentation SVG (RecipeCurveChartPDF.jsx) :**
- Rendu vectoriel natif (pas d'image raster)
- Composants : `<Svg>`, `<Path>`, `<G>`, `<Line>`, `<Rect>`, `<Text>`
- Calcul des courbes :
  1. Point de départ : `cell_temp` (température cellule)
  2. Pour chaque `thermal_cycle` step : tracer selon `ramp_type`
     - `up` : ligne montante vers `setpoint`
     - `down` : ligne descendante vers `setpoint`
     - `continue` : plateau horizontal à `setpoint`
  3. Fin : rampe vers 0°C
- Superposition des courbes gaz (débits) synchronisées

#### Section Contrôle/Résultats

**Contenu :**
- Tableau des spécifications (min/max dureté, profondeur)
- Résultats mesurés vs spécifications
- Graphiques de courbes de dureté (SVG)
- Lignes de référence (spec min/max en pointillés)
- Grille de photos de contrôle

**Graphique courbe de dureté :**
```
Hardness (HV)
    ▲
800 │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ← Max spec
    │    ●
700 │      ●
    │        ●
600 │          ●    ●
    │            ●      ●
500 │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   ← Min spec
    │                      ●  ●
400 │                           ●
    └─────────────────────────────▶ Depth (µm)
      0   200  400  600  800 1000

    ● Measured points (blue series)
    ─ ─ Specification limits
```

#### Section Micrographies

**Layout unifié :**
```
┌─────────────────────────────────────────────────────────────────┐
│                      MICROGRAPHY                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Control Location: [Photo reference]                           │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Result 1 - Sample 1 │  │ Result 1 - Sample 1 │              │
│  │       x50           │  │       x500          │              │
│  │    [PHOTO]          │  │     [PHOTO]         │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Result 1 - Sample 1 │  │ Result 1 - Sample 2 │              │
│  │      x1000          │  │       x50           │              │
│  │    [PHOTO]          │  │     [PHOTO]         │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Grille 2×2 (4 photos par page)
- Organisation : par résultat → par échantillon → par grossissement
- Légendes automatiques avec contexte
- Pagination si plus de 4 photos

#### Section Datapaq

**Page 1 :** Stack vertical (2 photos max)
**Pages 2+ :** Grille 2×3 (6 photos par page)

### 6.5 Système de thème PDF

**Couleurs (colors.js) :**
```javascript
COLORS = {
  brand: {
    primary: '#0f4c81',    // Bleu ECM
    secondary: '#dc3545',  // Rouge accent
    dark: '#1e293b'        // Slate 800 (headers)
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    light: '#ffffff'
  },
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1'
  },
  background: {
    page: '#ffffff',
    section: '#f8fafc',
    highlight: '#f1f5f9'
  }
}
```

**Typographie (typography.js) :**
```javascript
TYPOGRAPHY = {
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase'
  },
  subsectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold'
  },
  body: {
    fontSize: 9,
    fontFamily: 'Helvetica'
  },
  caption: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748b'
  }
}
```

**Tailles photos (photoSizes.js) :**
```javascript
PHOTO_SIZES = {
  full: { width: 500, height: 375 },
  half: { width: 235, height: 176 },
  third: { width: 155, height: 116 },
  quarter: { width: 110, height: 82 },
  hero: { width: 340, height: 190 },
  heroSmall: { width: 165, height: 110 },
  gridItem: { width: 220, height: 140 }
}
```

### 6.6 Gestion des photos dans le PDF

**PhotoContainer.jsx :**
- Wrapper universel pour toutes les images
- Props : `photo`, `size`, `customSize`, `fit`, `showCaption`
- Gestion du `objectFit` : 'contain' (défaut) ou 'cover'
- Background fallback : `#f5f5f5`
- Bordure : 0.5pt `#ddd`

**Résolution URL (photoHelpers.js) :**
```javascript
getPhotoUrl(photo) {
  // Priorité 1: URL absolue existante
  if (photo.url) return photo.url;

  // Priorité 2: viewPath (préchargé)
  if (photo.viewPath) return photo.viewPath;

  // Priorité 3: Construction depuis ID
  if (photo.id) return `${API_URL}/files/${photo.id}`;

  return '';
}
```

**Validation photos :**
```javascript
validatePhotos(photos) {
  return photos.filter(p =>
    p.id || p.name || p.url || p.viewPath || p.file_path
  );
}
```

### 6.7 Export et téléchargement

| Fonctionnalité | Description |
|----------------|-------------|
| Téléchargement direct | Bouton "Download PDF" |
| Nom de fichier | `{reference}_{date}_report.pdf` |
| Métadonnées PDF | Title, Author, Subject, Creator, Producer |
| Compression | Images optimisées pour taille fichier |
| Format | A4 portrait (210 × 297 mm) |

---

## 7. Fiche d'identification (Identification Sheet)

### 7.1 Description

La **fiche d'identification** est un rapport PDF autonome focalisé uniquement sur les informations d'identification de la pièce. Elle peut être générée indépendamment du rapport complet.

### 7.2 Composant dédié

**Fichier :** `client/src/features/reports/presentation/components/PartIdentificationReport.jsx`

### 7.3 Contenu de la fiche

```
┌─────────────────────────────────────────────────────────────────┐
│                    FICHE D'IDENTIFICATION                       │
│                    IDENTIFICATION SHEET                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    DONNÉES CLIENT                         │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Désignation client : Pignon de transmission             │  │
│  │  Référence          : REF-2024-001                       │  │
│  │  Quantité           : 50 pcs                             │  │
│  │  Nuance acier       : 16MnCr5 (EN 10084)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    DIMENSIONS                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Longueur  : 150 mm                                      │  │
│  │  Largeur   : 80 mm                                       │  │
│  │  Hauteur   : 50 mm                                       │  │
│  │  Diamètre  : 120 mm                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    POIDS                                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Poids unitaire : 2.5 kg                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SPÉCIFICATIONS TECHNIQUES                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Dureté surface : 58 - 62 HRC                            │  │
│  │  Profondeur ECD : 0.8 - 1.2 mm                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    PHOTOS                                 │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                                                    │  │  │
│  │  │               [PHOTO PRINCIPALE]                   │  │  │
│  │  │                  340 × 190 px                      │  │  │
│  │  │                                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────┐  ┌──────────────────┐             │  │
│  │  │   [Photo 2]      │  │   [Photo 3]      │             │  │
│  │  │   165 × 110 px   │  │   165 × 110 px   │             │  │
│  │  └──────────────────┘  └──────────────────┘             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Généré le 15/01/2024        [LOGO]              Page 1 / 1    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Formatage des spécifications

| Condition | Format affiché |
|-----------|----------------|
| Min et Max définis | `min - max unit` (ex: "58 - 62 HRC") |
| Seulement Min | `≥ min unit` (ex: "≥ 58 HRC") |
| Seulement Max | `≤ max unit` (ex: "≤ 62 HRC") |
| Aucun | Section masquée |

### 7.5 Utilisation

- Accessible depuis la vue Pièce (Part)
- Bouton "Générer fiche d'identification"
- Téléchargement direct ou impression
- Partage du thème avec le rapport complet

---

## 8. Gestion des fichiers

### 8.1 Architecture de stockage

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHITECTURE FICHIERS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐         ┌──────────────────────────────────┐  │
│  │   CLIENT    │         │         BASE DE DONNÉES          │  │
│  │  (Browser)  │         │            (MySQL)               │  │
│  └──────┬──────┘         │                                  │  │
│         │                │  nodes (type='file')             │  │
│         │ Upload         │  ├── id, parent_id, path         │  │
│         ▼                │  └── description, data_status    │  │
│  ┌─────────────┐         │                                  │  │
│  │   MULTER    │         │  files                           │  │
│  │ (Middleware)│         │  ├── node_id (FK)                │  │
│  └──────┬──────┘         │  ├── original_name               │  │
│         │                │  ├── storage_key (immutable)     │  │
│         ▼                │  ├── file_path (legacy)          │  │
│  ┌─────────────┐         │  ├── size, mime_type             │  │
│  │ FileService │◄───────►│  ├── checksum (SHA-256)          │  │
│  └──────┬──────┘         │  ├── category, subcategory       │  │
│         │                │  ├── context (JSON)              │  │
│         ▼                │  │   ├── entity_type             │  │
│  ┌─────────────┐         │  │   ├── entity_id               │  │
│  │  STORAGE    │         │  │   ├── file_type               │  │
│  │  PHYSIQUE   │         │  │   ├── sample_number           │  │
│  │ (uploads/)  │         │  │   └── result_index            │  │
│  └─────────────┘         │  ├── version, is_latest          │  │
│                          │  └── uploaded_by, uploaded_at    │  │
│                          └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Schéma base de données (files)

```sql
CREATE TABLE files (
  node_id        INT PRIMARY KEY,           -- FK → nodes.id, CASCADE DELETE
  original_name  VARCHAR(255) NOT NULL,     -- Nom fichier original
  file_path      VARCHAR(500),              -- Chemin legacy (rétrocompat.)
  storage_key    VARCHAR(500) UNIQUE,       -- Clé stockage immutable
  size           BIGINT,                    -- Taille en bytes
  mime_type      VARCHAR(100),              -- Type MIME
  checksum       VARCHAR(64),               -- SHA-256
  category       VARCHAR(50),               -- FK → ref_file_category.name
  subcategory    VARCHAR(100),              -- Sous-catégorie dynamique
  context        JSON,                      -- Métadonnées JSON
  version        INT DEFAULT 1,             -- Numéro de version
  is_latest      BOOLEAN DEFAULT TRUE,      -- Dernière version
  previous_version_id INT,                  -- FK vers version précédente
  uploaded_by    INT,                       -- FK → users.id
  uploaded_at    DATETIME DEFAULT NOW(),
  modified_at    DATETIME,

  INDEX idx_category (category),
  INDEX idx_subcategory (subcategory),
  INDEX idx_storage_key (storage_key),
  INDEX idx_uploaded_by (uploaded_by)
);
```

### 8.3 Structure de stockage physique

```
server/uploads/
├── trial/
│   └── {trial_id}/
│       ├── micrograph/
│       │   ├── a3f5c9d1-sample-1-x50.jpg
│       │   ├── b7e2f4a8-sample-1-x500.jpg
│       │   └── c9d1e5b3-sample-1-x1000.jpg
│       ├── furnace_report/
│       │   ├── heating/
│       │   │   └── d4f6a2c8-heating-report.pdf
│       │   └── cooling/
│       │       └── e5g7b3d9-cooling-report.pdf
│       ├── datapaq/
│       │   └── f6h8c4e0-datapaq-data.pdf
│       ├── post_treatment/
│       │   └── g7i9d5f1-shot-peening.jpg
│       └── control_location/
│           └── h8j0e6g2-control-ref.jpg
│
├── part/
│   └── {part_id}/
│       ├── part_photo/
│       │   ├── i9k1f7h3-front-view.jpg
│       │   └── j0l2g8i4-profile-view.jpg
│       └── document/
│           └── k1m3h9j5-specification.pdf
│
├── client/
│   └── {client_id}/
│       └── document/
│           └── l2n4i0k6-contract.pdf
│
└── temp/
    └── {temp_id}/
        └── pending-upload.jpg
```

### 8.4 Format du Storage Key

```
{entityType}/{entityId}/{fileType}/{uuid8}-{safeName}.{ext}

Exemples:
- trial/456/micrograph/a3f5c9d1-sample-1-x50.jpg
- part/124/part_photo/07228bd8-IMG_9090.JPG
- part/701/document/096e602e-specification.pdf
```

**Composition :**
- `entityType` : trial, part, client, trial_request
- `entityId` : ID numérique de l'entité
- `fileType` : Type normalisé (micrograph, part_photo, document, etc.)
- `uuid8` : 8 premiers caractères d'un UUID v4
- `safeName` : Nom fichier nettoyé (max 50 chars, sans caractères spéciaux)
- `ext` : Extension originale

### 8.5 Catégories de fichiers

| Catégorie | Type normalisé | Usage | Extensions |
|-----------|----------------|-------|------------|
| `micrographs` | `micrograph` | Photos métallographiques | jpg, png |
| `photos` | `part_photo` | Photos de pièces | jpg, png |
| `documents` | `document` | Documents PDF/Office | pdf, doc, docx |
| `datapaq` | `datapaq` | Données monitoring four | pdf, jpg, csv |
| `furnace_report` | `furnace_report` | Rapports four | pdf, jpg |
| `post_treatment` | `post_treatment` | Photos post-traitement | jpg, png |
| `control_location` | `control_location` | Photos référence contrôle | jpg, png |
| `load_design` | `load_design` | Design de charge | jpg, pdf |

### 8.6 Sous-catégories dynamiques

| Catégorie | Format sous-catégorie | Exemple |
|-----------|----------------------|---------|
| Micrographies | `result-{idx}-sample-{idx}-{zoom}` | `result-0-sample-1-x500` |
| Furnace reports | `heating`, `cooling`, `datapaq` | `heating` |
| Part photos | `front`, `profile`, `quarter` | `front` |

### 8.7 Workflow d'upload

#### Upload immédiat (avec parent)

```
1. Client: POST /api/files/upload
   ├── multipart/form-data
   ├── files: File[]
   └── data: { nodeId, category, subcategory, descriptions }

2. Multer: Parse & store temp

3. FileService.saveUploadedFiles():
   ├── Validate parent node exists
   ├── For each file:
   │   ├── Build context (FileMetadataService)
   │   ├── Generate storage_key
   │   ├── Move to final location (FileStorageService)
   │   ├── Calculate SHA-256 checksum
   │   ├── Create node record (type='file')
   │   ├── Create closure relations
   │   └── Create file record
   └── Transaction commit

4. Response: { files: FileMetadata[], success: true }
```

#### Upload différé (temp → association)

```
Phase 1: Upload temporaire
─────────────────────────
1. Client: POST /api/files/upload (sans nodeId)
2. Stockage dans: /uploads/temp/{tempId}/
3. Context: { temp_id: tempId, ... }
4. Response: { files, tempId }

Phase 2: Association au save
────────────────────────────
1. Client: POST /api/trials (avec tempId dans payload)
2. Création du Trial (nodeId généré)
3. FileService.associateFilesToNode(tempId, nodeId):
   ├── Find files WHERE context.temp_id = tempId
   ├── For each file:
   │   ├── Generate new storage_key
   │   ├── Move file from temp/ to final/
   │   ├── Update node.parent_id
   │   ├── Recreate closure relations
   │   └── Update file record (remove temp_id)
   └── Cleanup empty temp directories
4. Response: Trial created with files
```

### 8.8 Services de stockage

#### FileStorageService (opérations physiques)

```javascript
class FileStorageService {
  // Initialisation
  constructor(baseDir = UPLOAD_BASE_DIR)
  ensureBaseDirExists()

  // Génération de clés
  generateStorageKey(entityType, entityId, fileType, originalFilename)
  parseStorageKey(storageKey) → { entityType, entityId, fileType, filename }
  getPhysicalPath(storageKey) → absolute path

  // Opérations fichier
  async saveFile(uploadedFile, storageKey)    // Multer file → storage
  async moveFile(oldKey, newKey)              // Déplacement
  async copyFile(sourceKey, targetKey)        // Copie (versioning)
  async deleteFile(storageKey)                // Suppression

  // Utilitaires
  async fileExists(storageKey) → boolean
  async getFileStats(storageKey) → { size, createdAt, modifiedAt }
  async generateChecksum(storageKey) → SHA-256 hex
  async listEntityFiles(entityType, entityId, fileType?) → keys[]
  async getEntityStorageSize(entityType, entityId) → bytes
  async cleanupEmptyDirectories(dirPath)
}
```

#### FileMetadataService (métadonnées)

```javascript
class FileMetadataService {
  // Construction du contexte
  async buildFileContext(params, parentNode) → {
    entity_type,
    entity_id,
    file_type,
    sample_number,
    result_index,
    parent_node_id,
    temp_id,
    upload_source,
    custom_tags
  }

  // Normalisation
  normalizeFileType(category) → normalized type
  normalizeFileSubtype(subcategory, fileType) → normalized subtype

  // Opérations métadonnées
  async addMetadata(fileNodeId, key, value, type)
  async updateMetadata(fileNodeId, key, value, type)
  async getMetadata(fileNodeId) → object
  async findFilesByMetadata(key, value) → fileIds[]
}
```

### 8.9 Résolution de chemin (rétrocompatibilité)

```javascript
getFileById(fileId) {
  const file = await File.findByPk(fileId);

  // Priorité 1: Nouveau système (storage_key)
  if (file.storage_key) {
    const path = fileStorageService.getPhysicalPath(file.storage_key);
    if (await fileStorageService.fileExists(file.storage_key)) {
      return { file, path };
    }
  }

  // Priorité 2: Migration à la volée
  if (file.file_path && fs.existsSync(file.file_path)) {
    // Générer nouveau storage_key
    const newKey = generateStorageKey(...);
    // Copier vers nouvelle location
    await copyFile(file.file_path, newKey);
    // Mettre à jour DB
    await file.update({ storage_key: newKey });
    return { file, path: getPhysicalPath(newKey) };
  }

  // Priorité 3: Legacy file_path direct
  if (file.file_path && fs.existsSync(file.file_path)) {
    return { file, path: file.file_path };
  }

  throw new NotFoundError('File not found');
}
```

### 8.10 Compression d'images (Sharp)

| Opération | Paramètres |
|-----------|------------|
| Resize | Max 2000×2000 px |
| Quality JPEG | 85% |
| Quality PNG | Compression niveau 6 |
| Format | Préservation du format original |
| Métadonnées | Strip EXIF (optionnel) |

### 8.11 Interface utilisateur upload

**FileUploader component :**

| Fonctionnalité | Description |
|----------------|-------------|
| Drag & drop | Zone de dépôt avec feedback visuel |
| Click to browse | Sélection via dialogue système |
| Multi-files | Jusqu'à 50 fichiers simultanés |
| Type filtering | Filtrage par MIME type |
| Progress bar | Barre de progression par fichier |
| Preview | Miniatures pour images |
| Description | Champ description par fichier |
| Remove | Suppression avant upload |
| Mode standalone | Upload immédiat |
| Mode standby | Upload différé (batch) |

### 8.12 Visualisation des fichiers

| Type | Viewer | Fonctionnalités |
|------|--------|-----------------|
| Images | ImageViewer | Zoom, pan, rotation |
| PDF | PDFViewer (react-pdf) | Pagination, zoom, plein écran |
| Excel | XLSXViewer | Affichage tableur en lecture |
| Autres | Download | Téléchargement direct |

### 8.13 API Fichiers

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/files/upload` | POST | Upload fichier(s) |
| `/api/files/:id` | GET | Télécharger/visualiser fichier |
| `/api/files/:id` | DELETE | Supprimer fichier |
| `/api/files/:id/metadata` | PATCH | Modifier métadonnées |
| `/api/files/associate` | POST | Associer temp files à node |
| `/api/files/node/:nodeId` | GET | Lister fichiers d'un node |

---

## 9. Recherche avancée

### 9.1 Interface de recherche

| Élément | Description |
|---------|-------------|
| Barre de recherche | Recherche full-text par mots-clés |
| Filtres avancés | Accordéons par catégorie |
| Filtres actifs | Chips avec suppression individuelle |
| Compteur résultats | Nombre total en temps réel |
| Reset | Bouton pour réinitialiser tous les filtres |

### 9.2 Filtres par catégorie

**Filtres Essai (Trial)**
| Filtre | Type | Champ DB |
|--------|------|----------|
| Plage de dates | Date range | `trials.date` |
| Numéro de charge | Texte | `trials.load_number` |
| Statut | Multi-select | `trials.status` |
| Emplacement | Multi-select | `trials.location` |
| Type de montage | Multi-select | `trials.mounting_type` |
| Type de process | Multi-select | `trials.process_type` |

**Filtres Client**
| Filtre | Type | Champ DB |
|--------|------|----------|
| Nom | Texte autocomplete | `clients.name` |
| Pays | Select | `clients.country` |
| Ville | Select | `clients.city` |
| Groupe | Select | `clients.group` |

**Filtres Pièce (Part)**
| Filtre | Type | Champ DB |
|--------|------|----------|
| Désignation | Texte | `parts.designation` |
| Référence | Texte | `parts.reference` |
| Longueur | Range min/max | `parts.length` |
| Largeur | Range min/max | `parts.width` |
| Poids | Range min/max | `parts.weight` |

**Filtres Spécifications**
| Filtre | Type | Champ DB |
|--------|------|----------|
| Dureté min | Range | `parts.hardness_min` |
| Dureté max | Range | `parts.hardness_max` |
| Profondeur ECD min | Range | `parts.ecd_min` |
| Profondeur ECD max | Range | `parts.ecd_max` |

**Filtres Acier (Steel)**
| Filtre | Type | Champ DB |
|--------|------|----------|
| Nuance | Multi-select | `steels.grade` |
| Famille | Multi-select | `steels.family` |
| Standard | Multi-select | `steels.standard` |
| Équivalents | Texte | `steels.equivalents` |

**Filtres Four (Furnace)**
| Filtre | Type | Champ DB |
|--------|------|----------|
| Type | Multi-select | `furnaces.type` |
| Taille | Multi-select | `furnaces.size` |
| Cellule de chauffe | Multi-select | `furnaces.heating_cell` |
| Média refroidissement | Multi-select | `furnaces.cooling_media` |

**Filtres Recette**
| Filtre | Type | Champ DB |
|--------|------|----------|
| Numéro de recette | Texte | `recipes.number` |

### 9.3 Affichage des résultats

| Fonctionnalité | Description |
|----------------|-------------|
| Vue grille | Cartes avec infos essentielles |
| Pagination | 10, 25, 50, 100 items/page |
| Tri | Par date (asc/desc), pertinence |
| Actions rapides | Voir détails, ouvrir essai, générer rapport |
| Export | CSV, Excel (à venir) |

---

## 10. Tables de référence

### 10.1 Organisation par onglets

| Onglet | Table | Description |
|--------|-------|-------------|
| **Aciers** | `steels` | Définitions des matériaux |
| **Fours** | `furnaces` | Équipements de traitement |
| **Pièces** | `ref_parts` | Templates de désignations |
| **Unités** | `ref_units` | Unités de mesure |
| **Process** | `ref_process_type` | Types de traitement |

### 10.2 Gestion des Aciers

**Champs :**
| Champ | Type | Description |
|-------|------|-------------|
| grade | VARCHAR | Nuance (ex: 16MnCr5) |
| family | VARCHAR | Famille (carbone, allié, inox) |
| standard | VARCHAR | Norme (ASTM, ISO, DIN, JIS, EN) |
| equivalents | TEXT | Correspondances entre normes |
| composition | JSON | Éléments chimiques (C, Mn, Cr, etc.) |

**Actions :**
| Action | Description |
|--------|-------------|
| Créer | Nouvelle nuance d'acier |
| Éditer | Modification inline |
| Supprimer | Avec vérification d'usage (FK check) |
| Remplacer | Substitution globale avec mise à jour FK |

### 10.3 Gestion des Fours

**Champs :**
| Champ | Type | Description |
|-------|------|-------------|
| name | VARCHAR | Identifiant du four |
| type | VARCHAR | batch, continu, sous vide |
| size | VARCHAR | Dimensions/capacité |
| heating_cell | VARCHAR | Type de chauffage |
| cooling_cell | VARCHAR | Type de refroidissement |
| max_temp | INT | Température max (°C) |
| atmosphere | VARCHAR | Atmosphères supportées |

### 10.4 Gestion des Unités

| Catégorie | Unités |
|-----------|--------|
| Température | °C, °F, K |
| Longueur | mm, µm, in, cm |
| Poids | kg, g, lb, oz |
| Pression | bar, mbar, Pa, psi, atm |
| Temps | s, min, h |
| Dureté | HRC, HV, HB, HRB |
| Débit | L/min, m³/h |

### 10.5 Composant SortableTable

| Fonctionnalité | Description |
|----------------|-------------|
| Tri colonnes | Click sur header pour trier |
| Pagination | Intégrée |
| Actions row | Éditer, Supprimer |
| Inline edit | Modification directe dans la cellule |
| Validation | Yup schema par champ |
| Recherche | Filtrage rapide |

---

## 11. Dashboard & Analytics

### 11.1 Vue principale

| Élément | Description |
|---------|-------------|
| Navigation hiérarchique | Drill-down Client → Commande → Pièce → Essai |
| Listes paginées | Affichage avec pagination configurable |
| Actions rapides | Créer, éditer, supprimer depuis la liste |
| Indicateurs de statut | Badges colorés par état |
| Compteurs | Nombre d'éléments par niveau |

### 11.2 Statistiques (en développement)

| Métrique | Description | Visualisation |
|----------|-------------|---------------|
| Essais par période | Volume temporel | Line chart |
| Taux de réussite | Pass/Fail ratio | Donut chart |
| Répartition par client | Volume par client | Bar chart |
| Utilisation des fours | Taux d'occupation | Heatmap |
| Délais moyens | Temps de traitement | KPI cards |

---

## 12. Logs & Monitoring

### 12.1 Accès

- **Restriction** : Admin et Superuser uniquement
- **Route** : `/logs`

### 12.2 Schéma de log

```sql
CREATE TABLE logs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  timestamp   DATETIME DEFAULT NOW(),
  level       ENUM('error', 'warning', 'info', 'success', 'debug'),
  action      VARCHAR(100),
  message     TEXT,
  user_id     INT,
  username    VARCHAR(100),
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  details     JSON,
  request_id  VARCHAR(36)
);
```

### 12.3 Filtres disponibles

| Filtre | Type | Description |
|--------|------|-------------|
| Plage de dates | Date range | Du/Au |
| Niveau | Multi-select | error, warning, info, success, debug |
| Action | Select | Type d'opération |
| Utilisateur | Select | Auteur de l'action |
| Adresse IP | Texte | Filtrage par IP |
| Message | Texte | Recherche dans le message |

### 12.4 Filtres rapides

| Bouton | Effet |
|--------|-------|
| Tous | Aucun filtre |
| Aujourd'hui | Date = aujourd'hui |
| 24h | Dernières 24 heures |
| 7 jours | Dernière semaine |
| Erreurs | Niveau = error uniquement |

### 12.5 Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| Pagination | 25, 50, 100, 200 items par page |
| Tri | Par timestamp (asc/desc) |
| Masquer logs système | Option de filtrage |
| Statistiques | Résumé par niveau (counts) |
| Export | CSV, JSON |
| Auto-refresh | Option de rafraîchissement auto |

### 12.6 Winston Logger (Backend)

```javascript
// Configuration Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});
```

---

## 13. Fonctionnalités avancées

### 13.1 Prédiction de recette (ML)

**Architecture :**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────►│   Node.js   │────►│   FastAPI   │
│   Client    │     │   Backend   │     │   Python    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  ML Model   │
                    │  (sklearn)  │
                    └─────────────┘
```

**Paramètres d'entrée (9) :**
| Paramètre | Type | Description |
|-----------|------|-------------|
| target_hardness | float | Dureté cible (HRC) |
| target_depth | float | Profondeur cible (mm) |
| load_weight | float | Poids de charge (kg) |
| steel_weight | float | Poids acier (kg) |
| steel_carbon | float | % Carbone acier |
| surface_area | float | Surface à traiter (cm²) |
| part_thickness | float | Épaisseur pièce (mm) |
| furnace_volume | float | Volume four (m³) |
| furnace_type | int | Type de four (encodé) |

**Sortie :**
- Recette thermique complète (paliers, durées, rampes)
- Recette chimique recommandée
- Paramètres de trempe suggérés
- Intervalle de confiance

### 13.2 Mode lecture seule

| Fonctionnalité | Description |
|----------------|-------------|
| Activation | Toggle superuser uniquement |
| Effet | Désactive tous les boutons d'édition/création/suppression |
| Indicateur | Banner rouge "Mode lecture seule" |
| Usage | Maintenance, démonstration, audit |
| Persistance | Variable d'environnement ou DB |

### 13.3 Gestion système

| Fonctionnalité | Description |
|----------------|-------------|
| Nettoyage fichiers temp | Purge /uploads/temp/ ancien de 24h |
| Diagnostics fichiers | Vérification intégrité (checksum) |
| Statistiques stockage | Espace utilisé par entité |
| Backup | Export DB + fichiers |
| Infos sécurité | État JWT, sessions actives |

### 13.4 Internationalisation (i18n)

**Configuration :**
```javascript
// i18n.js
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: frTranslation },
      en: { translation: enTranslation }
    },
    fallbackLng: 'fr',
    interpolation: { escapeValue: false }
  });
```

**Fichiers de traduction :**
```
client/src/locales/
├── fr/
│   └── translation.json
└── en/
    └── translation.json
```

**Utilisation :**
```javascript
const { t, i18n } = useTranslation();
t('dashboard.title');        // "Tableau de bord" ou "Dashboard"
i18n.changeLanguage('en');   // Changer la langue
```

| Élément traduit | Exemple FR | Exemple EN |
|-----------------|------------|------------|
| Labels | "Numéro de charge" | "Load number" |
| Messages | "Essai créé avec succès" | "Trial created successfully" |
| Erreurs | "Champ requis" | "Required field" |
| Dates | "15/01/2024" | "01/15/2024" |
| Nombres | "1 234,56" | "1,234.56" |

### 13.5 Gestion des erreurs

| Couche | Mécanisme | Description |
|--------|-----------|-------------|
| React | Error Boundaries | Capture erreurs composants |
| API | Axios interceptors | Gestion erreurs HTTP |
| Backend | Express error handler | Middleware centralisé |
| Logging | Winston | Enregistrement structuré |
| UI | Toast notifications | Feedback utilisateur |
| Retry | Axios retry | Tentatives sur erreurs réseau |

---

## 14. API Backend

### 14.1 Endpoints principaux

| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/auth/login` | POST | Authentification |
| `/api/auth/refresh` | POST | Renouvellement token |
| `/api/auth/logout` | POST | Déconnexion |
| `/api/users` | GET, POST | Liste, création utilisateurs |
| `/api/users/:id` | GET, PUT, DELETE | CRUD utilisateur |
| `/api/clients` | GET, POST | Liste, création clients |
| `/api/clients/:id` | GET, PUT, DELETE | CRUD client |
| `/api/trial-requests` | GET, POST | Liste, création commandes |
| `/api/trial-requests/:id` | GET, PUT, DELETE | CRUD commande |
| `/api/parts` | GET, POST | Liste, création pièces |
| `/api/parts/:id` | GET, PUT, DELETE | CRUD pièce |
| `/api/trials` | GET, POST | Liste, création essais |
| `/api/trials/:id` | GET, PUT, DELETE | CRUD essai |
| `/api/trials/search` | POST | Recherche avancée |
| `/api/files/upload` | POST | Upload fichier(s) |
| `/api/files/:id` | GET, DELETE | Télécharger, supprimer |
| `/api/files/associate` | POST | Associer fichiers temp |
| `/api/reports/:trialId` | GET | Générer rapport PDF |
| `/api/steels` | CRUD | Gestion aciers |
| `/api/furnaces` | CRUD | Gestion fours |
| `/api/references/:type` | CRUD | Tables de référence |
| `/api/recipe/predict` | POST | Prédiction ML |
| `/api/logs` | GET | Consultation logs |
| `/api/system/status` | GET | État système |
| `/api/system/settings` | GET, PUT | Configuration |

### 14.2 Architecture des routes

```
server/
├── routes/
│   ├── auth.js           # Authentification
│   ├── users.js          # Utilisateurs
│   ├── hierarchy.js      # Nodes (clients, orders, parts, trials)
│   ├── trials.js         # Endpoints spécifiques essais
│   ├── files.js          # Gestion fichiers
│   ├── reports.js        # Génération rapports
│   ├── search.js         # Recherche avancée
│   ├── steels.js         # Aciers
│   ├── furnaces.js       # Fours
│   ├── references.js     # Tables référence
│   ├── recipe.js         # Prédiction recette
│   ├── logs.js           # Logs système
│   └── system.js         # Configuration système
├── controllers/
│   └── [entity]Controller.js
├── services/
│   ├── trialService.js
│   ├── fileService.js
│   ├── reportService.js
│   └── storage/
│       ├── FileStorageService.js
│       └── FileMetadataService.js
└── middleware/
    ├── auth.js           # JWT validation
    ├── logging.js        # Request logging
    ├── validation.js     # Input validation
    └── error-handler.js  # Error handling
```

### 14.3 Pattern Request → Response

```
Client Request
      │
      ▼
┌─────────────┐
│   Router    │  ← Route matching
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Middleware  │  ← Auth, Logging, Validation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │  ← Request handling
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │  ← Business logic
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Model     │  ← Data access (Sequelize)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

---

## 15. Stack technique

### 15.1 Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 19 | Framework UI |
| React Router | 7 | Routing SPA |
| React Bootstrap | 2.x | Composants UI |
| Formik | 2.x | Gestion formulaires |
| Yup | 1.x | Validation schémas |
| Chart.js | 4.x | Graphiques |
| react-chartjs-2 | 5.x | Wrapper React Chart.js |
| @react-pdf/renderer | 3.x | Génération PDF |
| react-pdf | 7.x | Visualisation PDF |
| react-select | 5.x | Dropdowns avancés |
| react-datepicker | 4.x | Sélection dates |
| react-dropzone | 14.x | Upload drag & drop |
| FontAwesome | 6.x | Icônes |
| i18next | 23.x | Internationalisation |
| react-i18next | 13.x | Binding React i18n |
| axios | 1.x | Requêtes HTTP |
| jwt-decode | 4.x | Décodage tokens |
| xlsx | 0.18.x | Lecture fichiers Excel |
| react-toastify | 9.x | Notifications |

### 15.2 Backend

| Technologie | Version | Usage |
|-------------|---------|-------|
| Node.js | 20.x LTS | Runtime JavaScript |
| Express | 4.x | Framework web |
| Sequelize | 6.x | ORM |
| MySQL | 8.0 | Base de données |
| jsonwebtoken | 9.x | JWT |
| bcrypt | 5.x | Hashage mots de passe |
| Winston | 3.x | Logging |
| Sharp | 0.32.x | Traitement images |
| Multer | 1.x | Upload fichiers |
| Cors | 2.x | CORS middleware |
| Helmet | 7.x | Security headers |
| Express-validator | 7.x | Validation requêtes |
| UUID | 9.x | Génération identifiants |

### 15.3 Infrastructure

| Technologie | Usage |
|-------------|-------|
| Docker | Conteneurisation |
| Docker Compose | Orchestration multi-conteneurs |
| Nginx | Reverse proxy, SSL termination |
| GitHub Actions | CI/CD pipelines |
| Let's Encrypt / Self-signed | Certificats SSL |

### 15.4 Environnements

| Environnement | Caractéristiques |
|---------------|------------------|
| **Development** | Hot reload, logs verbose, DB sync alter |
| **Production** | Optimisé, SSL, logs structurés, DB sync false |
| **Test** | Base de données isolée, mocks |

### 15.5 Variables d'environnement clés

```env
# Database
MYSQL_ROOT_PASSWORD=xxx
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecm_monitoring
DB_USER=app
DB_PASSWORD=xxx
DB_SYNC_ALTER=true

# JWT
JWT_SECRET=xxx
JWT_EXPIRE=1h
JWT_INACTIVITY_EXPIRE=30m

# URLs
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:5001

# Storage
UPLOAD_BASE_DIR=./uploads
MAX_FILE_SIZE=50mb

# Logging
LOG_LEVEL=info
```

---

## 16. Import Excel des résultats de dureté

### 16.1 Vue d'ensemble

L'application permet d'importer des données de courbes de dureté directement depuis des fichiers Excel générés par les équipements de mesure (duromètres automatiques).

**Fichier source :** `client/src/components/dashboard/tests/hooks/modules/useExcelImport.js`

**Technologie :** Bibliothèque XLSX (Apache OpenXML standard)

### 16.2 Format de fichier attendu

Le fichier Excel suit un pattern fixe de **7 filiations** (emplacements de mesure) possibles, avec **9 colonnes par filiation** :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  FILIATION 1 (9 cols)  │  FILIATION 2 (9 cols)  │  ...  │  FILIATION 7     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Col 0: $LOCNAME.L(i)        → Nom de l'emplacement (ex: "Surface", "Core") │
│ Col 1: $STAT.SURFHVAL.L(i)  → Dureté surface (valeur principale)           │
│ Col 2: $STAT.CHD1.L(i)      → Profondeur ECD (Effective Case Depth)        │
│ Col 3: $STAT.MEAN.L(i)      → Valeur moyenne (indique CORE si présent)     │
│ Col 4: $STAT.BASE1.L(i)     → Mesure de base                               │
│ Col 5: $DISTANCE.L(i)       → Distance/profondeur pour la courbe           │
│ Col 6: $HVALUE.L(i)         → Valeur de dureté pour la courbe              │
│ Col 7: $HSCALE.L(i)         → Échelle de dureté (HRC, HV, HB)              │
│ Col 8: (séparateur vide)                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 16.3 Logique de traitement

```javascript
// Détection automatique des filiations actives
for (i = 0; i < 7; i++) {
  const headerCell = worksheet[col + ROW_HEADER];
  // Filiation active si header non vide et ne commence pas par '$'
  if (headerCell && !headerCell.startsWith('$')) {
    activeFiliations.push(i);
  }
}
```

**Types de filiations :**

| Type | Condition | Données extraites |
|------|-----------|-------------------|
| **Surface** | `$STAT.MEAN.L(i)` vide | Dureté surface + ECD + Courbe complète |
| **Core** | `$STAT.MEAN.L(i)` rempli | Dureté cœur uniquement (pas de courbe) |

### 16.4 Transformation des données

**Nettoyage :**
```javascript
// Conversion format européen (virgule → point)
value = value.replace(',', '.');

// Arrondi à 2 décimales
value = Math.round(value * 100) / 100;

// Filtrage des valeurs invalides
if (isNaN(value) || value === '') continue;
```

**Structure de sortie :**
```javascript
{
  hardnessPoints: [
    { location: "Surface", value: 62.5, unit: "HRC" },
    { location: "Core", value: 35.2, unit: "HRC" }
  ],
  ecdPositions: [
    { position: "CHD1", distance: 0.85 }  // en mm
  ],
  curveData: {
    distances: [0, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.5, 2.0],  // en mm
    series: [
      { name: "Filiation 1", values: [820, 810, 795, 780, 750, 720, 680, 550, 450] },
      { name: "Filiation 2", values: [815, 805, 790, 775, 745, 715, 675, 545, 445] }
    ]
  }
}
```

### 16.5 Workflow d'import

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Sélection      │     │  Parsing XLSX   │     │  Extraction     │
│  fichier Excel  │────►│  (browser-side) │────►│  7 filiations   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│  Mise à jour    │     │  Transformation │     │  Détection      │
│  formulaire     │◄────│  & validation   │◄────│  Surface/Core   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 16.6 Intégration dans le formulaire

- Bouton "Importer Excel" dans la section Résultats
- Preview des données avant confirmation
- Mapping automatique vers les champs du formulaire
- Support multi-séries pour les courbes

---

## 17. Spécifications dans les graphiques de dureté

### 17.1 Rendu des lignes de spécification

**Fichier :** `client/src/features/reports/infrastructure/pdf/sections/ControlSectionPDF.jsx`

Les spécifications (min/max dureté, profondeur ECD) sont affichées comme des **lignes de référence** sur les graphiques de courbes de dureté.

### 17.2 Types de lignes de spécification

| Type | Représentation | Couleur |
|------|----------------|---------|
| **ECD Spec** | Ligne horizontale pointillée | `#1e293b` (navy) |
| **Hardness Min** | Ligne horizontale | `#22c55e` (vert) |
| **Hardness Max** | Ligne horizontale | `#ef4444` (rouge) |
| **Depth Range** | Zone entre deux verticales | `#f1f5f9` (gris clair) |

### 17.3 Implémentation SVG

```javascript
// Parsing de la plage de profondeur
if (spec.range) {
  const rangeMatch = spec.range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
  // Extrait "0.6-0.9" de "0.6-0.9mm"
  depthMin = parseFloat(rangeMatch[1]);
  depthMax = parseFloat(rangeMatch[2]);
}

// Rendu de la ligne de spécification
<Svg>
  <Line
    x1={scaleX(depthMin)}
    y1={scaleY(spec.hardness)}
    x2={scaleX(depthMax)}
    y2={scaleY(spec.hardness)}
    stroke="#1e293b"
    strokeWidth={2}
    strokeDasharray="4 2"  // Ligne pointillée
  />
  <Text x={...} y={...}>
    ECD: {depthMin}-{depthMax}mm @ {spec.hardness} HV
  </Text>
</Svg>
```

### 17.4 Structure du graphique

```
Hardness (HV)
    ▲
900 │
    │ ═══════════════════════════════════  ← Max spec (850 HV)
850 │        ●
    │          ●
800 │            ●
    │              ●───────────────────   ← ECD spec (780 HV @ 0.6-0.9mm)
750 │                ●      │         │
    │                  ●    │  Zone   │
700 │                    ●  │  ECD    │
    │ ═══════════════════════════════════  ← Min spec (650 HV)
650 │                      ●│         │
    │                        ●        │
600 │                          ●      │
    │                            ●    │
550 │                              ●
    │                                ●
500 │                                  ●
    └──────────────────────────────────────▶ Depth (mm)
        0   0.2  0.4  0.6  0.8  1.0  1.2  1.4

    ● Série 1 (bleu #3b82f6)
    ● Série 2 (rouge #ef4444)
    ═ Lignes de spécification
    │ Zone ECD (grisée)
```

### 17.5 Couleurs des séries de données

```javascript
const SERIES_COLORS = [
  '#3b82f6',  // Blue
  '#ef4444',  // Red
  '#10b981',  // Emerald
  '#f59e0b',  // Amber
  '#8b5cf6',  // Violet
  '#ec4899'   // Pink
];
```

### 17.6 Légende du graphique

```
┌─────────────────────────────────────────────────────────┐
│  ● Filiation 1    ● Filiation 2    ● Filiation 3       │
│  ─ ─ ECD: 0.6-0.9mm @ 780 HV                           │
│  ─── Min: 650 HV    ─── Max: 850 HV                    │
└─────────────────────────────────────────────────────────┘
```

### 17.7 Header de spécifications techniques

Affiché en haut de chaque page de la section Contrôle :

```
┌─────────────────────────────────────────────────────────────────┐
│                   TECHNICAL SPECIFICATIONS                       │
├──────────────────────────────┬──────────────────────────────────┤
│  HARDNESS                    │  EFFECTIVE CASE DEPTH (ECD)      │
│  Surface: 750 - 850 HV       │  Depth: 0.6 - 1.0 mm             │
│  Core: ≥ 350 HV              │  @ 550 HV limit                  │
└──────────────────────────────┴──────────────────────────────────┘
```

---

## 18. Grilles de dimensions photos (PDF)

### 18.1 Définition des tailles

**Fichier :** `client/src/features/reports/infrastructure/pdf/theme/photoSizes.js`

```javascript
const PHOTO_SIZES = {
  // Tailles principales
  hero:              { width: 500, height: 300 },  // Photo principale pleine largeur
  fullWidth:         { width: 480, height: 200 },  // Pleine largeur, hauteur réduite
  fullPage:          { width: 500, height: 700 },  // Photo pleine page

  // Grilles 2 colonnes
  half:              { width: 235, height: 176 },  // 2 colonnes standard
  halfSecondary:     { width: 244, height: 200 },  // 2 colonnes secondaire
  small:             { width: 235, height: 140 },  // 2 colonnes compact

  // Grilles spécifiques
  gridItem:          { width: 244, height: 240 },  // Item grille 2×2
  grid6Item:         { width: 220, height: 125 },  // Item grille 2×3
  thumbnail:         { width: 120, height: 90  },  // Miniature

  // Layouts verticaux
  verticalItem:      { width: 500, height: 180 },  // Stack vertical
  stackedLarge:      { width: 500, height: 340 },  // Stack vertical large

  // Spécifiques par section
  heroLoad:          { width: 500, height: 280 },  // Hero section Load
  micrographySingle: { width: 480, height: 165 },  // Micrographie (3/page)
};
```

### 18.2 Stratégies de layout par section

**Configuration :** `SECTION_PHOTO_STRATEGIES`

| Section | 1 photo | 2 photos | 3+ photos | Max/page |
|---------|---------|----------|-----------|----------|
| **Identification** | Full width | 2 colonnes | Grille 2×3 | 6 |
| **Load** | Hero + 2 small | Grille 2×2 | Grille 2×2 | 3 (p1) / 4 (p2+) |
| **Curves** | Vertical stack | Vertical stack | Vertical stack | 2 |
| **Control** | Grille 2×3 | Grille 2×3 | Grille 2×3 | 6 |
| **Micrography** | Par zoom | Par zoom | Grille 2×2 | 4-6 |
| **Datapaq** | Vertical (2) | Grille 2×3 | Grille 2×3 | 2 (p1) / 6 (p2+) |

### 18.3 Layout Hero + Grid (Section Load)

**Page 1 :**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                    HERO PHOTO                           │   │
│  │                    500 × 280 px                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │                        │  │                        │        │
│  │     SMALL PHOTO 1      │  │     SMALL PHOTO 2      │        │
│  │      244 × 200 px      │  │      244 × 200 px      │        │
│  │                        │  │                        │        │
│  └────────────────────────┘  └────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Pages suivantes (2×2 grid) :**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │                        │  │                        │        │
│  │       PHOTO 1          │  │       PHOTO 2          │        │
│  │      244 × 240 px      │  │      244 × 240 px      │        │
│  │                        │  │                        │        │
│  └────────────────────────┘  └────────────────────────┘        │
│                                                                 │
│  ┌────────────────────────┐  ┌────────────────────────┐        │
│  │                        │  │                        │        │
│  │       PHOTO 3          │  │       PHOTO 4          │        │
│  │      244 × 240 px      │  │      244 × 240 px      │        │
│  │                        │  │                        │        │
│  └────────────────────────┘  └────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 18.4 Layout Grille 2×3 (6 photos/page)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │                  │  │                  │  │              │  │
│  │    220 × 125     │  │    220 × 125     │  │  220 × 125   │  │
│  │                  │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │                  │  │                  │  │              │  │
│  │    220 × 125     │  │    220 × 125     │  │  220 × 125   │  │
│  │                  │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 18.5 Composant PhotoContainer

**Props disponibles :**

| Prop | Type | Description |
|------|------|-------------|
| `photo` | Object | Objet photo avec url/id/name |
| `size` | String | Clé de PHOTO_SIZES ('half', 'hero', etc.) |
| `customSize` | Object | { width, height } personnalisé |
| `fit` | String | 'contain' (défaut) ou 'cover' |
| `showCaption` | Boolean | Afficher légende |
| `captionText` | String | Texte de légende personnalisé |

**Styles appliqués :**
```javascript
const containerStyle = {
  width: size.width,
  height: size.height,
  backgroundColor: '#f1f5f9',
  border: '1pt solid #cbd5e1',
  borderRadius: 4,
  overflow: 'hidden'
};

const imageStyle = {
  width: '100%',
  height: '100%',
  objectFit: fit  // 'contain' préserve ratio, 'cover' remplit
};
```

### 18.6 Espacement et marges

```javascript
const SPACING = {
  photoGap: 10,        // Entre photos dans une grille
  photoMarginBottom: 6, // Sous chaque photo
  sectionPadding: 15,   // Padding des sections
  pageMargin: 30        // Marge de page
};
```

---

## 19. CI/CD - Intégration et Déploiement Continus

### 19.1 Architecture des pipelines

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB ACTIONS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │   local.yml     │              │   release.yml   │          │
│  │  (dev branch)   │              │  (main branch)  │          │
│  └────────┬────────┘              └────────┬────────┘          │
│           │                                │                    │
│           ▼                                ▼                    │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │  Build & Test   │              │  Build & Package│          │
│  │  (Windows)      │              │  (Ubuntu)       │          │
│  └────────┬────────┘              └────────┬────────┘          │
│           │                                │                    │
│           ▼                                ▼                    │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │  Deploy Local   │              │  Create Release │          │
│  │  (Dev Server)   │              │  (Artifacts)    │          │
│  └─────────────────┘              └─────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 19.2 Pipeline Développement (local.yml)

**Déclencheur :** Push ou PR sur branche `dev`

**Runner :** Windows self-hosted (PowerShell)

**Étapes :**

```yaml
1. Checkout
   └── actions/checkout@v4

2. Generate .env
   └── Crée .env.dev avec secrets GitHub

3. Docker Cleanup
   └── docker system prune -f

4. Container Teardown
   └── docker compose -f docker-compose.dev.yml down

5. Build Images
   └── docker compose -f docker-compose.dev.yml build

6. Start Services
   └── docker compose -f docker-compose.dev.yml up -d

7. Wait for Startup
   └── Start-Sleep -Seconds 30

8. Run Unit Tests
   └── npm run test:unit

9. Run Integration Tests
   └── npm run test:integration

10. Output Success
    └── URLs: localhost:3000, localhost:5001
```

**Variables d'environnement :**
```env
NODE_ENV=development
MYSQL_ROOT_PASSWORD=${{ secrets.MYSQL_ROOT_PASSWORD }}
DB_PASSWORD=${{ secrets.DB_PASSWORD }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
JWT_EXPIRE=24h
JWT_INACTIVITY_EXPIRE=10m
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:5001/api
PYTHON_API_URL=http://ml-api:8000
```

### 19.3 Pipeline Release (release.yml)

**Déclencheur :** Push sur `main` ou tag `v*`

**Runner :** Ubuntu-latest

**Étapes :**

```yaml
1. Checkout
   └── actions/checkout@v4

2. Setup Docker Buildx
   └── docker/setup-buildx-action@v3

3. Extract Version
   └── grep version from package.json

4. Build Frontend
   └── docker buildx build
       --cache-from=type=gha,scope=frontend
       --cache-to=type=gha,mode=max
       --tag synergia-frontend:$VERSION
       ./client

5. Build Backend
   └── docker buildx build
       --tag synergia-backend:$VERSION
       ./server

6. Build ML API
   └── docker buildx build
       --tag synergia-ml-api:$VERSION
       ./api

7. Pull Dependencies
   └── docker pull mysql:8.0
       docker pull nginx:alpine

8. Create Release Directory
   └── mkdir -p release/images

9. Save All Images (Single Tar)
   └── docker save \
         synergia-frontend:$VERSION \
         synergia-frontend:latest \
         synergia-backend:$VERSION \
         synergia-backend:latest \
         synergia-ml-api:$VERSION \
         synergia-ml-api:latest \
         mysql:8.0 \
         nginx:alpine \
         -o release/images/all-images.tar

10. Generate Checksums
    └── sha256sum release/images/* > release/checksums.txt

11. Copy Deployment Scripts
    └── deploy.sh, rollback.sh, validate-bundle.sh

12. Generate Release Notes
    └── Build date, commit, branch, version

13. Create Archive
    └── tar -czvf synergia-release-v$VERSION.tar.gz release/

14. Upload Artifact
    └── retention-days: 90
```

### 19.4 Structure du bundle de release

```
synergia-release-v1.2.0.tar.gz
└── release/
    ├── images/
    │   └── all-images.tar          # Toutes les images Docker (500-800 MB)
    ├── docker-compose.yaml         # Configuration production
    ├── .env.example                # Template avec CHANGEME
    ├── deploy.sh                   # Script de déploiement
    ├── rollback.sh                 # Script de rollback
    ├── validate-bundle.sh          # Validation du bundle
    ├── checksums.txt               # SHA256 de tous les fichiers
    └── release-notes.txt           # Notes de version
```

### 19.5 Script de déploiement (deploy.sh)

**Fonctionnalités :**

```bash
#!/bin/bash

# 1. VÉRIFICATIONS PRÉALABLES
check_docker_installed
check_required_files
validate_env_file

# 2. BACKUP VERSION ACTUELLE
backup_current_version() {
  VERSION=$(cat .deployed_version 2>/dev/null || echo "unknown")
  mkdir -p backups/$VERSION
  docker save $(docker images -q) > backups/$VERSION/images-backup.tar
  cp .deployed_version backups/$VERSION/
}

# 3. CHARGEMENT DES IMAGES
load_images() {
  echo "Loading Docker images..."
  docker load < images/all-images.tar
}

# 4. CONFIGURATION NGINX
setup_nginx() {
  mkdir -p nginx/conf nginx/ssl

  # Génération certificat SSL auto-signé
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=FR/ST=IDF/L=Paris/O=ECM/CN=localhost"

  # Configuration proxy
  cat > nginx/conf/default.conf << 'EOF'
  server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    client_max_body_size 50M;
    proxy_read_timeout 300s;

    location / {
      proxy_pass http://frontend:3000;
    }

    location /api {
      proxy_pass http://backend:5001;
    }

    location /ml-api {
      proxy_pass http://ml-api:8000;
    }
  }
  EOF
}

# 5. DÉMARRAGE DES SERVICES
start_services() {
  docker compose down --remove-orphans
  docker system prune -f
  docker compose up -d
}

# 6. VÉRIFICATION SANTÉ
verify_health() {
  MAX_ATTEMPTS=15
  WAIT_SECONDS=15

  for i in $(seq 1 $MAX_ATTEMPTS); do
    # Check containers running
    if docker compose ps | grep -q "Up"; then
      # Check MySQL connection
      if docker compose exec -T database \
           mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1"; then
        echo "✓ Deployment successful!"
        return 0
      fi
    fi
    sleep $WAIT_SECONDS
  done

  echo "✗ Deployment failed - starting rollback"
  ./rollback.sh --force
  return 1
}

# 7. ENREGISTREMENT VERSION
save_version() {
  echo "$VERSION" > .deployed_version
  cp .deployed_version .deployed_version.backup
}
```

### 19.6 Script de rollback (rollback.sh)

```bash
#!/bin/bash

# Options
--status    # Affiche la version actuelle sans rollback
--force     # Rollback automatique sans confirmation

rollback() {
  # 1. Récupérer version précédente
  PREV_VERSION=$(cat .deployed_version.backup)

  # 2. Charger images backup
  docker load < backups/$PREV_VERSION/images-backup.tar

  # 3. Redémarrer services
  docker compose down
  docker compose up -d

  # 4. Restaurer marqueur de version
  cp backups/$PREV_VERSION/.deployed_version .deployed_version

  echo "Rolled back to version $PREV_VERSION"
}
```

### 19.7 Script de validation (validate-bundle.sh)

**Vérifications effectuées :**

| Check | Description |
|-------|-------------|
| Archive integrity | `tar -tzf` valide |
| Required files | docker-compose.yaml, .env.example, scripts |
| Script syntax | `bash -n` sur chaque script |
| Checksums | SHA256 correspondants |
| Docker images | Tar valide |
| YAML syntax | Parser Python si disponible |
| Required services | database, backend, frontend, ml-api |

```bash
#!/bin/bash

validate_bundle() {
  ERRORS=0

  # Check archive
  tar -tzf $BUNDLE_FILE > /dev/null 2>&1 || ((ERRORS++))

  # Check required files
  for file in docker-compose.yaml .env.example deploy.sh; do
    [ -f "$file" ] || ((ERRORS++))
  done

  # Check script syntax
  for script in *.sh; do
    bash -n "$script" || ((ERRORS++))
  done

  # Verify checksums
  sha256sum -c checksums.txt || ((ERRORS++))

  # Check docker images
  tar -tf images/all-images.tar > /dev/null || ((ERRORS++))

  # Check compose services
  for svc in database backend frontend ml-api; do
    grep -q "$svc:" docker-compose.yaml || ((ERRORS++))
  done

  return $ERRORS
}
```

### 19.8 Configuration Docker Compose Production

```yaml
version: '3.8'

services:
  database:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ecm_monitoring
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: synergia-backend:${VERSION:-latest}
    depends_on:
      database:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DB_HOST=database
      - DB_PORT=3306
    volumes:
      - uploads:/app/uploads

  frontend:
    image: synergia-frontend:${VERSION:-latest}
    depends_on:
      - backend

  ml-api:
    image: synergia-ml-api:${VERSION:-latest}

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
      - ml-api

volumes:
  mysql_data:
  uploads:
```

---

## 20. ETL - Import de données en masse

### 20.1 Vue d'ensemble

Le système ETL permet d'importer des données historiques depuis des fichiers CSV vers la base de données, en respectant la hiérarchie Client → Commande → Pièce → Essai.

**Script principal :** `server/scripts/etl-import-trials.js`

### 20.2 Commandes disponibles

```bash
# Afficher l'aide
npm run etl:help

# Valider les données avant import
npm run etl:validate path/to/data.csv

# Lancer l'import
npm run etl:load path/to/data.csv

# Mode verbose
npm run etl:load path/to/data.csv --verbose

# Dry run (simulation)
npm run etl:load path/to/data.csv --dry-run
```

### 20.3 Pipeline de traitement (6 étapes)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ETL PIPELINE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Stage 1: CSV Parsing                                           │
│  └── Lecture et parsing du fichier CSV                          │
│                                                                 │
│  Stage 2: Reference Data Initialization                         │
│  └── Création automatique des valeurs de référence manquantes   │
│      (unités, statuts, localisations, pays, standards acier)    │
│                                                                 │
│  Stage 3: Steel Grades Processing                               │
│  └── Import/mise à jour des nuances d'acier                     │
│                                                                 │
│  Stage 4: Client Creation                                       │
│  └── Création ou récupération des clients                       │
│                                                                 │
│  Stage 5: Trial Request Creation                                │
│  └── Création des commandes associées aux clients               │
│                                                                 │
│  Stage 6: Parts & Trials Creation                               │
│  └── Création des pièces et essais avec toutes les données      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 20.4 Mapping automatique des unités

Le système détecte automatiquement le type d'unité à partir du contexte :

```javascript
const UNIT_TYPE_MAPPING = {
  // Dureté
  'HRC': 'hardness', 'HV': 'hardness', 'HB': 'hardness', 'HRB': 'hardness',

  // Longueur
  'mm': 'length', 'cm': 'length', 'm': 'length', 'µm': 'length', 'in': 'length',

  // Masse
  'g': 'weight', 'kg': 'weight', 'lb': 'weight', 'oz': 'weight',

  // Température
  '°C': 'temperature', '°F': 'temperature', 'K': 'temperature',

  // Temps
  's': 'time', 'min': 'time', 'h': 'time',

  // Pression
  'bar': 'pressure', 'mbar': 'pressure', 'Pa': 'pressure', 'psi': 'pressure',

  // Débit
  'L/min': 'flow', 'm³/h': 'flow',

  // Vitesse
  'rpm': 'speed', '%': 'speed'
};
```

### 20.5 Validation des données JSON

Les champs JSON sont validés avant insertion :

```javascript
const JSON_FIELDS = [
  'dimensions_json',    // { length, width, height, diameter }
  'specifications',     // { hardness_min, hardness_max, ecd_min, ecd_max }
  'load_data',          // { weight, unit, placement }
  'recipe_data',        // { thermal_cycle, chemical_cycle }
  'quench_data',        // { oil_temp, oil_duration, gas_type, gas_pressure }
  'results_data'        // { hardness_points, ecd_positions, curve_data }
];

// Parsing flexible (string JSON ou objet)
function parseJsonField(value) {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
}
```

### 20.6 Statistiques d'import

```javascript
const stats = {
  clients:       { created: 0, existing: 0 },
  trialRequests: { created: 0, existing: 0 },
  parts:         { created: 0, existing: 0 },
  steels:        { created: 0, existing: 0 },
  trials:        { created: 0, errors: 0 },
  references:    { created: 0, existing: 0 }
};

// Affichage final
console.log(`
╔═══════════════════════════════════════╗
║         ETL IMPORT SUMMARY            ║
╠═══════════════════════════════════════╣
║ Clients:        ${stats.clients.created} created, ${stats.clients.existing} existing
║ Trial Requests: ${stats.trialRequests.created} created
║ Parts:          ${stats.parts.created} created
║ Trials:         ${stats.trials.created} created, ${stats.trials.errors} errors
║ Steels:         ${stats.steels.created} created
║ References:     ${stats.references.created} created
╚═══════════════════════════════════════╝
`);
```

### 20.7 Gestion des erreurs

- Transactions pour rollback en cas d'erreur
- Logging détaillé de chaque erreur
- Continuation après erreur (mode non-blocking)
- Rapport final avec liste des erreurs

---

## 21. ML API - Prédiction de recettes

### 21.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      ML PREDICTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   React     │     │   Node.js   │     │   FastAPI   │       │
│  │   Client    │────►│   Backend   │────►│   Python    │       │
│  └─────────────┘     └─────────────┘     └──────┬──────┘       │
│                                                  │              │
│                                   ┌──────────────┼──────────┐   │
│                                   │              ▼          │   │
│                                   │  ┌─────────────────┐    │   │
│                                   │  │  Feature        │    │   │
│                                   │  │  Engineering    │    │   │
│                                   │  └────────┬────────┘    │   │
│                                   │           │             │   │
│                                   │           ▼             │   │
│                                   │  ┌─────────────────┐    │   │
│                                   │  │  CBPWin         │    │   │
│                                   │  │  Simulator      │    │   │
│                                   │  └────────┬────────┘    │   │
│                                   │           │             │   │
│                                   │           ▼             │   │
│                                   │  ┌─────────────────┐    │   │
│                                   │  │  XGBoost        │    │   │
│                                   │  │  Model          │    │   │
│                                   │  └────────┬────────┘    │   │
│                                   │           │             │   │
│                                   │           ▼             │   │
│                                   │  ┌─────────────────┐    │   │
│                                   │  │  Recipe         │    │   │
│                                   │  │  Reconstruction │    │   │
│                                   │  └─────────────────┘    │   │
│                                   │                         │   │
│                                   └─────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 21.2 Endpoint de prédiction

**Route :** `POST /predict`

**Paramètres d'entrée (9 features) :**

| Paramètre | Type | Description | Unité |
|-----------|------|-------------|-------|
| `hardness_value` | float | Dureté cible | HRC |
| `target_depth` | float | Profondeur ECD cible | mm |
| `load_weight` | float | Poids de la charge | kg |
| `weight` | float | Poids des pièces | kg |
| `is_weight_unknown` | int | Poids inconnu (0/1) | - |
| `recipe_temperature` | float | Température cémentation | °C |
| `recipe_carbon_max` | float | Potentiel carbone max | % |
| `recipe_carbon_flow` | float | Débit gaz carboné | L/min |
| `carbon_percentage` | float | % Carbone de l'acier | % |

### 21.3 Pipeline de traitement

```python
def predict(input_data):
    # 1. Feature Engineering (9 → 17 features)
    base_features = extract_base_features(input_data)

    # 2. Simulation CBPWin
    simulator_results = run_cbpwin_simulation(base_features)
    # → first_carb, first_diff, second_carb, second_diff,
    #   last_carb, last_diff, final_time, num_cycles

    # 3. Combine features
    full_features = combine_features(base_features, simulator_results)

    # 4. XGBoost Prediction (10 outputs)
    predictions = model.predict(full_features)
    # → res_first_carb, res_first_diff, res_second_carb, res_second_diff,
    #   res_last_carb, res_last_diff, res_final_time, res_num_cycles,
    #   total_carb_time, total_diff_time

    # 5. Recipe Reconstruction
    recipe = reconstruct_recipe(predictions)

    return {
        'predicted_features': predictions,
        'reconstructed_recipe': recipe
    }
```

### 21.4 Structure de la recette reconstruite

```json
{
  "reconstructed_recipe": [
    {
      "step": 1,
      "type": "carburization",
      "temperature": 920,
      "duration": 45,
      "carbon_potential": 1.1
    },
    {
      "step": 2,
      "type": "diffusion",
      "temperature": 920,
      "duration": 30,
      "carbon_potential": 0.8
    },
    {
      "step": 3,
      "type": "carburization",
      "temperature": 900,
      "duration": 25,
      "carbon_potential": 1.0
    },
    {
      "step": 4,
      "type": "diffusion",
      "temperature": 850,
      "duration": 20,
      "carbon_potential": 0.7
    }
  ],
  "total_time": 120,
  "quench_recommendation": {
    "type": "oil",
    "temperature": 80
  }
}
```

### 21.5 Modèle utilisé

- **Algorithme :** XGBoost Regressor
- **Fichier modèle :** `api/models/best_recipe_model_XGBoost.pkl`
- **Training :** Données historiques de recettes
- **Métriques :** RMSE, MAE sur validation set

---

## Historique des versions

| Version | Date | Changements majeurs |
|---------|------|---------------------|
| 1.2.0 | 2024-01 | PDF layout standardization, Recipe Chart redesign |
| 1.1.x | 2023-12 | Sorting fixes, photo layout optimization |
| 1.0.0 | 2023-11 | Release initiale |

---

## Conventions de développement

### Commits

| Préfixe | Usage |
|---------|-------|
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `refactor:` | Refactoring sans changement fonctionnel |
| `test:` | Ajout/modification de tests |
| `docs:` | Documentation |
| `style:` | Formatage, style code |
| `chore:` | Maintenance, dépendances |

### Branches

| Branche | Usage |
|---------|-------|
| `main` | Production (releases) |
| `dev` | Développement actif |
| `feature/*` | Nouvelles fonctionnalités |
| `fix/*` | Corrections de bugs |
| `release/*` | Préparation releases |

---

