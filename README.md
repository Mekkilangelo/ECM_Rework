# ECM Monitoring

Application de surveillance pour les processus de traitement thermique.

## Démarrage rapide

```bash
# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env selon votre environnement

# Démarrer les conteneurs (utiliser la commande disponible sur votre système)
docker-compose up -d    # Ancienne syntaxe avec tiret
# OU
docker compose up -d    # Nouvelle syntaxe sans tiret (Docker v20.10+)
```

## Accès aux services

- Frontend: http://localhost:80
- Backend API: http://localhost:5001

## Commandes Docker

Selon votre version de Docker, utilisez l'une des syntaxes suivantes:

### Docker récent (v20.10+)
```bash
docker compose up -d        # Démarrer les services
docker compose down         # Arrêter les services
docker compose logs -f      # Afficher les logs en temps réel
docker compose build        # Reconstruire les images
```

### Docker plus ancien
```bash
docker-compose up -d        # Démarrer les services
docker-compose down         # Arrêter les services
docker-compose logs -f      # Afficher les logs en temps réel
docker-compose build        # Reconstruire les images
```

## Développement local

```bash
# Backend
cd server && npm run dev

# Frontend  
cd client && npm start
```

## Déploiement et CI/CD

Cette application est configurée avec un pipeline CI/CD qui automatise la construction, les tests et le déploiement:

1. **Développement** - Tout le code est poussé sur la branche `dev`
2. **Tests** - Les tests automatisés s'exécutent via GitHub Actions
3. **Déploiement** - Après validation, le code est fusionné dans `main` pour déploiement

### Configuration initiale du CI/CD

Par défaut, les workflows GitHub Actions sont configurés pour effectuer uniquement la construction et les tests sans déploiement. Pour activer les fonctionnalités complètes de CI/CD:

1. Configurez les secrets suivants dans les paramètres GitHub:
   - `PUSH_TO_REGISTRY: true` - Pour activer le push vers un registry Docker
   - `REGISTRY_USERNAME` et `REGISTRY_PASSWORD` - Identifiants du registry
   - `DEPLOY_TO_PRODUCTION: true` - Pour activer le déploiement SSH
   - `PROD_HOST`, `PROD_USERNAME`, `PROD_SSH_KEY` - Pour la connexion SSH

Pour plus de détails, consultez:
- [Guide de déploiement](./DEPLOYMENT.md) - Instructions pour déployer l'application
- [Guide CI/CD](./CI_CD_GUIDE.md) - Explication détaillée du processus CI/CD
- [Guide de contribution](./CONTRIBUTING.md) - Workflow Git et processus de développement
- [Dépannage](./TROUBLESHOOTING.md) - Solutions aux problèmes courants

## Architecture

L'application est composée de trois services principaux:
1. **Frontend** - Interface utilisateur React servie par Caddy
2. **Backend** - API Node.js avec Express
3. **Base de données** - MySQL 8.0