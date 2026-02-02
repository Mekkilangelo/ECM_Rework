# Patch Notes - Version 1.3.2

**Date:** 2026-02-02
**Version précédente:** 1.3.1

## 📋 Résumé

Cette version apporte une refonte majeure de la section Recette dans les rapports PDF avec une mise en page en 3 colonnes distinctes, des tableaux optimisés et une meilleure lisibilité visuelle.

---

## 🎨 Rapports PDF - Section Recette

### Refonte complète de la mise en page (feat)

**Architecture en 3 colonnes distinctes:**
- **Colonne Thermique (24%):** Préoxydation + Cycle thermique
- **Colonne Chimique (51%):** Gaz sélectionnés + Cycle chimique  
- **Colonne Refroidissement (25%):** Trempe gaz + Trempe huile

**Avantages:**
- ✅ Meilleure organisation visuelle des données
- ✅ Plus d'informations visibles sur une seule page
- ✅ Colonnes avec codes couleur distincts pour une lecture rapide
- ✅ Utilisation optimale de l'espace horizontal

### Amélioration des tableaux de données (feat)

**Tableaux compacts et optimisés:**
- Tailles de police réduites (7pt) pour plus de densité
- Bordures fines (0.5pt) pour un look moderne
- En-têtes avec fond gris clair (#f8fafc)
- Cellules parfaitement alignées avec `textAlign: 'center'`

**Cycle Thermique:**
- Colonnes: Step # | Ramp | Setpoint (°C) | Time (min)
- Largeurs adaptées au contenu

**Cycle Chimique:**
- Colonnes dynamiques selon les gaz sélectionnés
- Support de 1 à 3 gaz avec débits
- Colonnes: Step # | Time (s) | Gas1 | Gas2 | Gas3 | Press (mb) | Turbine

**Trempe (Speed & Pressure):**
- Tables séparées pour les paramètres de vitesse et pression
- Format compact: Step # | Duration (s) | Speed/Pressure

### Icônes SVG pour les rampes (feat)

**Flèches directionnelles redessinées:**
- Ramp Up: Flèche rouge vers le haut (#e11d48)
- Ramp Down: Flèche bleue vers le bas (#3b82f6)  
- Hold/Continue: Flèche verte vers la droite (#16a34a)
- Rendu vectoriel parfait avec `@react-pdf/renderer` SVG
- Taille réduite (8×8) pour s'intégrer dans les tableaux

### Système de couleurs thématiques (feat)

**Identité visuelle par colonne:**
```
Thermal (Rose):
- Header: #fff1f2 (Rose 50)
- Border: #e11d48 (Rose 600)
- Title: #9f1239 (Rose 800)

Chemical (Vert):
- Header: #f0fdf4 (Green 50)
- Border: #16a34a (Green 600)
- Title: #14532d (Green 800)

Cooling (Bleu):
- Header: #eff6ff (Blue 50)
- Border: #2563eb (Blue 600)
- Title: #1e3a8a (Blue 800)
```

### En-têtes de section avec pagination (feat)

**Header uniformisé:**
- Fond sombre (#1e293b) avec le numéro de recette
- Pagination claire (1/2, 2/2) pour les sections multipages
- Alignement justifié: titre à gauche, pagination à droite

**Gestion des photos:**
- Page 1: Graphique + Détails en 3 colonnes
- Page 2+: Photos en grille 2×2 (48% width chacune)
- Captions avec nom de fichier sous chaque photo

### Optimisations de rendu (fix)

**Performances et lisibilité:**
- Suppression des imports inutilisés (getSubsectionBackground, etc.)
- Composants helpers réutilisables: `InfoRow`, `RampArrow`
- Colonnes séparées en composants dédiés: `ThermalColumn`, `ChemicalColumn`, `QuenchColumn`
- Logique de détection de données vides améliorée
- Réduction de 698 → 493 lignes de code

**Nettoyage du code:**
- Suppression des anciens styles de tableaux complexes
- Simplification de la structure des styles
- Meilleure séparation des responsabilités
- Code plus maintenable et extensible

---

## 📈 Section Graphique de Recette

### Intégration optimisée (feat)

**Positionnement:**
- Le graphique `RecipeCurveChartPDF` s'affiche en haut de la page 1
- Dimensions: 500×200 (hauteur augmentée pour plus de détails)
- S'affiche au-dessus des colonnes de détails

**Affichage conditionnel:**
- Respect du paramètre `showRecipeCurve` 
- Respect du paramètre `showRecipeDetails`
- Pas d'affichage si aucune donnée de recette disponible

---

## 🔧 Corrections et améliorations techniques

### Gestion des données vides (fix)
- Vérification intelligente des sections vides
- Pas d'affichage de préoxydation si aucune donnée
- Détection des paramètres de trempe (speed/pressure) vides
- Composants qui retournent `null` si pas de données

### Compatibilité et robustesse (fix)
- Support des valeurs à 0 (différencié de `null`/`undefined`)
- Gestion des unités manquantes avec valeurs par défaut
- Protection contre les tableaux vides ou non définis
- Fallback "Unknown" pour le numéro de recette manquant

---

## 📦 Métadonnées de version

- **Version client:** 1.3.1 → 1.3.2
- **Version server:** 1.3.1 → 1.3.2
- **Version racine:** 1.3.1 → 1.3.2

---

## 🎯 Impact utilisateur

### Bénéfices directs:
- 📊 Rapports PDF beaucoup plus lisibles et professionnels
- 🎨 Utilisation optimale de l'espace avec layout en 3 colonnes
- 🔍 Tableaux compacts permettant plus de données par page
- 🌈 Codes couleur facilitant l'identification rapide des sections
- ⚡ Moins de pages nécessaires pour afficher les mêmes données

### Expérience améliorée:
- Moins de défilement nécessaire
- Informations groupées logiquement
- Design moderne et cohérent
- Meilleure imprimabilité

---

## 🔄 Migration

Aucune migration nécessaire. Les changements sont uniquement visuels dans la génération PDF.

---

## ⚠️ Notes importantes

- Les anciennes mises en page de rapports ne sont plus disponibles
- Le nouveau format est automatiquement appliqué à tous les rapports PDF générés
- Les rapports existants (déjà générés) conservent leur ancien format
