# ECM Monitoring - Guide de déploiement simplifié

## 🚀 Déploiement automatique local

**Push sur `dev` →** Déploiement automatique sur votre machine !

```bash
git checkout dev
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin dev
```

Après le push, votre application sera automatiquement :
- ✅ Construite
- ✅ Testée  
- ✅ Déployée sur votre machine

**Accès direct :** http://localhost:3000

## 🔄 Workflow automatique

**Push sur `dev` →** Build, test et déploiement local automatique  
**Push sur `main` →** Déploie chez le client (quand serveur configuré)

## 🎯 Utilisation quotidienne

1. **Développer** sur la branche `dev`
2. **Push** → déploiement automatique local !
3. **Tester** sur http://localhost:3000
4. **Merge** `dev` → `main` quand prêt pour la prod

## 🔧 Commandes manuelles (si besoin)

```bash
# Démarrer manuellement
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

# Arrêter  
docker compose --env-file .env.dev -f docker-compose.dev.yml down

# Logs
docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f
```

## ⚙️ Configuration

- **Self-hosted runner** : Installé sur votre machine ✅
- **Déploiement local** : Automatique sur push dev ✅
- **Production future** : Serveur client (à configurer plus tard)
