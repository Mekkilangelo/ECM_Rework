# 🔍 Analyse : Contrainte FK subcategory créée par Sequelize

## 🐛 Le Problème

Une contrainte FK non désirée a été créée sur `files.subcategory` → `ref_file_subcategory.name`, empêchant l'upload de fichiers avec des sous-catégories dynamiques.

```sql
CONSTRAINT `files_ibfk_24` FOREIGN KEY (`subcategory`)
REFERENCES `ref_file_subcategory` (`name`)
```

## 🔎 Cause Racine

Le modèle `server/models/ref-file-subcategory.js` contenait une association `hasMany` :

```javascript
// ❌ AVANT (causait le problème)
RefFileSubcategory.associate = function(models) {
  RefFileSubcategory.hasMany(models.file, {
    foreignKey: 'subcategory',  // ← Crée la FK !
    sourceKey: 'name',
    as: 'files'
  });
};
```

Quand Sequelize synchronise avec `DB_SYNC_ALTER=true`, il **crée automatiquement** cette contrainte FK.

## ✅ Solution Appliquée

### 1. Suppression de l'association dans le modèle

**Fichier modifié** : `server/models/ref-file-subcategory.js`

```javascript
// ✅ APRÈS (corrigé)
RefFileSubcategory.associate = function(models) {
  // ⚠️ PAS d'association avec files.subcategory
  // Les subcategories sont dynamiques (ex: result-0-sample-0-x1000)
  // et ne doivent PAS avoir de contrainte FK
  // Garder cette table uniquement pour référence documentaire
};
```

### 2. Documentation ajoutée dans le modèle file.js

**Fichier modifié** : `server/models/file.js`

```javascript
// Relations avec les tables de référence
File.belongsTo(models.ref_file_category, {
  foreignKey: 'category',
  targetKey: 'name',
  as: 'categoryRef'
});

// ⚠️ PAS de relation belongsTo vers ref_file_subcategory
// Les subcategories sont dynamiques (ex: result-0-sample-0-x1000)
// et ne doivent PAS avoir de contrainte FK
```

### 3. Script de migration pour supprimer la FK existante

**Fichier créé** : `server/scripts/migrations/fix-subcategory-fk.sql`

```sql
ALTER TABLE files DROP FOREIGN KEY files_ibfk_24;
```

## 🎯 Pourquoi cette approche ?

### Catégories (category) : Valeurs FIXES ✅ FK OK

```
'micrographs'
'control-location'
'datapaq'
'furnace_report'
'general'
```

→ Nombre limité, prédéfini
→ **FK vers `ref_file_category` est OK** ✅

### Sous-catégories (subcategory) : Valeurs DYNAMIQUES ❌ PAS de FK

```
'result-0-sample-0-x50'
'result-0-sample-0-x500'
'result-0-sample-0-x1000'
'result-0-sample-1-x50'
'result-1-sample-0-x1000'
'result-1-sample-1-x500'
...
```

→ Nombre **illimité** (N résultats × M samples × 4 zooms)
→ **Généré dynamiquement** par l'application
→ **PAS de FK** ❌ (champ texte libre)

## 🚀 Impact sur les Déploiements Futurs

### Avant ce fix

```bash
# DB_SYNC_ALTER=true dans .env
docker compose up

# Sequelize crée automatiquement la FK
# → Les uploads de micrographies échouent ❌
```

### Après ce fix

```bash
# DB_SYNC_ALTER=true dans .env
docker compose up

# Sequelize synchronise SANS créer la FK
# → Les uploads fonctionnent ✅
```

## 📋 Checklist pour Nouveaux Environnements

Si vous configurez un nouvel environnement :

1. ✅ Utilisez les modèles corrigés (commit `2978fa0` ou plus récent)
2. ✅ Exécutez la migration `fix-subcategory-fk.sql` si la base existe déjà
3. ✅ Vérifiez qu'il n'y a pas de FK sur subcategory :

```sql
SELECT CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA='synergia'
  AND TABLE_NAME='files'
  AND COLUMN_NAME='subcategory'
  AND REFERENCED_TABLE_NAME='ref_file_subcategory';
```

Si cette requête retourne des lignes, exécutez :

```sql
ALTER TABLE files DROP FOREIGN KEY <nom_de_la_contrainte>;
```

## 🔧 Vérification sur Environnement Existant

### Production / Dev / Test

```bash
# 1. Vérifier si la FK existe
docker exec customia-database-1 mysql -uroot -proot synergia -e \
  "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA='synergia' AND TABLE_NAME='files'
   AND COLUMN_NAME='subcategory' AND REFERENCED_TABLE_NAME='ref_file_subcategory';"

# Si la commande retourne quelque chose (ex: files_ibfk_24)
# → Supprimer la FK

# 2. Supprimer la FK si elle existe
docker exec customia-database-1 mysql -uroot -proot synergia -e \
  "ALTER TABLE files DROP FOREIGN KEY files_ibfk_24;"

# 3. Pull les derniers changements
git pull origin dev

# 4. Rebuild et redémarrer
docker compose build backend
docker compose restart backend
```

## ⚠️ Important : DB_SYNC_ALTER en Production

En production, il est recommandé d'utiliser :

```env
DB_SYNC_ALTER=false
```

Et d'exécuter les migrations manuellement via des scripts SQL contrôlés.

Mais même avec `DB_SYNC_ALTER=true`, cette FK ne sera plus recréée grâce au fix.

## 📝 Commits Liés

1. **`2de93bb`** - fix: add migration to remove FK constraint
2. **`2978fa0`** - fix: remove Sequelize association that creates FK

## 🎓 Leçon Apprise

Quand on utilise Sequelize avec des **valeurs dynamiques** dans une colonne :
- ❌ Ne PAS créer de table de référence avec FK
- ✅ Utiliser un simple champ `STRING` sans association
- ✅ Valider les valeurs au niveau applicatif si nécessaire
- ✅ Documenter clairement dans le modèle

Les associations Sequelize `hasMany` / `belongsTo` créent automatiquement des FK lors du `sync()` ou `alter()`.
