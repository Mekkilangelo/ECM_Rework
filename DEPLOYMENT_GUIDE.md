# 🚀 Guide de Déploiement - Nouveau Système de Gestion de Fichiers

## 📋 Vue d'ensemble

Ce guide décrit les étapes pour déployer le nouveau système de gestion de fichiers basé sur **storage_key** et **contexte JSON**.

### ✨ Nouveautés principales

- **Storage Key immuable** : Plus de problèmes avec les renommages
- **Contexte JSON flexible** : Métadonnées riches et extensibles
- **Services découplés** : Architecture Clean
- **Migration progressive** : Coexistence avec ancien système

---

## ⚠️ AVANT DE COMMENCER

### Prérequis

- [ ] Backup complet de la base de données
- [ ] Backup des fichiers physiques (dossier `uploads/`)
- [ ] Accès administrateur MySQL
- [ ] Node.js 14+ installé
- [ ] Au moins 2x l'espace disque actuel disponible (pour la migration)

### Vérifications

```bash
# Vérifier l'espace disque
df -h

# Vérifier la version de Node
node --version

# Vérifier la connexion MySQL
mysql -u root -p -e "SELECT VERSION();"
```

---

## 📅 PLAN DE DÉPLOIEMENT (4 SEMAINES)

### **Semaine 1 : Préparation et migration BDD**

#### Jour 1-2 : Backup et migration SQL

```bash
# 1. Backup de la BDD
mysqldump -u root -p ecm_monitoring > backup_$(date +%Y%m%d).sql

# 2. Backup des fichiers
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# 3. Exécuter la migration SQL
mysql -u root -p ecm_monitoring < migration-001-add-storage-key-and-context.sql
```

#### Jour 3-5 : Test de la migration SQL

```bash
# Vérifier les nouvelles colonnes
mysql -u root -p ecm_monitoring -e "SHOW COLUMNS FROM files;"

# Vérifier les nouvelles tables
mysql -u root -p ecm_monitoring -e "SELECT * FROM ref_file_types;"
mysql -u root -p ecm_monitoring -e "SHOW TABLES LIKE 'file_metadata';"

# Tester la vue de compatibilité
mysql -u root -p ecm_monitoring -e "SELECT * FROM v_files_legacy LIMIT 5;"
```

### **Semaine 2 : Migration des données**

#### Jour 1 : Test en mode DRY-RUN

```bash
cd server

# Installation des dépendances si nécessaire
npm install

# Lancer le script de migration en mode test
node scripts/migrate-files-to-storage-key.js --dry-run

# Vérifier les logs
tail -f logs/migration.log
```

#### Jour 2-3 : Migration réelle par lots

```bash
# Migration progressive (par lots de 100)
node scripts/migrate-files-to-storage-key.js --batch-size=100

# Ou migration complète
node scripts/migrate-files-to-storage-key.js
```

**Attendez-vous à :**
- Durée : ~1-5 minutes pour 1000 fichiers
- Le script affiche la progression en temps réel
- Un rapport détaillé est généré à la fin

#### Jour 4 : Vérification post-migration

```bash
# Vérifier le nombre de fichiers migrés
mysql -u root -p ecm_monitoring -e "
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN storage_key IS NOT NULL THEN 1 ELSE 0 END) as migres,
    SUM(CASE WHEN storage_key IS NULL THEN 1 ELSE 0 END) as restants
  FROM files;
"

# Vérifier quelques storage_keys au hasard
mysql -u root -p ecm_monitoring -e "
  SELECT node_id, original_name, storage_key, context->>'$.entity_type' as entity_type
  FROM files 
  WHERE storage_key IS NOT NULL 
  LIMIT 10;
"

# Vérifier l'existence physique des fichiers
node scripts/verify-files-integrity.js
```

#### Jour 5 : Tests fonctionnels

1. **Upload de nouveaux fichiers**
   - Aller sur l'interface web
   - Upload des fichiers dans différents contextes (trial, part, etc.)
   - Vérifier que storage_key est généré
   - Vérifier que context est rempli

