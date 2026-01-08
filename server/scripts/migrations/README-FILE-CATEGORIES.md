# Configuration des catégories de fichiers

## 📋 Prérequis pour l'import de fichiers

Pour que le système d'import de fichiers fonctionne correctement, notamment pour **DATAPAQ**, vous devez avoir les catégories nécessaires dans la base de données.

## 🚀 Installation rapide

### Option 1 : Exécuter le script SQL (Recommandé)

```bash
# Depuis le dossier server
mysql -u root -p synergia < scripts/migrations/add-file-categories.sql
```

Ou via votre client MySQL/phpMyAdmin :
```sql
SOURCE /path/to/server/scripts/migrations/add-file-categories.sql;
```

### Option 2 : Insertion manuelle

Si vous préférez insérer manuellement, voici les catégories **obligatoires** :

```sql
INSERT INTO ref_file_category (name) VALUES
  ('datapaq'),          -- ⭐ NOUVEAU - Pour la section DATAPAQ
  ('furnace_report'),   -- Pour les rapports du four
  ('micrographs'),      -- Pour les micrographies
  ('control-location'), -- Pour les zones de contrôle
  ('general');          -- Catégorie par défaut
```

## 📊 Liste complète des catégories

| Catégorie | Description | Utilisé par |
|-----------|-------------|-------------|
| `datapaq` | Fichiers DATAPAQ | Section DATAPAQ (After tab) |
| `furnace_report` | Rapports du four | Section Furnace Report |
| `micrographs` | Micrographies | Sous-section Micrographies (Results) |
| `micrography` | Normalisation | Backend (conversion automatique) |
| `control-location` | Zones de contrôle | Sous-section Control Location (Results) |
| `part_documents` | Documents de pièce | Section Part Documents |
| `trial_documents` | Documents d'essai | Section Trial Documents |
| `general` | Catégorie par défaut | Fallback système |

## 🔍 Vérification

Pour vérifier que les catégories sont bien installées :

```sql
SELECT * FROM ref_file_category ORDER BY name;
```

Vous devriez voir au minimum :
- ✅ datapaq
- ✅ furnace_report
- ✅ micrographs
- ✅ control-location
- ✅ general

## ⚠️ Important pour DATAPAQ

La catégorie `datapaq` est **obligatoire** depuis la version qui sépare DATAPAQ de Furnace Report.

Sans cette catégorie :
- ❌ Les fichiers DATAPAQ ne pourront pas être importés
- ❌ Une erreur de contrainte FK peut se produire
- ❌ L'application peut ne pas fonctionner correctement

## 📝 Sous-catégories (Optionnel)

Les sous-catégories n'ont **pas** de contrainte de clé étrangère et sont créées dynamiquement par l'application.

Néanmoins, si vous voulez les pré-remplir :
```bash
mysql -u root -p synergia < scripts/migrations/add-file-subcategories.sql
```

## 🔧 Dépannage

### Erreur : "Cannot add or update a child row: a foreign key constraint fails"

Cela signifie que la catégorie n'existe pas dans `ref_file_category`.

**Solution** : Exécutez le script `add-file-categories.sql`

### Les fichiers DATAPAQ ne s'affichent pas

1. Vérifiez que la catégorie existe :
   ```sql
   SELECT * FROM ref_file_category WHERE name = 'datapaq';
   ```

2. Vérifiez que les fichiers utilisent la bonne catégorie :
   ```sql
   SELECT node_id, original_name, category, subcategory
   FROM files
   WHERE category = 'datapaq';
   ```

### Migration depuis l'ancien système

Si vous aviez DATAPAQ dans `furnace_report` avec subcategory `datapaq` :

```sql
-- Mise à jour des anciens fichiers DATAPAQ
UPDATE files
SET category = 'datapaq', subcategory = NULL
WHERE category = 'furnace_report' AND subcategory = 'datapaq';
```

## 📞 Support

Pour plus d'informations, consultez la documentation du modèle File :
- `server/models/file.js`
- `server/models/ref-file-category.js`
