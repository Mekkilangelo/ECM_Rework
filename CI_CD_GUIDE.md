# Guide CI/CD pour ECM Rework

Ce document décrit les workflows CI/CD mis en place pour le projet ECM Rework, basés sur GitHub Actions.

## Architecture des workflows

Les workflows sont situés dans le dossier `.github/workflows/` et sont divisés en plusieurs fichiers selon leur fonction:

### 1. test-dev.yml
- **Déclencheur**: Push sur la branche `dev`
- **Objectif**: Vérifier rapidement que les changements ne cassent pas l'application
- **Actions**:
  - Exécution des tests unitaires
  - Vérification du linting

### 2. build-and-test.yml
- **Déclencheur**: Pull Requests vers `dev` ou `main`
- **Objectif**: Tests complets avant fusion
- **Actions**:
  - Construction des images Docker
  - Exécution des tests unitaires et d'intégration
  - Vérification du linting et de la qualité du code

### 3. docker-publish.yml
- **Déclencheur**: Push sur `dev` ou `main`
- **Objectif**: Publication des images Docker
- **Actions**:
  - Construction des images Docker
  - Publication sur GitHub Container Registry (ghcr.io)
  - Tagging des images selon la branche ou le tag de version

### 4. deploy.yml
- **Déclencheur**: Workflow `docker-publish.yml` complété avec succès
- **Objectif**: Déploiement sur l'environnement correspondant
- **Actions**:
  - Déploiement sur l'environnement de développement (branche `dev`)
  - Déploiement sur l'environnement de production (branche `main`)

## Configuration requise

Pour que les workflows fonctionnent correctement, les secrets suivants doivent être configurés dans les paramètres GitHub:

### Pour la publication des images Docker
- `CR_PAT`: Personal Access Token avec permissions `packages:read` et `packages:write`

### Pour le déploiement SSH
- `SSH_HOST`: Adresse IP ou hostname du serveur cible
- `SSH_USERNAME`: Nom d'utilisateur pour la connexion SSH
- `SSH_PRIVATE_KEY`: Clé privée SSH pour l'authentification
- `SSH_KNOWN_HOSTS`: Empreintes des hôtes connus pour éviter les attaques MITM

## Variables d'environnement

Les workflows utilisent plusieurs variables d'environnement qui peuvent être configurées dans les paramètres GitHub:

- `DOCKER_REGISTRY`: Défini automatiquement à `ghcr.io/<owner>/` pour GitHub Container Registry
- `TAG`: Basé sur la branche (`latest` pour `main`, `dev` pour `dev`) ou le tag de version

## Exemples de déploiement

### Déploiement en développement

1. Push sur la branche `dev`
2. Le workflow `test-dev.yml` s'exécute
3. Si réussi, `docker-publish.yml` construit et publie les images avec le tag `dev`
4. `deploy.yml` déploie l'application sur l'environnement de développement

### Déploiement en production

1. Merge d'une PR vers `main`
2. Le workflow `build-and-test.yml` s'exécute sur la PR
3. Une fois fusionnée, `docker-publish.yml` construit et publie les images avec le tag `latest`
4. `deploy.yml` déploie l'application sur l'environnement de production

## Script de déploiement

Le déploiement utilise SSH pour se connecter au serveur cible et exécuter les commandes suivantes:

1. Se connecter au registry Docker
2. Récupérer les nouvelles images
3. Mettre à jour le fichier `docker-compose.yml` si nécessaire
4. Redémarrer les services avec `docker-compose`

## Surveillance des workflows

Vous pouvez surveiller l'état des workflows dans l'onglet "Actions" du repository GitHub. En cas d'échec, consultez les logs pour identifier le problème.

## Résolution des problèmes

Si vous rencontrez des problèmes avec les workflows CI/CD, consultez le fichier `TROUBLESHOOTING.md`.
