# Guide de déploiement pour ECM Rework

Ce document explique les différentes méthodes de déploiement disponibles pour l'application ECM Rework.

## Prérequis

- Docker et Docker Compose installés sur la machine cible
- Accès aux images Docker (via GitHub Container Registry ou registry personnalisé)
- Variables d'environnement correctement configurées

## Méthodes de déploiement

### 1. Déploiement manuel avec Docker Compose

Pour un déploiement manuel sur un serveur:

1. Cloner le repository:
   ```bash
   git clone https://github.com/votre-organisation/ecm-rework.git
   cd ecm-rework
   ```

2. Créer un fichier `.env` basé sur `.env.example`:
   ```bash
   cp .env.example .env
   # Modifier les variables d'environnement selon l'environnement
   ```

3. Démarrer les services:
   ```bash
   docker-compose up -d
   ```

4. Vérifier que les services fonctionnent correctement:
   ```bash
   docker-compose ps
   ```

### 2. Déploiement automatisé via CI/CD (GitHub Actions)

Le projet est configuré pour un déploiement automatisé via GitHub Actions:

1. **Déploiement en environnement de développement**:
   - Déclenché automatiquement lors d'un push sur la branche `dev`
   - Construit les images Docker
   - Exécute les tests
   - Déploie sur l'environnement de développement

2. **Déploiement en production**:
   - Déclenché manuellement ou lors d'un merge sur la branche `main`
   - Construit les images Docker
   - Exécute les tests
   - Tag les images avec la version
   - Déploie sur l'environnement de production

## Configuration des secrets pour GitHub Actions

Les workflows CI/CD nécessitent les secrets suivants configurés dans GitHub:

- `SSH_HOST`: Adresse IP ou hostname du serveur cible
- `SSH_USERNAME`: Nom d'utilisateur pour la connexion SSH
- `SSH_PRIVATE_KEY`: Clé privée SSH pour l'authentification
- `SSH_KNOWN_HOSTS`: Empreintes des hôtes connus pour éviter les attaques MITM
- `REGISTRY_USERNAME`: Nom d'utilisateur pour le registry Docker (si registry personnalisé)
- `REGISTRY_PASSWORD`: Mot de passe pour le registry Docker (si registry personnalisé)

Pour GitHub Container Registry (ghcr.io), utilisez:
- `CR_PAT`: Personal Access Token avec permissions packages:read et packages:write

## Utilisation de GitHub Container Registry

Pour utiliser GitHub Container Registry (ghcr.io):

1. S'authentifier sur GitHub Container Registry:
   ```bash
   echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin
   ```

2. Récupérer les images:
   ```bash
   docker pull ghcr.io/votre-organisation/ecm_rework-backend:latest
   docker pull ghcr.io/votre-organisation/ecm_rework-frontend:latest
   ```

3. Utiliser ces images dans votre docker-compose.yml:
   ```yaml
   services:
     backend:
       image: ghcr.io/votre-organisation/ecm_rework-backend:latest
     frontend:
       image: ghcr.io/votre-organisation/ecm_rework-frontend:latest
   ```

## Gestion des versions

Les images sont taguées selon la convention suivante:
- `latest`: Dernière version stable (branche main)
- `dev`: Dernière version de développement (branche dev)
- `x.y.z`: Version spécifique (tags de release)

## Mise à jour de l'application

Pour mettre à jour l'application déployée manuellement:

1. Récupérer les dernières modifications:
   ```bash
   git pull
   ```

2. Récupérer les dernières images:
   ```bash
   docker-compose pull
   ```

3. Redémarrer les services:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## Surveillance et maintenance

Pour surveiller les logs de l'application:
```bash
docker-compose logs -f
```

Pour vérifier l'état des services:
```bash
docker-compose ps
```

Pour redémarrer un service spécifique:
```bash
docker-compose restart service_name
```

## Résolution des problèmes

Si vous rencontrez des problèmes lors du déploiement, consultez le fichier `TROUBLESHOOTING.md`.
