# Utilisation des images Docker publiées

Ce document explique comment utiliser les images Docker publiées sur GitHub Container Registry.

## Images disponibles

Les images suivantes sont publiées automatiquement par le workflow GitHub Actions:

- **Frontend**: `ghcr.io/mekkilangelo/ecm_rework-frontend:latest`
- **Backend**: `ghcr.io/mekkilangelo/ecm_rework-backend:latest`

## Authentification au GitHub Container Registry

Pour télécharger ces images, vous devez d'abord vous authentifier au GitHub Container Registry:

```bash
# Connexion à GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

Remplacez:
- `USERNAME` par votre nom d'utilisateur GitHub
- `$GITHUB_TOKEN` par un Personal Access Token avec les permissions `read:packages`

## Utilisation avec docker-compose

Pour utiliser ces images avec docker-compose, créez un fichier `docker-compose.prod.yml`:

```yaml
services:
  database:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-synergy}
      MYSQL_USER: ${MYSQL_USER:-}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "${DB_PORT:-3306}:3306"
    networks:
      - app-network

  backend:
    image: ghcr.io/mekkilangelo/ecm_rework-backend:latest
    restart: unless-stopped
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DB_HOST: ${DB_HOST:-database}
      DB_NAME: ${DB_NAME:-synergy}
      DB_USER: ${DB_USER:-root}
      DB_PASSWORD: ${DB_PASSWORD:-root}
      DB_SYNC_ALTER: ${DB_SYNC_ALTER:-"false"}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key}
      CLIENT_URL: ${CLIENT_URL:-http://localhost}
      SERVER_PORT: ${SERVER_PORT:-5001}
    volumes:
      - ./server/uploads:/app/uploads
    ports:
      - "${SERVER_PORT:-5001}:5001"
    depends_on:
      - database
    networks:
      - app-network

  frontend:
    image: ghcr.io/mekkilangelo/ecm_rework-frontend:latest
    restart: unless-stopped
    ports:
      - "${CLIENT_PORT:-80}:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mysql_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

## Exécution

Pour exécuter l'application avec ces images précompilées:

```bash
# Copier et configurer les variables d'environnement
cp .env.example .env
nano .env  # Modifier selon l'environnement

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d
```

## Tags disponibles

En plus du tag `latest`, les images sont également taguées avec:

- Le nom de la branche: `ghcr.io/mekkilangelo/ecm_rework-frontend:main` ou `ghcr.io/mekkilangelo/ecm_rework-frontend:dev`
- Le SHA du commit: `ghcr.io/mekkilangelo/ecm_rework-frontend:sha-abcdef123456...`

Pour utiliser une version spécifique, remplacez `latest` par le tag souhaité.
