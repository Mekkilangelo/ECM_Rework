# Guide de Déploiement - ECM Monitoring

## Prérequis sur les serveurs du client

- Docker Engine v20.10+ et Docker Compose v2.0+
- Accès réseau pour les différents services (ports 80, 5001, 3306)
- Capacité de stockage suffisante pour la base de données MySQL et les uploads (min. 10 GB recommandé)
- Git installé sur le serveur de déploiement

## Architecture de déploiement

L'application est composée de trois services principaux:
1. **Frontend (Client)** - Interface utilisateur servie par Caddy (port 80)
2. **Backend (Server)** - API Node.js (port 5001)
3. **Base de données** - MySQL 8.0 (port 3306)

## Configuration pour l'environnement de production

### 1. Variables d'environnement à configurer

Créez un fichier `.env` dans le répertoire racine du projet avec les variables suivantes (à adapter selon l'environnement):

```
# Base de données
MYSQL_ROOT_PASSWORD=<mot_de_passe_sécurisé>
MYSQL_DATABASE=synergy

# Backend
NODE_ENV=production
DB_HOST=database
DB_NAME=synergy
DB_USER=root
DB_PASSWORD=<même_mot_de_passe_que_MYSQL_ROOT_PASSWORD>
DB_SYNC_ALTER=false
JWT_SECRET=<clé_secrète_pour_l'authentification>
CLIENT_URL=<url_du_frontend>

# Autres configurations spécifiques au client
```

### 2. Configuration du réseau

Si l'application doit être accessible depuis l'extérieur, configurez:
- Un reverse proxy (comme Nginx) en amont
- Les certificats SSL appropriés
- Les règles de pare-feu pour sécuriser les accès

### 3. Persistance des données

Les données sont persistées via des volumes Docker:
- Base de données: volume `mysql_data`
- Uploads: mapping du dossier `./server/uploads` vers `/app/uploads` dans le conteneur

## Déploiement

### Déploiement manuel

```bash
# Cloner le dépôt (branche main pour production)
git clone <url_repository> -b main
cd <nom_du_projet>

# Configurer les variables d'environnement
cp .env.example .env
nano .env  # Modifier selon l'environnement

# Démarrer l'application
docker compose up -d

# Vérifier les logs
docker compose logs -f
```

### Déploiement via CI/CD

Voir la section "Workflow GitLab CI/CD" ci-dessous.

## Workflow GitLab CI/CD

Le workflow CI/CD est configuré pour suivre ces étapes:

1. **Build & Test** - Déclenché sur chaque commit sur la branche `dev`
   - Construction des images Docker
   - Exécution des tests automatisés
   - Déploiement en environnement de développement (si configuré)

2. **Déploiement en Production** - Déclenché après une pull request approuvée de `dev` vers `main`
   - Construction des images Docker avec tags de production
   - Push des images vers le registry Docker interne
   - Déploiement automatique en production

## Mise à jour de l'application

### Via le workflow CI/CD
1. Les développements sont poussés sur la branche `dev`
2. Après validation, une pull request est créée de `dev` vers `main`
3. L'approbation de la pull request déclenche le déploiement en production

### Mise à jour manuelle
```bash
cd <chemin_du_projet>
git pull
docker compose down
docker compose build
docker compose up -d
```

## Sauvegarde et restauration

### Sauvegarde de la base de données
```bash
docker compose exec database sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" synergy > /tmp/backup.sql'
docker cp $(docker compose ps -q database):/tmp/backup.sql ./backup_$(date +%Y%m%d).sql
```

### Restauration
```bash
docker cp ./backup.sql $(docker compose ps -q database):/tmp/backup.sql
docker compose exec database sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" synergy < /tmp/backup.sql'
```

## Support et maintenance

Pour toute question ou assistance concernant le déploiement:
- Contact principal: <votre_email>
- Documentation technique additionnelle: voir le dossier `/docs`
