# Guide détaillé du processus de déploiement

Ce document explique en détail comment fonctionne le processus de déploiement pour l'application ECM Monitoring, de votre environnement de développement local jusqu'à la production chez le client.

## 1. Environnement de développement local

### Développement et tests locaux

```bash
# Démarrer les services en mode développement
cd client && npm start  # Pour le frontend
cd server && npm run dev  # Pour le backend
```

### Tests avec Docker en local

```bash
# Construire et démarrer les conteneurs
docker compose build
docker compose up -d

# Vérifier les logs
docker compose logs -f
```

## 2. Intégration continue avec GitHub Actions

### Workflow de tests automatiques

Lorsque vous poussez du code sur la branche `dev` ou créez une pull request vers `dev` ou `main`, le workflow `build-and-test.yml` s'exécute automatiquement :

1. **Construction des images Docker** :
   ```yaml
   - name: Build images
     run: docker compose build
   ```

2. **Démarrage des services** :
   ```yaml
   - name: Start services
     run: docker compose up -d
   ```

3. **Exécution des tests** :
   ```yaml
   - name: Run backend tests
     run: docker compose exec -T backend npm test
   ```

Vous pouvez suivre l'exécution de ce workflow dans l'onglet "Actions" de GitHub. S'il échoue, vous devriez corriger les problèmes avant de continuer.

### Comment tester la branche dev

Pour mettre en place un environnement de test pour la branche `dev`, vous pouvez créer un nouveau workflow GitHub Actions :

1. Créez un fichier `.github/workflows/deploy-dev.yml` :
   ```yaml
   name: Deploy to Development

   on:
     push:
       branches: [ dev ]

   jobs:
     deploy-dev:
       runs-on: ubuntu-latest
       steps:
         # Étapes similaires à deploy.yml mais pour l'environnement de développement
   ```

2. Configurez un serveur de test distinct avec ses propres secrets dans GitHub.

## 3. Déploiement en production

### Processus de promotion dev → main

1. **Créer une Pull Request** :
   - Dans GitHub, créez une PR de `dev` vers `main`
   - Ajoutez une description détaillée des changements
   - Demandez une revue

2. **Revue et approbation** :
   - Un ou plusieurs développeurs examinent le code
   - Les tests automatiques doivent passer
   - La PR est approuvée

3. **Fusion dans main** :
   - La PR est fusionnée dans la branche `main`
   - Cela déclenche automatiquement le workflow de déploiement en production

### Workflow de déploiement en production

Lorsque le code est poussé sur la branche `main` (généralement via une PR fusionnée), le workflow `deploy.yml` s'exécute :

1. **Construction et étiquetage des images** :
   ```yaml
   - name: Build and tag images
     run: |
       docker compose build
       docker tag ecm-monitoring-frontend:latest registry.example.com/ecm-monitoring/frontend:${{ github.sha }}
       docker tag ecm-monitoring-backend:latest registry.example.com/ecm-monitoring/backend:${{ github.sha }}
   ```

2. **Authentification au Docker Registry** :
   ```yaml
   - name: Login to Docker Registry
     uses: docker/login-action@v1
     with:
       registry: registry.example.com
       username: ${{ secrets.REGISTRY_USERNAME }}
       password: ${{ secrets.REGISTRY_PASSWORD }}
   ```

3. **Push des images au Registry** :
   ```yaml
   - name: Push images
     run: |
       docker push registry.example.com/ecm-monitoring/frontend:${{ github.sha }}
       docker push registry.example.com/ecm-monitoring/backend:${{ github.sha }}
   ```

4. **Déploiement sur le serveur de production** (décommenté dans votre cas) :
   ```yaml
   - name: Deploy to production
     uses: appleboy/ssh-action@master
     with:
       host: ${{ secrets.PROD_HOST }}
       username: ${{ secrets.PROD_USERNAME }}
       key: ${{ secrets.PROD_SSH_KEY }}
       script: |
         cd /chemin/vers/application
         docker compose pull
         docker compose down
         docker compose up -d
   ```

## 4. Configuration nécessaire chez le client

### Infrastructure requise

1. **Serveur de production** :
   - Docker et Docker Compose installés
   - Accès réseau pour télécharger les images Docker
   - Utilisateur avec permissions Docker

2. **Registry Docker** (options) :
   - Docker Hub (public)
   - Registry privé (Nexus, Harbor, GitLab, etc.)
   - Registry hébergé chez le client

### Configuration du serveur de production

1. **Installation de Docker** :
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Installation du plugin Docker Compose** :
   ```bash
   # Docker Compose est maintenant inclus comme plugin dans Docker
   # Vérifier qu'il est correctement installé
   docker compose version
   
   # Si ce n'est pas le cas, installer le plugin
   apt-get update
   apt-get install -y docker-compose-plugin
   ```

3. **Configuration SSH pour le déploiement** :
   - Générer une paire de clés SSH sur votre machine CI/CD
   - Ajouter la clé publique à `~/.ssh/authorized_keys` sur le serveur de production
   - Ajouter la clé privée comme secret GitHub (`PROD_SSH_KEY`)

4. **Préparation du répertoire de déploiement** :
   ```bash
   mkdir -p /opt/ecm-monitoring
   cd /opt/ecm-monitoring
   ```

5. **Configuration du docker-compose.yml et .env** :
   - Copier le fichier docker-compose.yml sur le serveur
   - Créer un fichier .env avec les configurations de production

## 5. Flux de déploiement complet

1. **Développeur** : Pousse le code sur la branche `dev`
2. **GitHub Actions** : Exécute les tests automatiques
3. **Développeur** : Crée une PR de `dev` vers `main`
4. **Reviewers** : Approuvent la PR
5. **GitHub** : Fusionne la PR dans `main`
6. **GitHub Actions** : Construit, étiquette et pousse les images Docker
7. **GitHub Actions** : Se connecte au serveur de production via SSH
8. **Serveur de production** : Télécharge les nouvelles images et redémarre les conteneurs

## 6. Configurations additionnelles recommandées

### Environnement de staging

Pour tester en conditions réelles avant la production, configurez un environnement de staging :

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ staging ]

jobs:
  deploy-staging:
    # Configuration similaire à la production
```

### Rollback en cas de problème

Implémentez une stratégie de rollback :

```yaml
- name: Rollback if needed
  if: failure()
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.PROD_HOST }}
    username: ${{ secrets.PROD_USERNAME }}
    key: ${{ secrets.PROD_SSH_KEY }}
    script: |
      cd /chemin/vers/application
      docker compose pull previous-tag
      docker compose down
      docker compose up -d
```

### Monitoring et alertes

Mettez en place un système de monitoring :
- Prometheus + Grafana pour les métriques
- ELK Stack ou Graylog pour les logs
- Alertes par email ou autre moyen en cas de problème
