# ✅ Checklist de Vérification Post-Déploiement

## 🔍 Vérifications à effectuer sur le serveur

### 1. Vérifier l'état des conteneurs

```bash
docker compose ps
```

**Résultat attendu** : Tous les conteneurs doivent être `Up`
```
NAME                    IMAGE                     STATUS
customia-backend-1      synergia-backend:1.2.3    Up X minutes
customia-database-1     mysql:8.0                 Up X minutes
customia-frontend-1     synergia-frontend:1.2.3   Up X minutes
customia-nginx-1        nginx:alpine              Up X minutes
customia-ml-api-1       synergia-ml-api:1.2.3     Up X minutes
```

❌ Si un conteneur est en `Restarting` ou `Exited`, il y a un problème.

---

### 2. Vérifier les logs du backend (pas d'erreur)

```bash
docker compose logs backend | tail -50
```

**Ce que vous devez voir** :
```
✅ Logger Winston initialisé
✅ Chemins de stockage configurés
✅ Connexion à la base de données établie
✅ Server is running on port 5001
```

**Ce que vous NE devez PAS voir** :
```
❌ Error: EACCES: permission denied, mkdir '/app/logs'
❌ Error: EACCES: permission denied, mkdir '/app/uploads'
❌ Connection refused
❌ Cannot find module
```

---

### 3. Vérifier les permissions des dossiers critiques

```bash
# Dans le conteneur backend
docker compose exec backend ls -la /app/ | grep -E "logs|uploads"
```

**Résultat attendu** :
```
drwxr-xr-x  3 node node  4096 Jan  8 15:00 logs
drwxr-xr-x  3 node node  4096 Jan  8 15:00 uploads
```

✅ Owner doit être `node:node`
✅ Permissions doivent être `drwxr-xr-x` (755)

---

### 4. Vérifier les volumes Docker

```bash
docker volume ls | grep customia
```

**Résultat attendu** :
```
local     customia_mysql_data_prod
local     customia_uploads_data
```

#### Inspecter le volume uploads
```bash
docker volume inspect customia_uploads_data
```

#### Voir le contenu du volume uploads
```bash
docker run --rm -v customia_uploads_data:/data alpine ls -lah /data
```

Si vous aviez des fichiers avant, ils devraient être là.

---

### 5. Vérifier la connectivité de l'application

```bash
# Depuis le serveur
curl -I http://localhost/api/health || curl -I http://localhost:5001/api/health
```

**Résultat attendu** :
```
HTTP/1.1 200 OK
```

Ou vérifier l'API depuis un navigateur :
```
https://votre-domaine/api/health
```

---

### 6. Tester l'interface web

Ouvrez un navigateur et allez sur :
```
https://votre-domaine
```

✅ La page doit se charger
✅ Vous devez pouvoir vous connecter
✅ Pas d'erreurs dans la console du navigateur (F12)

---

### 7. Tester l'upload de fichiers (CRITIQUE)

1. Connectez-vous à l'application
2. Allez dans un test/essai
3. Essayez d'uploader un fichier (n'importe quelle section)
4. Vérifiez que :
   - ✅ L'upload fonctionne
   - ✅ Le fichier apparaît dans la liste
   - ✅ Vous pouvez voir/télécharger le fichier
   - ✅ Le fichier persiste après un `docker compose restart`

#### Vérifier que le fichier est bien dans le volume
```bash
# Après avoir uploadé un fichier
docker run --rm -v customia_uploads_data:/data alpine find /data -type f -name "*.pdf" -o -name "*.jpg" | head -10
```

---

### 8. Tester depuis un autre PC/utilisateur

**C'est le test le plus important !**

1. Depuis un autre ordinateur sur le réseau
2. Connectez-vous à l'application
3. Essayez d'uploader un fichier
4. Vérifiez que l'upload fonctionne

✅ Si ça fonctionne : **Problème résolu !**
❌ Si ça ne fonctionne pas : voir section Dépannage ci-dessous

---

