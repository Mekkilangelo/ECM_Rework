# Patch Notes - Version 1.2.15

**Date:** 2026-01-15
**Version précédente:** 1.2.14

## 📋 Résumé

Cette version apporte des améliorations majeures au système de rapports PDF avec optimisation de la mise en page des photos, support illimité des résultats/échantillons, et amélioration de l'expérience utilisateur.

---

## 🎨 Rapports PDF - Mise en page des photos

### Amélioration du rendu des images (fix)
- **Problème résolu:** Les photos étaient rognées (`objectFit: 'cover'`)
- **Solution:** Utilisation de `objectFit: 'contain'` avec letterboxing (fond gris #f5f5f5)
- Les photos sont désormais affichées entièrement sans rognage
- Ajout d'un paramètre `fit` pour choisir le mode si besoin

### Optimisation des grilles photo (fix)
- **Section Identification:**
  - Page 1: Titre + Données + Specs + 1ère photo (430×180)
  - Pages suivantes: Grille 2×3 (6 photos par page, 244×155 chacune)
- **Section Load Design:**
  - 1-3 photos: Layout hero-pair préservé
  - 4+ photos: Grille 2×3 (6 photos par page, 244×155)
- **Section Datapaq:**
  - Même layout que Load Design (hero+pair puis grille 2×3)
- **Section Micrography:**
  - Taille optimisée `micrographySingle` (480×165) pour 3 zooms par page
  - `wrap={false}` sur chaque ZoomGroup pour cohérence
  - Support des photos de control location

### Optimisation Section Control (fix)
- Courbe de dureté réduite: 300px → 200px
- Marges et paddings optimisés
- Plusieurs samples peuvent tenir sur une page
- `wrap={false}` sur le sample entier

---

## 🔄 Rapports - Gestion des sections dynamiques

### Support illimité des résultats/échantillons (fix)
- **Problème résolu:** Limite hardcodée à 5 résultats masquait les données au-delà
- **Solution intelligente:**
  - Récupération des vraies données du trial via `trialService.getTrial()`
  - Génération des sources uniquement pour les results/samples existants
  - Suppression des limites `maxResults` et `maxSamples`
  - Réduction drastique du nombre de requêtes API

**Avantages:**
- ✅ Support de n'importe quel nombre de résultats (5, 10, 50, 100+)
- ✅ Beaucoup moins de requêtes API (seulement celles nécessaires)
- ✅ Plus rapide et moins de charge serveur
- ✅ Plus maintenable (pas de limites arbitraires)

### Amélioration des titres de sections (feat)
- Titres formatés avec descriptions des résultats/échantillons
- Support des descriptions personnalisées dans les données du trial
- Meilleure lisibilité dans les rapports PDF

### Gestion intelligente des sections vides (feat)
- Détection automatique des sections sans données
- Option de désélection automatique des sections vides
- Possibilité de réactiver manuellement si nécessaire
- Amélioration de l'UX avec avertissements contextuels

### Synchronisation des options de section (fix)
- Les options de sections sont maintenant synchronisées avec le rapport pendant la configuration
- Résolution des problèmes de désynchronisation entre le sélecteur et le rapport

---

## 📊 Section Datapaq indépendante (feat)

### Nouvelle section dédiée
- Séparation de la section Datapaq des courbes fourneau
- Chargement optimisé des fichiers Datapaq dans le formulaire
- Catégorie dédiée pour une meilleure organisation

---

## 📈 Graphique de cycle de recette (feat)

### Visualisation du cycle thermique
- Ajout du graphique Recipe Curve dans les rapports PDF
- Visualisation claire des étapes du cycle thermique
- Intégration cohérente avec le design existant

---

## 🖼️ Gestion des fichiers et prévisualisations (feat)

### Support PDF complet
- Ajout de miniatures PDF dans l'interface
- Preview PDF amélioré avec `PDFThumbnail.jsx`
- Meilleure expérience utilisateur pour les fichiers PDF

### Correction rotation EXIF (fix)
- Désactivation de la rotation automatique EXIF
- Préservation de l'orientation originale des images
- Cohérence avec les photos téléchargées

---

## 🗄️ Backend - Base de données

### Suppression de contrainte unique (fix)
- Retrait de la contrainte unique sur `recipe_number`
- Plus de flexibilité dans la gestion des recettes

---

## 📝 Fichiers modifiés

### Frontend
- `client/src/features/reports/infrastructure/pdf/primitives/PhotoContainer.jsx`
- `client/src/features/reports/infrastructure/pdf/sections/IdentificationSectionPDF.jsx`
- `client/src/features/reports/infrastructure/pdf/sections/LoadSectionPDF.jsx`
- `client/src/features/reports/infrastructure/pdf/sections/DatapaqSectionPDF.jsx`
- `client/src/features/reports/infrastructure/pdf/sections/MicrographySectionPDF.jsx`
- `client/src/features/reports/infrastructure/pdf/sections/ControlSectionPDF.jsx`
- `client/src/features/reports/infrastructure/pdf/sections/CurvesSectionPDF.jsx`
- `client/src/features/reports/infrastructure/pdf/theme/photoSizes.js`
- `client/src/features/reports/presentation/components/SectionPhotoManager.jsx`
- `client/src/components/common/FileUploader/viewers/PDFThumbnail.jsx`
- `client/package.json` → **1.2.15**

### Backend
- `server/services/fileService.js`
- `server/services/partService.js`
- `server/services/trialService.js`
- `server/package.json` → **1.2.15**

---

## 🚀 Migration / Déploiement

Aucune migration de base de données requise pour cette version.

**Procédure de déploiement:**
```bash
git pull origin dev
npm install  # si nécessaire
# Redémarrer les services
```

---

## 🐛 Corrections notables

1. **Rognage des photos PDF** - Résolu avec objectFit: contain
2. **Limite 5 résultats** - Support illimité avec récupération intelligente
3. **Espaces inutilisés dans les PDF** - Optimisation des grilles 2×3
4. **Rotation EXIF** - Désactivée pour préserver l'orientation
5. **Sections vides** - Détection et gestion automatique

---

## 📚 Notes techniques

- Les rapports PDF utilisent désormais un système de grille cohérent (2×3, 6 photos/page)
- La génération de sources pour micrography/control utilise les vraies données du trial
- Le letterboxing utilise un fond gris clair (#f5f5f5) pour préserver l'aspect ratio
- Les requêtes API sont désormais optimisées (moins de charge serveur)

---

**Contributeurs:** Claude Opus 4.5, Mekkilangelo
