# Guide de résolution des problèmes de données de courbe

## Problèmes identifiés et corrections apportées

### 1. **Problème d'import Excel**
**Symptôme** : Les données de courbe ne sont pas importées ou affichées après l'import Excel
**Cause** : La méthode alternative d'import bypasse le composant `ResultCurveSection`
**Correction** : Modification de `useExcelImport.js` pour utiliser le bon event et ajouter des délais

### 2. **Problème de sauvegarde manuelle**
**Symptôme** : Les données saisies manuellement ne sont pas sauvegardées
**Cause** : Les données locales ne sont pas "flushées" vers le formData avant soumission
**Correction** : Ajout de `flushAllCurveData()` avant la soumission

### 3. **Problème de récupération**
**Symptôme** : Les données de courbe ne sont pas restituées à la réouverture
**Cause** : Mapping incomplet lors de la récupération des données
**Correction** : Amélioration du mapping dans `useTestData.js`

### 4. **NOUVEAU - Problème de synchronisation React**
**Symptôme** : Les données sont bien dans le formData mais la courbe ne s'affiche pas
**Cause** : Le composant `ResultCurveSection` ne détecte pas les changements dans l'objet imbriqué `formData.resultsData.results[x].samples[y].curveData`
**Correction** : Passage direct des données de courbe comme prop séparée pour forcer le re-render

## Tests à effectuer

### Test 1: Import Excel
1. Créer un nouveau test
2. Aller à la section "Résultats"
3. Importer un fichier Excel
4. Vérifier que :
   - Les données ECD sont remplies
   - Les données de courbe apparaissent dans le tableau
   - Le graphique s'affiche correctement
5. Sauvegarder le test
6. Rouvrir le test
7. Vérifier que toutes les données sont présentes

### Test 2: Saisie manuelle
1. Créer un nouveau test
2. Aller à la section "Résultats"
3. Remplir manuellement les positions ECD
4. Ajouter des points de courbe manuellement
5. Vérifier que le graphique se met à jour
6. Sauvegarder le test
7. Rouvrir le test
8. Vérifier que toutes les données sont présentes

### Test 3: Combinaison Excel + Manuel
1. Créer un nouveau test
2. Importer un fichier Excel
3. Ajouter manuellement des points supplémentaires
4. Modifier quelques valeurs existantes
5. Sauvegarder
6. Rouvrir et vérifier

## Debug activé

Les corrections incluent des logs de debug détaillés qui s'affichent uniquement en mode développement :

- `=== SYNCHRONISATION CURVE DATA ===` : Chargement des données
- `=== DEBUG SAUVEGARDE CURVE DATA ===` : Mise à jour vers le parent
- `=== FORMATAGE SOUMISSION ===` : Formatage pour l'API
- `=== CHARGEMENT CURVE DATA ===` : Récupération depuis l'API

## Points clés des corrections

1. **Flush des données** : `flushAllCurveData()` force la synchronisation avant soumission
2. **Méthode d'import améliorée** : Utilise le bon chemin `resultsData.results[x].samples[y].curveData`
3. **Mapping complet** : Préserve toutes les propriétés des points de courbe
4. **Debug amélioré** : Logs détaillés pour identifier les problèmes

## Fichiers modifiés

- `useTestHandlers.js` : Ajout de `flushAllCurveData()`
- `useTestForm.js` : Ajout de la référence et passage de la fonction de flush
- `useTestSubmission.js` : Intégration du flush avant soumission + debug
- `useExcelImport.js` : Correction de la méthode alternative d'import
- `useTestData.js` : Amélioration du mapping de récupération
- `ResultCurveSection.jsx` : Debug amélioré pour la synchronisation + prop curveData directe
- `ResultsDataSection.jsx` : Passage de la prop curveData pour forcer le re-render
- `useFormHandlers.js` : Debug ajouté pour tracer les mises à jour des données de courbe
