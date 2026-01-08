# 🔥 HOTFIX - Problème de permissions /app/logs

## Symptôme
```
Error: EACCES: permission denied, mkdir '/app/logs'
```

Le backend redémarre en boucle et ne peut pas créer le dossier `/app/logs`.

## Cause
Le Dockerfile utilise maintenant `USER node` (non-root) mais le dossier `/app/logs` n'avait pas été créé avec les bonnes permissions.

## ✅ Solution Rapide (Sans rebuild)

Sur le serveur, exécutez :

```bash
# 1. Arrêter les conteneurs
docker compose down

# 2. Créer le dossier logs dans l'image existante (temporaire)
docker compose run --rm --user root backend sh -c "mkdir -p /app/logs && chown -R node:node /app/logs && chmod -R 755 /app/logs"

# 3. OU créer un volume pour les logs (recommandé)
# Éditer docker-compose.yaml et ajouter dans le service backend:
# volumes:
#   - logs_data:/app/logs

# Et dans la section volumes en bas:
# logs_data:
#   driver: local

# 4. Redémarrer
docker compose up -d

# 5. Vérifier
docker compose logs -f backend
```

## ✅ Solution Permanente (Avec rebuild)

Cette solution est déjà dans le code sur GitHub (commit 1d81150).

Sur le serveur :

```bash
# 1. Pull les dernières modifications
git pull origin dev

# 2. Rebuild l'image backend
docker compose build backend

# 3. Redémarrer
docker compose down
docker compose up -d

# 4. Vérifier
docker compose ps
docker compose logs -f backend
```

## 📋 Vérification

Le backend devrait maintenant démarrer correctement :

```bash
# Vérifier l'état
docker compose ps

# Devrait afficher:
# customia-backend-1    synergia-backend:1.2.3    "docker-entrypoint.s…"   backend    Up X minutes

# Vérifier les logs (pas d'erreur EACCES)
docker compose logs backend | tail -20
```

## 🔍 Détails Techniques

Le Dockerfile a été mis à jour (ligne 24-26) :

```dockerfile
# AVANT (manquait /app/logs)
RUN mkdir -p /app/uploads /app/uploads/temp && \
    chown -R node:node /app/uploads && \
    chmod -R 755 /app/uploads

# APRÈS (ajoute /app/logs)
RUN mkdir -p /app/uploads /app/uploads/temp /app/logs && \
    chown -R node:node /app/uploads /app/logs && \
    chmod -R 755 /app/uploads /app/logs
```

Le conteneur backend tourne maintenant avec l'utilisateur `node` (uid 1000) pour des raisons de sécurité, donc tous les dossiers où Node.js doit écrire doivent être créés avec les bonnes permissions au moment du build.

## 📝 Commit GitHub

Le fix est disponible dans le commit :
- **Commit**: `1d81150`
- **Message**: "fix: add logs directory with correct permissions in Dockerfile"
- **Branch**: `dev`

## ⚡ TL;DR - Fix Immédiat

```bash
# Sur le serveur (dans le dossier contenant docker-compose.yaml)
docker compose down
docker compose run --rm --user root backend sh -c "mkdir -p /app/logs && chown -R node:node /app/logs && chmod -R 755 /app/logs"
docker compose up -d
```

Ou directement reconstruire l'image après git pull:
```bash
git pull origin dev
docker compose build backend
docker compose up -d
```