2. **Téléchargement de fichiers migrés**
   - Ouvrir un rapport PDF existant
   - Vérifier que les images s'affichent
   - Télécharger quelques fichiers

3. **Suppression de fichiers**
   - Supprimer un fichier via l'interface
   - Vérifier qu'il est supprimé physiquement
   - Vérifier que les dossiers vides sont nettoyés

### **Semaine 3 : Intégration et tests**

#### Jour 1-2 : Mise à jour du code frontend

Le frontend continue d'utiliser les mêmes endpoints API. Aucune modification nécessaire pour l'instant.

Tests à effectuer :
- Upload de fichiers depuis tous les formulaires
- Affichage des fichiers dans les rapports
- Suppression de fichiers
- Recherche de fichiers

#### Jour 3-4 : Tests de charge

```bash
# Test d'upload massif
node scripts/test-upload-performance.js --files=100

# Test de récupération
node scripts/test-retrieve-performance.js --queries=1000
```

#### Jour 5 : Formation équipe

- Présentation du nouveau système
- Explication des concepts (storage_key, context)
- Démonstration des nouveaux services
- Q&A

### **Semaine 4 : Nettoyage et optimisation**

#### Jour 1-2 : Nettoyage du code legacy

Une fois tout validé, retirer progressivement l'ancien code :

```javascript
// Dans fileService.js - Marquer comme deprecated
/**
 * @deprecated Use FileServiceV2.uploadFiles instead
 */
const saveUploadedFiles = async (files, data, req = null) => {
  logger.warn('Using deprecated saveUploadedFiles - migrate to FileServiceV2');
  // ... ancien code
};
```

#### Jour 3 : Optimisation BDD

```sql
-- Analyser les requêtes lentes
EXPLAIN SELECT * FROM files 
WHERE JSON_EXTRACT(context, '$.entity_type') = 'trial';

-- Optimiser les index si nécessaire
ALTER TABLE files 
ADD INDEX idx_context_combo (
  (CAST(context->>'$.entity_type' AS CHAR(50))),
  (CAST(context->>'$.entity_id' AS UNSIGNED)),
  (CAST(context->>'$.file_type' AS CHAR(50)))
);
```

#### Jour 4-5 : Documentation finale

- Mettre à jour la documentation développeur
- Créer des guides utilisateur si nécessaire
- Documenter les nouveaux endpoints API

---

## 🔧 COMMANDES UTILES

### Vérifier l'état de la migration

```sql
-- Statistiques globales
SELECT 
  COUNT(*) as total_files,
  SUM(CASE WHEN storage_key IS NOT NULL THEN 1 ELSE 0 END) as migrated,
  SUM(CASE WHEN storage_key IS NULL THEN 1 ELSE 0 END) as pending,
  ROUND(SUM(CASE WHEN storage_key IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as percent_migrated
FROM files;

-- Fichiers par type d'entité
SELECT 
  context->>'$.entity_type' as entity_type,
  COUNT(*) as count
FROM files
WHERE storage_key IS NOT NULL
GROUP BY context->>'$.entity_type';

-- Top 10 des entités avec le plus de fichiers
SELECT 
  context->>'$.entity_type' as entity_type,
  context->>'$.entity_id' as entity_id,
  COUNT(*) as file_count,
  ROUND(SUM(size) / 1024 / 1024, 2) as total_mb
FROM files
WHERE storage_key IS NOT NULL
GROUP BY entity_type, entity_id
ORDER BY file_count DESC
LIMIT 10;
```

### Calculer l'espace disque utilisé

```bash
# Par type d'entité
du -sh uploads/trial
du -sh uploads/part
du -sh uploads/client

# Total
du -sh uploads/
```

### Nettoyer les anciens fichiers temporaires

```bash
# Fichiers temp > 7 jours
find uploads/temp -type f -mtime +7 -delete

# Dossiers temp vides
find uploads/temp -type d -empty -delete
```

