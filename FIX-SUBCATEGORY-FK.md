# 🔧 Fix: Contrainte FK sur subcategory

## ❌ Problème

```
Cannot add or update a child row: a foreign key constraint fails
(`synergia`.`files`, CONSTRAINT `files_ibfk_24` FOREIGN KEY
(`subcategory`) REFERENCES `ref_file_subcategory` (`name`))
```

**Cause** : Les micrographies utilisent des sous-catégories **dynamiques** comme `result-0-sample-0-x1000`, mais MySQL a une contrainte FK qui force toutes les valeurs à exister dans `ref_file_subcategory`.

## ✅ Solution

La colonne `subcategory` **ne devrait pas avoir de contrainte FK** car elle contient des valeurs dynamiques.

### Étape 1 : Vérifier la contrainte

```sql
SELECT
    CONSTRAINT_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'synergia'
    AND TABLE_NAME = 'files'
    AND COLUMN_NAME = 'subcategory'
    AND REFERENCED_TABLE_NAME = 'ref_file_subcategory';
```

Résultat probable : `files_ibfk_24` (ou un autre numéro)

### Étape 2 : Supprimer la contrainte

```sql
-- Remplacez files_ibfk_24 par le nom trouvé à l'étape 1 si différent
ALTER TABLE files DROP FOREIGN KEY files_ibfk_24;
```

### Étape 3 : Vérifier que c'est corrigé

```sql
-- Cette requête doit retourner 0 lignes
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'synergia'
    AND TABLE_NAME = 'files'
    AND COLUMN_NAME = 'subcategory';
```

## 🚀 Commandes Rapides (Sur le serveur)

```bash
# Méthode 1 : Via script SQL
docker exec -i customia-database-1 mysql -uroot -proot synergia < server/scripts/migrations/fix-subcategory-fk.sql

# Méthode 2 : En ligne de commande
docker exec -it customia-database-1 mysql -uroot -proot synergia -e "ALTER TABLE files DROP FOREIGN KEY files_ibfk_24;"

# Vérifier
docker exec -it customia-database-1 mysql -uroot -proot synergia -e "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='synergia' AND TABLE_NAME='files' AND COLUMN_NAME='subcategory' AND REFERENCED_TABLE_NAME='ref_file_subcategory';"
```

Si la dernière commande ne retourne rien, c'est bon !

## 📋 Explication Technique

### Pourquoi `category` a une FK mais pas `subcategory` ?

- **`category`** : Valeurs fixes et prédéfinies
  ```
  'micrographs', 'control-location', 'datapaq', 'general', etc.
  ```
  → FK vers `ref_file_category` ✅

- **`subcategory`** : Valeurs dynamiques générées à la volée
  ```
  'result-0-sample-0-x50'
  'result-0-sample-0-x500'
  'result-0-sample-0-x1000'
  'result-0-sample-1-x50'
  'result-1-sample-0-x1000'
  ... (des milliers de combinaisons possibles)
  ```
  → **PAS de FK** ✅ (champ texte libre)

### D'où vient cette FK ?

Cette contrainte a probablement été créée :
1. Par une ancienne migration SQL
2. Par Sequelize avec `alter: true`
3. Manuellement

Dans le modèle `server/models/file.js`, la colonne `subcategory` est définie **sans** FK :

```javascript
subcategory: {
  type: DataTypes.STRING(100),
  allowNull: true,
  comment: 'Sous-catégorie spécifique'
},
```

Donc supprimer cette FK est la bonne solution.

## 🧪 Test après correction

Après avoir supprimé la FK, testez un upload :

1. Allez dans un Trial/Test
2. Section "Results" → "Micrographies"
3. Uploadez une image dans n'importe quel zoom (x50, x500, x1000)
4. ✅ L'upload devrait fonctionner

## 🔄 Si le problème persiste

Si après avoir supprimé la FK, vous avez encore des erreurs :

### Vérifier toutes les FK sur la table files
```sql
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'synergia'
    AND TABLE_NAME = 'files';
```

### Vérifier la définition de la table
```sql
SHOW CREATE TABLE files;
```

## ⚠️ Important

**Ne supprimez PAS** la FK sur `category` - seulement celle sur `subcategory`.

La colonne `category` doit conserver sa FK vers `ref_file_category` car les catégories sont fixes.

## 📝 Pour les prochains déploiements

Ce fix devrait être appliqué sur tous les environnements :
- ✅ Production
- ✅ Développement
- ✅ Test (si applicable)

Ajoutez cette migration à votre procédure de déploiement si nécessaire.
