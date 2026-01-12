# 🔍 Diagnostic des problèmes d'upload de fichiers

## Problème rapporté

Les fichiers uploadés dans la section DataPaq sont "physiquement introuvables" après avoir quitté et rouvert le modal.

## Flux d'upload - Analyse

### Séquence normale

```
1. Client: DatapaqSection
   → category='datapaq', nodeId=trial.id
   
2. FileUploader → POST /api/files/upload
   
3. Middleware parseAndResolvePath
   → Fichier stocké en mémoire
   → Écrit dans: UPLOAD_BASE_DIR/temp_uploads/{uuid}/{filename}
   
4. fileService.saveUploadedFiles
   → Génère storage_key: trial/{trialId}/datapaq/{uuid}-{filename}
   → Déplace le fichier de temp vers destination finale
   → Crée les entrées en BDD (nodes + files)
   
5. Récupération: GET /api/files/node/{trialId}?category=datapaq
   → Retourne les fichiers avec viewPath=/api/files/{fileId}
   
6. Affichage: GET /api/files/{fileId}
   → Résout le chemin via storage_key ou file_path
   → ⚠️ ERREUR si fichier introuvable
```

## Causes potentielles identifiées

### 1. Problème de volume Docker en dev

Le bind mount `./server:/app` peut écraser le volume nommé `uploads_data_dev:/app/uploads`.

**Solution appliquée :** Ajout de `/app/uploads` dans les exclusions du bind mount dans `docker-compose.dev.yml`.

### 2. Incohérence UPLOAD_BASE_DIR

Si la variable d'environnement `UPLOAD_PATH` n'est pas définie de la même manière entre sessions Docker, les chemins peuvent diverger.

**Vérification :**
```bash
# Dans le conteneur Docker
docker exec -it synergia-backend-1 sh -c "echo \$UPLOAD_PATH && ls -la /app/uploads"
```

### 3. Fichiers temporaires non déplacés

Les fichiers peuvent rester dans `temp_uploads/` si la transaction échoue après le déplacement physique.

## Script de diagnostic

Un script de diagnostic a été créé : `server/scripts/diagnose-file-uploads.js`

### Utilisation

```bash
# Dans le dossier server/
node scripts/diagnose-file-uploads.js

# Filtrer par catégorie
node scripts/diagnose-file-uploads.js --category=datapaq

# Filtrer par trial
node scripts/diagnose-file-uploads.js --nodeId=123

# Tenter de corriger les chemins
node scripts/diagnose-file-uploads.js --category=datapaq --fix
```

### Ce que le script vérifie

1. **Configuration des chemins** - UPLOAD_BASE_DIR calculé
2. **Fichiers en BDD** - Liste des fichiers avec leur storage_key et file_path
3. **Existence physique** - Vérifie si chaque fichier existe sur le disque
4. **Fichiers orphelins** - Vérifie le dossier temp_uploads

## Corrections appliquées

### 1. docker-compose.dev.yml

Ajout de `/app/uploads` dans les volumes exclus pour éviter l'écrasement par le bind mount.

### 2. FileMetadataService.js

Ajout explicite de `'datapaq': 'datapaq'` dans le mapping des types de fichiers.

### 3. fileService.js

Amélioration du logging dans `getFileById` et `downloadFile` pour faciliter le diagnostic :
- Log détaillé quand le fichier n'est pas trouvé via storage_key
- Log détaillé quand le fichier n'est pas trouvé via file_path
- Affichage du UPLOAD_BASE_DIR dans les logs d'erreur

## Procédure de résolution

### Étape 1 : Exécuter le diagnostic

```bash
cd server
node scripts/diagnose-file-uploads.js --category=datapaq
```

### Étape 2 : Vérifier les logs

Regarder dans `server/logs/` les fichiers récents pour voir les messages d'erreur détaillés.

### Étape 3 : Vérifier la structure des dossiers

```bash
# En local
ls -la server/uploads/trial/

# En Docker
docker exec -it synergia-backend-1 ls -la /app/uploads/trial/
```

### Étape 4 : Redémarrer les conteneurs si nécessaire

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d
```

## Points de vigilance

1. **Ne jamais supprimer le volume `uploads_data_dev`** sans backup
2. **Vérifier que le volume est bien monté** après chaque redémarrage
3. **Les fichiers temporaires sont nettoyés après 24h** par le cleanup automatique

## Nginx

Le problème n'est **pas lié à Nginx** car :
- Nginx fait uniquement du reverse proxy vers le backend
- Les fichiers sont servis via l'API (`/api/files/{id}`) et non via un chemin statique
- Le backend résout les chemins physiques en interne