## 🐛 Dépannage

### Problème : Backend en `Restarting`

```bash
# Voir les logs d'erreur
docker compose logs backend | tail -100

# Si erreur EACCES, recréer les dossiers
docker compose exec --user root backend sh -c "mkdir -p /app/logs /app/uploads && chown -R node:node /app/logs /app/uploads && chmod -R 755 /app/logs /app/uploads"

# Redémarrer
docker compose restart backend
```

### Problème : Uploads ne fonctionnent pas

```bash
# Vérifier les permissions du volume
docker compose exec backend ls -la /app/uploads

# Devrait afficher: drwxr-xr-x node node

# Si les permissions sont incorrectes
docker compose exec --user root backend chown -R node:node /app/uploads
docker compose exec --user root backend chmod -R 755 /app/uploads
docker compose restart backend
```

### Problème : Fichiers uploadés disparaissent après redémarrage

```bash
# Vérifier que le volume est bien monté
docker compose exec backend df -h | grep uploads

# Devrait afficher quelque chose comme:
# overlay  XXG  YYG  ZZG  AA% /app/uploads

# Vérifier le docker-compose.yaml
grep -A5 "backend:" docker-compose.yaml | grep uploads

# Devrait afficher:
#   - uploads_data:/app/uploads
```

### Problème : Base de données ne démarre pas

```bash
# Voir les logs MySQL
docker compose logs database | tail -50

# Vérifier le volume MySQL
docker volume ls | grep mysql
docker volume inspect customia_mysql_data_prod
```

---

## 📊 Checklist Rapide

Cochez chaque item après vérification :

- [ ] Tous les conteneurs sont `Up`
- [ ] Logs backend sans erreur EACCES
- [ ] Permissions `/app/logs` = `drwxr-xr-x node:node`
- [ ] Permissions `/app/uploads` = `drwxr-xr-x node:node`
- [ ] Volume `customia_uploads_data` existe
- [ ] API répond : `curl http://localhost/api/health`
- [ ] Interface web accessible
- [ ] Login fonctionne
- [ ] Upload fonctionne depuis le serveur
- [ ] Upload fonctionne depuis un autre PC ⭐ **TEST CRITIQUE**
- [ ] Fichiers persistent après `docker compose restart`

---

## 🎯 Commande "Tout en Un" pour Vérification Rapide

```bash
echo "=== 1. État des conteneurs ==="
docker compose ps
echo ""

echo "=== 2. Logs backend (dernières 20 lignes) ==="
docker compose logs backend | tail -20
echo ""

echo "=== 3. Permissions /app ==="
docker compose exec backend ls -la /app/ | grep -E "logs|uploads"
echo ""

echo "=== 4. Volumes Docker ==="
docker volume ls | grep customia
echo ""

echo "=== 5. Test API Health ==="
curl -s http://localhost/api/health || curl -s http://localhost:5001/api/health
echo ""

echo "=== 6. Contenu du volume uploads (premiers 10 fichiers) ==="
docker run --rm -v customia_uploads_data:/data alpine find /data -type f | head -10
echo ""

echo "✅ Vérification terminée"
```

Copiez-collez cette commande sur le serveur pour faire toutes les vérifications d'un coup.

---

## 📝 Logs à Consulter en Cas de Problème

```bash
# Logs en temps réel
docker compose logs -f

# Logs de tous les services
docker compose logs --tail=100

# Logs d'un service spécifique
docker compose logs backend --tail=100
docker compose logs database --tail=100
docker compose logs frontend --tail=100
docker compose logs nginx --tail=100
docker compose logs ml-api --tail=100
```

---

## ✅ Si Tout Est OK

Vous devriez voir :
1. ✅ 5 conteneurs en état `Up`
2. ✅ Aucune erreur dans les logs
3. ✅ L'application accessible sur https://votre-domaine
4. ✅ Les uploads fonctionnent depuis n'importe quel PC
5. ✅ Les fichiers persistent après redémarrage

**🎉 Déploiement réussi !**
