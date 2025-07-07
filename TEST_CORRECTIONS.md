# Test des corrections - Guide rapide

## Étapes de test recommandées

### 1. **Vérifier les logs de debug**
Ouvrir la console développeur et rechercher ces messages lors de l'import Excel :

```
=== DEBUG FORM HANDLERS - CURVE DATA UPDATE ===
=== SYNCHRONISATION CURVE DATA ===
=== EFFECT UPDATE DATA POINTS ===
```

### 2. **Test d'import Excel rapide**
1. Créer un nouveau test
2. Aller à "Résultats" > Premier échantillon > "Données de courbe"
3. Importer le fichier Excel
4. **Nouveau** : Vérifier dans les logs que "Source utilisée: curveData prop" apparaît
5. Vérifier que le tableau se remplit
6. Vérifier que le graphique s'affiche

### 3. **Test de persistance**
Après l'import Excel :
1. Sauvegarder le test
2. Rouvrir le test
3. Vérifier que les données sont toujours là

## Logs de debug à surveiller

### Import Excel réussi
```
=== IMPORT EXCEL - MÉTHODE ALTERNATIVE ===
Change event: {target: {…}}
Points à importer: X
=== DEBUG FORM HANDLERS - CURVE DATA UPDATE ===
Field name: resultsData.results[0].samples[0].curveData
Number of points: X
```

### Synchronisation réussie
```
=== SYNCHRONISATION CURVE DATA ===
Source utilisée: curveData prop
Points bruts chargés: X
=== EFFECT UPDATE DATA POINTS ===
Updated dataPoints length: X
```

### Problèmes potentiels
- Si vous voyez "Source utilisée: result prop" → Problème avec la prop curveData
- Si vous voyez "AUCUNE DONNÉE DE COURBE" → Les données ne passent pas
- Si les logs s'arrêtent à "Points à importer" → Problème avec handleChange

## Solutions d'urgence

Si le problème persiste :
1. Vérifier que `ResultsDataSection.jsx` passe bien la prop `curveData`
2. Vérifier que `ResultCurveSection.jsx` utilise la prop `curveData` en priorité
3. S'assurer que `formData.resultsData.results[x].samples[y].curveData` existe
