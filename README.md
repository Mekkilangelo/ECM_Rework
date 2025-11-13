# Synergia ECM Monitoring

> Système de gestion et surveillance des processus de traitement thermique industriel

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](/.github/workflows)
[![Docker](https://img.shields.io/badge/Docker-Ready-brightgreen)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## 📋 Description

**Synergia** est une application web de gestion complète pour les processus de cémentation et traitement thermique. Elle permet le suivi hiérarchique des clients, commandes, pièces et tests avec gestion de fichiers, rapports PDF automatisés et tableaux de bord analytiques.

### ✨ Fonctionnalités principales

- 🏢 **Gestion hiérarchique** : Clients → Commandes → Pièces → Tests
- 📊 **Tableaux de bord** : Visualisation et analyse des données
- 📄 **Rapports PDF** : Génération automatique avec signature électronique
- 🔐 **Authentification** : Système de rôles (admin, user, superuser)
- 📁 **Gestion de fichiers** : Upload et organisation de documents
- 🔍 **Recherche avancée** : Filtrage et recherche multi-critères
- 🌐 **API RESTful** : Backend Node.js/Express
- 💾 **Base de données** : MySQL 8.0 avec ORM Sequelize

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│              React 18 + Webpack                 │
│            (Interface utilisateur)              │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS (Nginx)
┌──────────────────▼──────────────────────────────┐
│                   Backend                       │
│           Node.js + Express API                 │
│          (Logique métier + Auth)                │
└──────────────────┬──────────────────────────────┘
                   │ Sequelize ORM
┌──────────────────▼──────────────────────────────┐
│               Base de données                   │
│                 MySQL 8.0                       │
│           (Stockage des données)                │
└─────────────────────────────────────────────────┘
```

**Stack technique :**
- **Frontend** : React, Webpack, Axios
- **Backend** : Node.js, Express, Sequelize
- **Base de données** : MySQL 8.0
- **Authentification** : JWT
- **Reverse Proxy** : Nginx (SSL)
- **Conteneurisation** : Docker + Docker Compose

---

## 🚀 Installation

### Prérequis

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4 GB RAM minimum
- 10 GB d'espace disque

### Déploiement rapide

```bash
# 1. Extraire le bundle de release
tar -xzf synergia-release-v*.tar.gz
cd synergia-release-v*

# 2. Configurer l'environnement
cp .env.example .env
nano .env  # Éditer les variables (mots de passe, URLs, etc.)

# 3. Lancer l'application
./deploy.sh
```

Le script de déploiement :
- ✅ Valide les prérequis
- ✅ Configure l'environnement
- ✅ Charge les images Docker
- ✅ Démarre les services
- ✅ Génère les certificats SSL

**Accès** : `https://<votre-ip-serveur>`

---

## 🛠️ Développement

### Installation locale

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (nouveau terminal)
cd client
npm install
npm start
```

**URLs de développement :**
- Frontend : http://localhost:3000
- API Backend : http://localhost:5001/api

### Tests

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration
```

---

## 📦 Structure du projet

```
ECM_Rework/
├── client/               # Application React (Frontend)
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── pages/        # Pages de l'application
│   │   ├── services/     # Services API
│   │   └── styles/       # Styles CSS
│   └── public/
├── server/               # API Node.js (Backend)
│   ├── controllers/      # Contrôleurs HTTP
│   ├── models/           # Modèles Sequelize
│   ├── routes/           # Routes Express
│   ├── services/         # Logique métier
│   ├── middleware/       # Middlewares
│   └── utils/            # Utilitaires
├── nginx/                # Configuration Nginx
├── .github/
│   ├── actions/          # Actions GitHub réutilisables
│   └── workflows/        # Pipelines CI/CD
├── deploy.sh             # Script de déploiement
├── rollback.sh           # Script de rollback
└── docker-compose.prod.yml
```

---

## 🔧 Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```env
# Base de données
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=synergia
DB_HOST=database
DB_USER=root
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=24h

# URLs
CLIENT_URL=https://your-domain.com
API_URL=https://your-domain.com/api
```

---

## 🤝 Contribution

### Workflow Git

```bash
# Branche de développement
git checkout dev
git pull origin dev

# Créer une feature branch
git checkout -b feature/ma-fonctionnalite

# Développer et commiter
git add .
git commit -m "feat: description de la fonctionnalité"

# Pousser et créer une PR
git push origin feature/ma-fonctionnalite
```

### CI/CD

Le projet utilise GitHub Actions :
- **`local.yml`** : Tests automatiques sur push vers `dev`
- **`release.yml`** : Génération du bundle sur merge vers `main`

Consultez [`.github/actions/README.md`](.github/actions/README.md) pour plus de détails.

---

## 📚 Documentation

- **API** : Documentation Swagger disponible à `/api/docs` (à venir)
- **Actions CI/CD** : [`.github/actions/README.md`](.github/actions/README.md)
- **Changelog** : [`CHANGELOG-CI-CD.md`](./CHANGELOG-CI-CD.md)

---

## 🔒 Sécurité

- 🔐 Authentification JWT avec refresh tokens
- 🛡️ Protection CSRF
- 🔒 HTTPS obligatoire en production
- 🚫 Rate limiting sur les API
- 📝 Logs d'audit des actions critiques

**Signaler une vulnérabilité** : Consultez [`SECURITY.md`](./SECURITY.md)

---

## 📄 Licence

© 2025 CIA/ECM - Tous droits réservés. Utilisation propriétaire.

---

## 👥 Équipe

Développé avec ❤️ par l'équipe ECM

**Mainteneur** : [@Mekkilangelo](https://github.com/Mekkilangelo)

---

## 🆘 Support

- 📧 **Email** : support@ecm-monitoring.com
- 🐛 **Issues** : [GitHub Issues](https://github.com/Mekkilangelo/ECM_Rework/issues)
- 📖 **Wiki** : [Documentation complète](https://github.com/Mekkilangelo/ECM_Rework/wiki)
