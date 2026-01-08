# Gestion du Stockage des Fichiers Uploads

## 🔧 Problème Résolu

### Symptômes
- ✅ Les uploads fonctionnent depuis le serveur client
- ❌ Les uploads ne fonctionnent pas depuis d'autres utilisateurs/machines
- ❌ Les fichiers disparaissent après un redémarrage du conteneur

### Cause
Les fichiers étaient stockés dans le conteneur Docker sans volume persistant, ou avec un volume bind mount relatif (`./server/uploads`) qui pose des problèmes de permissions.

### Solution
Utilisation de **volumes Docker nommés** pour garantir:
1. ✅ Persistance des données entre les redémarrages
2. ✅ Permissions correctes (uid:gid 1000:1000 = node:node)
3. ✅ Isolation des données
4. ✅ Accessibilité depuis tous les clients

## 📦 Architecture

```
Docker Host
├── Volume: uploads_data (prod) ou uploads_data_dev (dev)
│   └── Mappé vers: /app/uploads dans le conteneur backend
└── Conteneur Backend
    ├── User: node (uid 1000)
    └── Permissions: 755 sur /app/uploads
```

## 🚀 Commandes Utiles

### Voir les volumes Docker
```bash
docker volume ls
```

### Inspecter le volume uploads
```bash
# Production
docker volume inspect synergia_uploads_data

# Développement
docker volume inspect synergia_uploads_data_dev
```

### Accéder aux fichiers dans le volume
```bash
# Production
docker run --rm -v synergia_uploads_data:/data alpine ls -lah /data

# Développement
docker run --rm -v synergia_uploads_data_dev:/data alpine ls -lah /data
```

### Sauvegarder les uploads
```bash
# Production
docker run --rm \
  -v synergia_uploads_data:/source \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .

# Développement
docker run --rm \
  -v synergia_uploads_data_dev:/source \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads-dev-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .
```

### Restaurer les uploads
```bash
# Production
docker run --rm \
  -v synergia_uploads_data:/target \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /target && tar xzf /backup/uploads-YYYYMMDD-HHMMSS.tar.gz"

# Développement
docker run --rm \
  -v synergia_uploads_data_dev:/target \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /target && tar xzf /backup/uploads-dev-YYYYMMDD-HHMMSS.tar.gz"
```

### Nettoyer les volumes (ATTENTION: Perte de données!)
```bash
# Arrêter les conteneurs d'abord
docker compose -f docker-compose.prod.yml down

# Supprimer le volume uploads (DESTRUCTIF!)
docker volume rm synergia_uploads_data

# Redémarrer
docker compose -f docker-compose.prod.yml up -d
```

### Vérifier les permissions
```bash
# Production
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads

# Développement
docker compose -f docker-compose.dev.yml exec backend ls -la /app/uploads
```

### Corriger les permissions si nécessaire
```bash
# Si les permissions sont incorrectes (ne devrait pas être nécessaire)
docker compose -f docker-compose.prod.yml exec backend chown -R node:node /app/uploads
docker compose -f docker-compose.prod.yml exec backend chmod -R 755 /app/uploads
```

## 🔄 Migration depuis l'ancien système

Si vous aviez déjà des fichiers dans `./server/uploads/`, vous devez les migrer vers le nouveau volume :

```bash
# 1. Arrêter les conteneurs
docker compose -f docker-compose.prod.yml down

# 2. Copier les fichiers vers le volume
docker run --rm \
  -v $(pwd)/server/uploads:/source \
  -v synergia_uploads_data:/target \
  alpine sh -c "cp -r /source/* /target/ && chown -R 1000:1000 /target"

# 3. Redémarrer
docker compose -f docker-compose.prod.yml up -d

# 4. Vérifier
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads
```

## 📍 Localisation Physique des Volumes

Docker stocke les volumes dans :
- **Linux**: `/var/lib/docker/volumes/`
- **Windows**: `C:\ProgramData\Docker\volumes\` ou via WSL2
- **Mac**: `~/Library/Containers/com.docker.docker/Data/vms/0/data/docker/volumes/`

Exemple :
```bash
# Linux/WSL2
ls -la /var/lib/docker/volumes/synergia_uploads_data/_data/

# Vous devriez voir vos fichiers uploads ici
```

## 🛡️ Sécurité

Le conteneur backend tourne maintenant avec l'utilisateur **node** (non-root) pour plus de sécurité:
- UID/GID: 1000:1000
- Permissions: 755 (rwxr-xr-x)

Cela signifie:
- ✅ Le conteneur peut lire/écrire dans `/app/uploads`
- ✅ D'autres conteneurs peuvent lire (si nécessaire)
- ✅ Isolation de sécurité (pas de root)

## 🐛 Dépannage

### Problème: Cannot write to /app/uploads
```bash
# Vérifier les permissions
docker compose exec backend ls -ld /app/uploads

# Devrait afficher: drwxr-xr-x 1 node node ...
# Si ce n'est pas le cas, corriger:
docker compose exec backend chown -R node:node /app/uploads
docker compose exec backend chmod -R 755 /app/uploads
```

### Problème: Volume not found
```bash
# Recréer le volume
docker volume create synergia_uploads_data

# Redémarrer les conteneurs
docker compose -f docker-compose.prod.yml up -d
```

### Problème: Files not accessible from frontend
Les fichiers sont servis via l'endpoint `/uploads` du backend:
```
https://your-domain/api/uploads/file-path
```

Vérifier dans `server/startup/routes.js` que le dossier uploads est bien monté:
```javascript
app.use('/uploads', express.static(uploadsPath));
```

## 📝 Notes Importantes

1. **Ne jamais** utiliser `./server/uploads` en production - utiliser le volume nommé
2. **Toujours** sauvegarder le volume avant les mises à jour majeures
3. **Les fichiers persistent** même si le conteneur est supprimé
4. **Pour supprimer les fichiers**, vous devez supprimer le volume explicitement

## ✅ Vérification Post-Déploiement

Après le déploiement, vérifier que tout fonctionne:

```bash
# 1. Vérifier que le volume existe
docker volume ls | grep uploads_data

# 2. Vérifier les permissions
docker compose -f docker-compose.prod.yml exec backend ls -la /app/uploads

# 3. Tester un upload depuis un client distant
# Via l'interface web de l'application

# 4. Vérifier que le fichier apparaît dans le volume
docker run --rm -v synergia_uploads_data:/data alpine ls -lah /data
```

Si tout fonctionne correctement:
- ✅ Le volume `synergia_uploads_data` existe
- ✅ Les permissions sont `drwxr-xr-x node node`
- ✅ Les uploads fonctionnent depuis n'importe quel client
- ✅ Les fichiers persistent après un `docker compose restart`
