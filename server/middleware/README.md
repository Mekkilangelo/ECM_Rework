# Système de Middlewares d'Authentification et d'Autorisation

## Vue d'ensemble

Cette documentation présente l'architecture du système de middlewares d'authentification et d'autorisation
utilisé dans l'application. Ce système est conçu pour être:

- **Modulaire**: Composé de petits middlewares spécialisés
- **Combinable**: Les middlewares peuvent être assemblés pour créer des politiques d'accès complexes
- **Évolutif**: Facile à étendre pour de nouveaux rôles ou règles
- **Cohérent**: Application uniforme des règles de sécurité

## Structure des fichiers

Le système est réparti en plusieurs fichiers, chacun ayant une responsabilité précise:

- **auth.js**: Middlewares fondamentaux pour l'authentification et les vérifications de rôles
- **accessControl.js**: Combinaisons standardisées de middlewares pour différents niveaux d'accès
- **globalReadOnlyChecker.js**: Middleware spécifique pour vérifier le mode lecture seule global

## Middlewares fondamentaux (auth.js)

Ces middlewares sont les briques de base du système:

- `authenticate`: Vérifie l'authenticité du token JWT et charge les données utilisateur
- `validateRefreshToken`: Version spéciale pour le rafraîchissement des tokens expirés
- `authorizeRoles`: Fonction factory pour vérifier si l'utilisateur a un rôle spécifique
- `requireAdmin`: Vérifie si l'utilisateur a des droits d'administration
- `requireSuperUser`: Vérifie si l'utilisateur a des droits de super-administrateur
- `requireEditRights`: Vérifie si l'utilisateur a des droits d'édition

## Middlewares combinés (accessControl.js)

Ces middlewares assemblent les briques fondamentales en politiques d'accès cohérentes:

- `publicAccess`: Aucune vérification, pour les routes publiques
- `readAccess`: Authentification requise, pour les routes de lecture
- `writeAccess`: Authentification + droits d'édition + vérification mode lecture seule
- `adminAccess`: Authentification + droits d'administration
- `superUserAccess`: Authentification + droits de super-administrateur
- `adminWriteAccess`: Authentification + droits d'administration + vérification mode lecture seule
- `superUserWriteAccess`: Authentification + droits de super-administrateur + vérification mode lecture seule

## Utilisation dans les routes

L'utilisation standard dans les fichiers de routes est la suivante:

```javascript
const { readAccess, writeAccess, adminAccess } = require('../middleware/accessControl');

// Route publique
router.get('/public-resource', publicAccess, controller.method);

// Route de lecture (authentifiée)
router.get('/resources', readAccess, controller.method);

// Route d'écriture (authentifiée + droits d'édition)
router.post('/resources', writeAccess, controller.method);

// Route administrative
router.get('/admin-resources', adminAccess, controller.method);
```

## Mode lecture seule global

Le système intègre un mécanisme de mode lecture seule global qui:

- Est activable via la configuration système
- Empêche toutes les opérations de modification, même pour les administrateurs
- Est vérifié par les middlewares `writeAccess`, `adminWriteAccess` et `superUserWriteAccess`

Ce mode est utile pour les périodes de maintenance, de gel des modifications ou lors d'opérations
critiques sur le système.

## Bonnes pratiques

- Utiliser les middlewares combinés de `accessControl.js` plutôt que ceux de `auth.js` directement
- Être cohérent dans le choix des middlewares pour des opérations similaires
- Commenter clairement les groupes de routes selon leur niveau d'accès
- Ne pas oublier de vérifier le mode lecture seule global pour toutes les opérations de modification
