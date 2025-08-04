# ECM Monitoring

## Démarrage

```bash
docker-compose up -d
```

Accès :
- Frontend: http://localhost:80
- Backend: http://localhost:5001

## Commandes

```bash
docker-compose up -d        # Démarrer
docker-compose down         # Arrêter
docker-compose logs -f      # Voir les logs
docker-compose build       # Rebuilder
```

## Développement

```bash
# Backend
cd server && npm run dev

# Frontend  
cd client && npm start
```