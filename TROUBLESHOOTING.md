# Guide de dépannage

Ce document décrit les problèmes courants que vous pourriez rencontrer lors du déploiement ou de l'utilisation de l'application ECM Monitoring, et les solutions correspondantes.

## Problèmes avec Docker Compose

### Erreur: "docker-compose: command not found"

**Problème**: La commande `docker-compose` (avec tiret) n'est pas reconnue.

**Solution**:
1. **Utiliser la nouvelle syntaxe** (pour Docker 20.10+):
   ```bash
   docker compose version
   docker compose up -d
   ```

2. **Installer Docker Compose v2** si la commande n'existe pas:
   ```bash
   # Sur Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y docker-compose-plugin

   # Installation manuelle si nécessaire
   DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
   mkdir -p $DOCKER_CONFIG/cli-plugins
   COMPOSE_VERSION="v2.23.3"
   sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### Erreur dans CI/CD: "Package 'docker-compose-plugin' has no installation candidate"

**Problème**: Le paquet Docker Compose n'est pas disponible dans les dépôts de la distribution.

**Solution**:
- Utiliser l'installation manuelle comme décrit ci-dessus.
- Assurez-vous que les workflows CI/CD utilisent la syntaxe appropriée pour votre environnement.

## Problèmes avec les tests

### Erreur: "cross-env: not found"

**Problème**: L'outil `cross-env` utilisé pour exécuter les tests n'est pas installé dans le conteneur Docker.

**Solution**:
- Reconstruire l'image Docker du backend avec l'argument `NODE_ENV=test` pour installer les dépendances de développement:
  ```bash
  docker-compose build --build-arg NODE_ENV=test backend
  # OU
  docker compose build --build-arg NODE_ENV=test backend
  ```
- Cette configuration est déjà incluse dans les workflows CI/CD.

## Problèmes de déploiement

### Erreur: "repository name must be lowercase"

**Problème**: Les noms de repository Docker doivent être en minuscules.

**Solution**:
- Toujours utiliser des noms en minuscules pour les repositories Docker
- Par exemple, utiliser `ghcr.io/mekkilangelo/ecm_rework-frontend:latest` au lieu de `ghcr.io/Mekkilangelo/ECM_Rework-frontend:latest`

### Erreur: "no such host" lors de la connexion au registry

**Problème**: L'erreur suivante indique que le nom d'hôte du registry Docker n'existe pas ou n'est pas accessible:
```
Error: Error response from daemon: Get "https://registry.example.com/v2/": dial tcp: lookup registry.example.com on 127.0.0.53:53: no such host
```

**Solution**:
1. Vérifier que l'URL du registry est correcte et accessible
2. Pour GitHub Container Registry, utilisez `ghcr.io` comme nom d'hôte
3. Si vous utilisez un registry personnalisé, assurez-vous qu'il est accessible depuis l'environnement CI/CD
4. Vérifier que les paramètres de proxy et DNS sont correctement configurés

### Identification du Docker Registry échoue

**Problème**: Impossible de se connecter au Docker Registry lors du déploiement.

**Solution**:
1. Pour GitHub Container Registry:
   - Assurez-vous d'utiliser `${{ github.token }}` ou un Personal Access Token avec les permissions `packages:read` et `packages:write`
   - Configurez les permissions dans le workflow: `permissions: contents: read, packages: write`

2. Pour un registry personnalisé:
   - Vérifier que les secrets `REGISTRY_USERNAME` et `REGISTRY_PASSWORD` sont correctement configurés
   - S'assurer que le secret `PUSH_TO_REGISTRY` est défini sur "true"

### Déploiement SSH échoue

**Problème**: Impossible de se connecter au serveur de production via SSH.

**Solution**:
1. Vérifier que les secrets `PROD_HOST`, `PROD_USERNAME`, et `PROD_SSH_KEY` sont correctement configurés.
2. Vérifier que la clé SSH a les autorisations appropriées sur le serveur distant.
3. S'assurer que le secret `DEPLOY_TO_PRODUCTION` est défini sur "true".

## Problèmes d'environnement

### Variables d'environnement manquantes

**Problème**: L'application ne fonctionne pas correctement car des variables d'environnement sont manquantes.

**Solution**:
1. Copier le fichier `.env.example` en `.env`.
2. Remplir toutes les variables nécessaires selon l'environnement.
3. Redémarrer l'application:
   ```bash
   docker-compose down && docker-compose up -d
   # OU
   docker compose down && docker compose up -d
   ```
