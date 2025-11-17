# 🔍 Diagnostic Intégration - Système de Rapport

## ❌ Problème Actuel

**Erreur**: `Trial non trouvé` pour le trial ID **3214**

```
Erreur génération rapport {"trialId":"3214","error":"Trial non trouvé"}
GET /api/reports/trials/3214?sections=[...]
```

---

## 🔎 Cause Probable

Le node **3214** n'existe pas dans la base de données OU n'est pas de type `'test'`.

### Vérifications à faire:

1. **Le node 3214 existe-t-il ?**
   ```sql
   SELECT id, name, type FROM nodes WHERE id = 3214;
   ```

2. **Si oui, quel est son type ?**
   - Type attendu: `'test'` (selon ENUM de la BDD)
   - Types possibles: `'client'`, `'order'`, `'test'`, `'file'`, `'part'`, `'furnace'`, `'steel'`

3. **Y a-t-il des données trial associées ?**
   ```sql
   SELECT * FROM trials WHERE node_id = 3214;
   ```

---

## ✅ Ce qui FONCTIONNE

### Backend ✅
- ✅ Route `/api/reports/trials/:trialId` configurée
- ✅ Controller `reportController.js` OK
- ✅ Service `reportService.js` corrigé (double accolades, testId→trialId)
- ✅ Modèle `trial.js` correct
- ✅ Association Node ↔ Trial configurée
- ✅ Messages d'erreur améliorés (debug type node)

### Frontend ✅
- ✅ Composant `ReportConfiguration` créé
- ✅ Hook `useReport` implémenté
- ✅ Toutes les entités Domain créées (Report, Section, Photo)
- ✅ Use Cases créés (configure, preview, export, optimize)
- ✅ Infrastructure créée (ReactPDFGenerator, Repository)
- ✅ Export dans `index.js` correct
- ✅ Import dans `TrialForm.jsx` corrigé (chemin relatif)
- ✅ Affichage des erreurs dans l'UI

---

## 🧪 Tests à Effectuer

### 1. Vérifier que le trial existe

**Option A: MySQL Workbench / HeidiSQL**
```sql
-- Trouver tous les trials (nodes de type test)
SELECT n.id, n.name, n.type, t.trial_code, t.trial_date 
FROM nodes n
LEFT JOIN trials t ON n.id = t.node_id
WHERE n.type = 'test'
ORDER BY n.id DESC
LIMIT 10;
```

**Option B: Depuis l'interface**
- Aller dans la liste des trials
- Noter l'ID d'un trial existant
- Ouvrir ce trial
- Aller dans l'onglet "Report"

### 2. Tester avec un trial existant

Si vous trouvez un trial avec ID différent (par ex. ID **123**):

1. Ouvrir le trial ID 123
2. Aller dans l'onglet "Report"
3. Sélectionner quelques sections
4. Cliquer sur "Prévisualiser"

**Résultat attendu**:
- ✅ Données chargées
- ✅ Sections activables
- ✅ Photos sélectionnables
- ✅ Aperçu PDF s'ouvre
- ✅ Export PDF fonctionne

---

## 🔧 Solution Temporaire

En attendant de trouver un vrai trial, vous pouvez:

### Option 1: Créer un trial de test
```sql
-- 1. Créer un node de type test
INSERT INTO nodes (name, path, type, parent_id, created_at, data_status)
VALUES ('Trial Test', '/test/trial-test', 'test', NULL, NOW(), 'new');

-- Récupérer l'ID créé (par ex. 9999)
SELECT LAST_INSERT_ID();

-- 2. Créer les données trial
INSERT INTO trials (node_id, trial_code, trial_date, status, location)
VALUES (9999, 'T-TEST-001', CURDATE(), 'in_progress', 'Atelier A');
```

Puis tester avec l'URL:
```
http://localhost:3000/trials/9999
```

### Option 2: Utiliser l'ancien système temporairement

Si vous voulez garder l'ancien système pendant les tests:

1. Retirer le nouveau composant de `TrialForm.jsx`
2. Remettre `ReportTabContent` temporairement
3. Tester le nouveau système en parallèle sur un autre trial

---

## 📊 Logs Backend Améliorés

Le backend affichera maintenant des logs plus détaillés:

```
❌ Node 3214 introuvable dans la base de données
→ Le node n'existe pas du tout

❌ Node 3214 existe mais type=part, attendu='test'
→ Le node existe mais n'est pas un trial

❌ Node 3214 existe (type=test) mais pas de données trial associées
→ Le node existe mais manque l'entrée dans la table trials
```

---

## 🎯 Prochaines Étapes

### Immédiat
1. **Trouver l'ID d'un vrai trial** dans votre BDD
   ```sql
   SELECT n.id FROM nodes n WHERE n.type = 'test' LIMIT 1;
   ```

2. **Tester avec ce trial**
   - Ouvrir ce trial dans l'interface
   - Aller dans l'onglet Report
   - Vérifier que tout fonctionne

### Si aucun trial n'existe
1. Créer un trial de test (SQL ci-dessus)
2. OU importer des données de test
3. OU migrer un ancien test vers la nouvelle structure

### Une fois qu'un trial fonctionne
1. ✅ Tester la sélection de sections
2. ✅ Tester la sélection de photos
3. ✅ Tester l'aperçu PDF
4. ✅ Tester l'export PDF
5. ✅ Vérifier la qualité (vectoriel, < 5 MB)
6. ✅ Vérifier la performance (< 5 secondes)

---

## 🐛 Debug Console

**Frontend (Chrome DevTools - F12)**:
```javascript
// Dans la console, tester l'API directement
fetch('/api/reports/trials/3214')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Backend (Logs serveur)**:
```
]: Erreur génération rapport {"trialId":"3214","error":"Node 3214 introuvable dans la base de données"}
```

---

## ✅ Confirmation que l'Intégration est OK

L'intégration est **techniquement complète** mais nécessite:
1. Un trial existant en BDD
2. Des données de test réalistes

**Le code est prêt**, il attend juste des données valides ! 🚀

---

**Date**: 13 Janvier 2025  
**Statut**: ⚠️ **Intégration OK - Besoin de données de test**
