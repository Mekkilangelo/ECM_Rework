# Configuration de GitHub Actions pour ECM Monitoring

Ce document décrit comment utiliser les workflows GitHub Actions configurés pour ce projet.

## Workflows disponibles

### 1. Test Dev Branch (`test-dev.yml`)

Ce workflow s'exécute automatiquement lorsque du code est poussé sur la branche `dev`. Il:
- Construit les images Docker avec les dépendances de test
- Exécute les tests automatisés
- Vérifie que l'application fonctionne correctement

### 2. Build and Test (`build-and-test.yml`)

Ce workflow s'exécute sur les branches `dev` et `main`. Il:
- Construit les images Docker
- Exécute les tests automatisés pour vérifier l'intégrité du code

### 3. Deploy to Production (`deploy.yml`)

Ce workflow s'exécute uniquement sur la branche `main`. Il:
- Construit les images Docker
- Les étiquette avec le SHA du commit et "latest"
- Les pousse vers un registry Docker (si configuré)
- Déploie sur le serveur de production (si configuré)

### 4. Build and Push Docker Images (`docker-publish.yml`)

Ce nouveau workflow:
- Construit les images Docker pour le frontend et le backend
- Les pousse vers GitHub Container Registry (ghcr.io)
- Étiquette automatiquement les images selon la branche et le commit

## Configuration requise

### Secrets GitHub requis

Pour activer toutes les fonctionnalités CI/CD, configurez les secrets suivants dans les paramètres de votre repository GitHub:

#### Pour le Docker Registry:
- `PUSH_TO_REGISTRY: true` - Pour activer le push vers un registry Docker

#### Pour le déploiement SSH:
- `DEPLOY_TO_PRODUCTION: true` - Pour activer le déploiement SSH
- `PROD_HOST` - Adresse IP ou nom d'hôte du serveur de production
- `PROD_USERNAME` - Nom d'utilisateur SSH
- `PROD_SSH_KEY` - Clé SSH privée pour l'authentification

#### Pour GitHub Container Registry:
- Le token `GITHUB_TOKEN` est automatiquement disponible, aucun secret supplémentaire n'est requis

## Comment utiliser

### Publication d'images Docker

Pour publier des images Docker sur GitHub Container Registry:

1. Poussez du code sur la branche `main` ou `dev`
2. Le workflow `docker-publish.yml` s'exécutera automatiquement
3. Les images seront disponibles sur:
   - `ghcr.io/mekkilangelo/ecm_rework-frontend:latest`
   - `ghcr.io/mekkilangelo/ecm_rework-backend:latest`

Pour tirer (pull) ces images:

```bash
docker pull ghcr.io/mekkilangelo/ecm_rework-frontend:latest
docker pull ghcr.io/mekkilangelo/ecm_rework-backend:latest
```

### Exécution manuelle

Vous pouvez également exécuter le workflow `docker-publish.yml` manuellement depuis l'onglet "Actions" de votre repository GitHub.
