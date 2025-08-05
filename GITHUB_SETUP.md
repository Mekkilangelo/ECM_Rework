# Configuration des Branch Protection Rules sur GitHub

Pour mettre en place la stratégie GitFlow décrite dans le fichier GITFLOW.md, voici les étapes pour configurer les règles de protection des branches sur GitHub:

## 1. Règles pour la branche `main`

1. Accédez au repository sur GitHub
2. Cliquez sur "Settings" > "Branches"
3. Sous "Branch protection rules", cliquez sur "Add rule"
4. Dans "Branch name pattern", entrez `main`
5. Cochez les options suivantes:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (set to 1 or more)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
     - Recherchez et ajoutez le check `build-and-test`
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings
   - ✅ Restrict who can push to matching branches (ajoutez les administrateurs)
6. Cliquez sur "Create"

## 2. Règles pour la branche `dev`

1. Suivez les mêmes étapes que précédemment
2. Dans "Branch name pattern", entrez `dev`
3. Cochez les options suivantes:
   - ✅ Require status checks to pass before merging
     - Recherchez et ajoutez le check `build-and-test`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
4. Cliquez sur "Create"

## 3. Configuration des secrets pour CI/CD

Pour que les workflows GitHub Actions fonctionnent correctement, vous devez configurer les secrets suivants:

1. Accédez à "Settings" > "Secrets and variables" > "Actions"
2. Cliquez sur "New repository secret" et ajoutez les secrets suivants:

Pour le Docker Registry:
- `REGISTRY_USERNAME`: Nom d'utilisateur pour le registry Docker
- `REGISTRY_PASSWORD`: Mot de passe pour le registry Docker

Pour le déploiement SSH (si applicable):
- `PROD_HOST`: Adresse IP ou nom d'hôte du serveur de production
- `PROD_USERNAME`: Nom d'utilisateur SSH
- `PROD_SSH_KEY`: Clé SSH privée pour l'authentification

Pour les notifications:
- `SLACK_WEBHOOK_URL`: URL du webhook Slack pour les notifications

## 4. Configuration du serveur de production chez le client

1. Assurez-vous que le serveur peut accéder au registry Docker
2. Installez Docker et Docker Compose
3. Créez un utilisateur dédié avec les permissions Docker
4. Configurez les variables d'environnement ou le fichier `.env`
5. Mettez en place un système de sauvegarde pour les données et la base

## 5. Procédure d'intégration dans l'infrastructure du client

1. Évaluez si le client dispose déjà d'un système CI/CD interne
2. Si oui, adaptez les workflows pour s'intégrer à leur système
3. Si non, configurez GitHub Actions comme décrit précédemment
4. Configurez les DNS internes pour accéder aux services
5. Mettez en place le monitoring et les alertes
