# Améliorations du Système de Photos avec Métadonnées

## Problème Résolu

Auparavant, le `SectionPhotoManager` transmettait seulement les IDs des photos sélectionnées sans leur catégorie/sous-catégorie. Cela causait un problème dans `CurvesSection` où les photos étaient mal organisées (ex: 3 photos heating + 1 cooling affichées comme 2 heating + 1 cooling).

## Solution Implémentée

### 1. Modifications dans `SectionPhotoManager.jsx`

- **Nouvelle fonction**: `organizeSelectedPhotosWithMetadata()` remplace `organizeSelectedPhotosBySubcategory()`
- **Transmission enrichie**: Chaque photo sélectionnée est maintenant transmise avec ses métadonnées :
  ```javascript
  {
    id: "photo123",
    name: "heating_curve_1.jpg",
    category: "furnace_report",
    subcategory: "heating",
    viewPath: "/path/to/photo",
    originalData: { /* données complètes de la photo */ }
  }
  ```

- **Organisation par sous-catégorie**: Pour `curves`, les photos sont organisées par leur vraie sous-catégorie :
  ```javascript
  {
    heating: [photo1WithMetadata, photo2WithMetadata, photo3WithMetadata],
    cooling: [photo4WithMetadata],
    datapaq: [],
    alarms: []
  }
  ```

### 2. Modifications dans `CurvesSection.jsx`

- **Support des métadonnées**: Nouvelles fonctions utilitaires :
  - `getPhotoUrl(photo)` - Supporte les objets photo et les IDs simples
  - `getPhotoId(photo)` - Extrait l'ID depuis un objet photo ou retourne l'ID direct

- **Organisation améliorée**: `getCurvesPhotosByCategory()` utilise maintenant les vraies sous-catégories des photos

### 3. Modifications dans d'autres sections

- **`IdentificationSection.jsx`**: Mise à jour pour supporter les métadonnées
- **`LoadSection.jsx`**: Mise à jour pour supporter les métadonnées  
- **`MicrographySection.jsx`**: Mise à jour pour supporter les métadonnées

### 4. Compatibilité Rétroactive

Le système reste compatible avec :
- Les IDs simples (format legacy)
- Les tableaux d'IDs
- Les structures hiérarchiques existantes

## Exemple d'Usage

### Avant (problématique)
```javascript
// SectionPhotoManager transmettait :
onChange('curves', ['id1', 'id2', 'id3', 'id4']);

// CurvesSection recevait et organisait incorrectement :
{
  heating: ['id1', 'id2'],   // Position 0,4,8...
  cooling: ['id3'],          // Position 1,5,9...
  datapaq: ['id4'],         // Position 2,6,10...
  alarms: []                // Position 3,7,11...
}
```

### Après (solution)
```javascript
// SectionPhotoManager transmet maintenant :
onChange('curves', {
  heating: [
    { id: 'id1', subcategory: 'heating', name: 'curve1.jpg' },
    { id: 'id2', subcategory: 'heating', name: 'curve2.jpg' },
    { id: 'id3', subcategory: 'heating', name: 'curve3.jpg' }
  ],
  cooling: [
    { id: 'id4', subcategory: 'cooling', name: 'cooling1.jpg' }
  ],
  datapaq: [],
  alarms: []
});

// CurvesSection reçoit les photos correctement organisées !
```

## Avantages

1. **Précision**: Les photos sont affichées dans leur vraie catégorie
2. **Extensibilité**: Facile d'ajouter de nouvelles métadonnées
3. **Débogage**: Informations complètes sur chaque photo
4. **Performance**: Réduction des calculs dans les sections de rendu
5. **Maintenance**: Code plus clair et logique

## Test Recommandé

1. Sélectionner 3 photos "heating" et 1 photo "cooling" dans SectionPhotoManager
2. Vérifier que CurvesSection affiche bien 3 photos dans "Heating Curve" et 1 dans "Cooling Curve"
3. Vérifier les logs console pour confirmer l'organisation correcte