---

## 🐛 TROUBLESHOOTING

### Problème : Fichiers physiques manquants après migration

```bash
# Vérifier les fichiers manquants
node scripts/find-missing-files.js

# Restaurer depuis le backup
tar -xzf uploads_backup_YYYYMMDD.tar.gz -C /path/to/restore/
```

### Problème : Erreurs de migration pour certains fichiers

```bash
# Voir les fichiers en erreur
mysql -u root -p ecm_monitoring -e "
  SELECT node_id, original_name, file_path 
  FROM files 
  WHERE storage_key IS NULL 
  LIMIT 20;
"

# Ré-essayer la migration pour un fichier spécifique
node scripts/migrate-single-file.js --file-id=123
```

### Problème : Context JSON invalide

```sql
-- Trouver les contexts invalides
SELECT node_id, original_name, context 
FROM files 
WHERE storage_key IS NOT NULL 
  AND JSON_VALID(context) = 0;

-- Corriger manuellement
UPDATE files 
SET context = JSON_OBJECT(
  'entity_type', 'trial',
  'entity_id', 123,
  'file_type', 'general'
)
WHERE node_id = 456;
```

### Problème : Images ne s'affichent pas dans les rapports

```bash
# Vérifier les viewPath
mysql -u root -p ecm_monitoring -e "
  SELECT 
    node_id, 
    original_name, 
    storage_key,
    CONCAT('/api/files/', node_id) as viewPath
  FROM files 
  WHERE mime_type LIKE 'image/%' 
  LIMIT 5;
"

# Tester manuellement un endpoint
curl http://localhost:5001/api/files/123
```

---

## ✅ CHECKLIST DE VALIDATION

### Avant la migration

- [ ] Backup BDD créé et vérifié
- [ ] Backup fichiers créé et vérifié
- [ ] Migration SQL exécutée sans erreur
- [ ] Nouvelles tables créées (file_metadata, ref_file_types)
- [ ] Vue de compatibilité v_files_legacy fonctionne

### Pendant la migration

- [ ] Script de migration testé en dry-run
- [ ] Migration réelle lancée avec succès
- [ ] Rapport de migration vérifié (0 erreurs idéalement)
- [ ] Vérification d'intégrité réussie

### Après la migration

- [ ] Upload de nouveaux fichiers fonctionne
- [ ] Téléchargement de fichiers migrés fonctionne
- [ ] Images dans les rapports PDF s'affichent
- [ ] Suppression de fichiers fonctionne
- [ ] Aucune régression détectée
- [ ] Performance acceptable (pas de ralentissement)

### Nettoyage final

- [ ] Ancien code legacy marqué deprecated
- [ ] Documentation mise à jour
- [ ] Équipe formée
- [ ] Backup final créé avant suppression ancien code

---

## 📞 SUPPORT

En cas de problème :

1. **Vérifier les logs** : `logs/application.log`, `logs/migration.log`
2. **Consulter ce guide** : Section Troubleshooting
3. **Rollback si nécessaire** : Voir section ci-dessous

---

## 🔄 PROCÉDURE DE ROLLBACK

Si vous devez annuler la migration :

```bash
# 1. Arrêter l'application
pm2 stop ecm-server

# 2. Restaurer la BDD
mysql -u root -p ecm_monitoring < backup_YYYYMMDD.sql

# 3. Restaurer les fichiers
rm -rf uploads/
tar -xzf uploads_backup_YYYYMMDD.tar.gz

# 4. Redémarrer l'application
pm2 start ecm-server
```

**⚠️ Attention** : Vous perdrez tous les fichiers uploadés depuis le début de la migration !

---

## 🎉 CONCLUSION

Une fois la migration terminée et validée :

✅ Système de fichiers robuste et évolutif  
✅ Plus de problèmes de paths avec les renommages  
✅ Métadonnées riches et flexibles  
✅ Prêt pour migration cloud future  

**Félicitations ! 🚀**
