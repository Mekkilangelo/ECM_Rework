# Serveur API - Documentation Technique

## Vue d'ensemble

Ce serveur API constitue le backend de l'application de monitoring ECM. Il fournit des points d'accès RESTful 
pour gérer toutes les ressources de l'application, avec une architecture modulaire, des contrôles d'accès 
avancés et un système de journalisation.

## Structure du projet

```
server/
├── app.js                   # Point d'entrée de l'application Express
├── server.js                # Configuration du serveur HTTP
├── config/                  # Configuration de l'application
├── controllers/             # Logique métier par ressource
├── docs/                    # Documentation technique
├── middleware/              # Middlewares Express
├── models/                  # Modèles de données Sequelize
├── routes/                  # Définition des routes API
├── scripts/                 # Scripts utilitaires
├── uploads/                 # Dossier pour les fichiers uploadés
└── utils/                   # Utilitaires et helpers
```

## Système d'authentification et d'autorisation

L'application utilise un système d'authentification basé sur JWT (JSON Web Tokens) avec une gestion 
avancée des droits d'accès.

### Types d'accès

- **Public**: Accessible sans authentification
- **Authentifié**: Nécessite une authentification valide
- **Écriture**: Nécessite des droits d'édition (admin ou superuser)
- **Administration**: Nécessite des droits administrateur
- **Super-administration**: Nécessite des droits super-administrateur

### Mode lecture seule global

L'application dispose d'un mode lecture seule global qui peut être activé par un super-administrateur.
Lorsque ce mode est actif, aucune opération de modification n'est autorisée, quelle que soit la personne.

Pour plus de détails, voir [la documentation des middlewares](./middleware/README.md).

## Modèles de données

L'application utilise Sequelize comme ORM pour interagir avec la base de données. Les principaux modèles sont:

- **User**: Gestion des utilisateurs et des rôles
- **Client**: Clients de l'entreprise
- **Order**: Commandes à traiter
- **Steel**: Types d'acier et propriétés
- **Furnace**: Fours et équipements
- **Test**: Tests et résultats
- **Part**: Pièces et composants
- **Node**: Structure hiérarchique (arborescence)
- **File**: Gestion des fichiers et documents

## API Endpoints

L'API est structurée de manière RESTful, avec des points d'accès organisés par ressource.
Chaque ressource dispose généralement des opérations standards:

- `GET /api/[resource]` - Liste tous les éléments
- `GET /api/[resource]/:id` - Récupère un élément spécifique
- `POST /api/[resource]` - Crée un nouvel élément
- `PUT /api/[resource]/:id` - Met à jour un élément existant
- `DELETE /api/[resource]/:id` - Supprime un élément

Des routes spécifiques sont disponibles pour des opérations particulières.

## Gestion des fichiers

L'application gère le stockage et l'association de fichiers (documents techniques, rapports, etc.)
aux différentes entités du système. Les fichiers sont stockés dans le système de fichiers
et leurs métadonnées sont enregistrées en base de données.

## Sécurité

Plusieurs mesures de sécurité sont en place:

- Authentification JWT avec gestion de l'inactivité
- Politiques d'autorisation strictes et centralisées
- Protection contre les attaques CSRF
- Limitation de débit (rate limiting)
- Validation des entrées utilisateur
- Journalisation des événements de sécurité

## Démarrage

Pour démarrer le serveur en mode développement:

```bash
npm run dev
```

Pour démarrer le serveur en mode production:

```bash
npm start
```