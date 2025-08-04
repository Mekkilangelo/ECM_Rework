# Guide de Tests Automatisés - ECM Monitoring

## Vue d'ensemble

Ce document présente la mise en place des tests automatisés pour l'application ECM Monitoring, en se concentrant sur les tests d'authentification et de sécurité.

## Architecture des Tests

### Structure des Fichiers
```
server/tests/
├── setup.js                    # Configuration globale Jest
├── jest.config.js              # Configuration Jest 
├── app.test.js                # Test de base de l'application ✅
├── auth/
│   └── auth.test.js           # Tests d'authentification fonctionnels ✅
├── clients/
│   └── client.test.js         # Tests de gestion des clients ✅
├── helpers/
│   ├── database.js            # Utilitaires base de données test
│   └── testUtils.js           # Fonctions utilitaires
└── mocks/
    └── services.js            # Mocks des services
```

### Technologies Utilisées

- **Jest** : Framework de test principal
- **Supertest** : Tests d'API HTTP
- **SQLite** : Base de données en mémoire pour les tests
- **bcrypt** : Tests de hachage des mots de passe
- **cross-env** : Compatibilité Windows/Linux

## Tests Actuellement Fonctionnels

### Tests d'Authentification (`auth.test.js`)

#### 📝 Tests de Registration
- ✅ **Premier utilisateur** : Doit être créé comme superuser
- ✅ **Mot de passe court** : Doit être refusé (< 6 caractères)
- ✅ **Username manquant** : Doit retourner une erreur 400
- ✅ **Validation des données** : Vérification des champs requis

#### 🔐 Tests de Login
- ✅ **Identifiants valides** : Login réussi avec token JWT
- ✅ **Mot de passe invalide** : Refus avec délai de sécurité (2s)
- ✅ **Identifiants manquants** : Gestion des erreurs appropriée
- ✅ **Sécurité** : Délai anti-brute force implémenté

### Tests de Clients (`client.test.js`)

#### 👥 Tests de Création de Clients (8 tests)
- ✅ **Création client complet** : Avec tous les champs valides
- ✅ **Nom manquant** : Doit retourner une erreur 400
- ✅ **Pays manquant** : Doit retourner une erreur 400
- ✅ **Code client en doublon** : Doit être refusé
- ✅ **Champs optionnels** : Création avec nom et pays seulement
- ✅ **Pays invalide** : Validation des énumérations
- ✅ **Code unique** : Validation de l'unicité
- ✅ **Client minimal** : Création avec champs requis seulement

#### 📋 Tests de Lecture de Clients (4 tests)
- ✅ **Liste des clients** : Récupération avec pagination
- ✅ **Liste vide** : Gestion du cas sans clients
- ✅ **Client spécifique** : Récupération par ID
- ✅ **Client inexistant** : Gestion erreur 404

#### ✏️ Tests de Modification de Clients (12 tests)
- ✅ **Authentification requise** : Tests de sécurité
- ✅ **Rôle admin requis** : Vérification des permissions
- ✅ **Modification nom** : Update du nom client
- ✅ **Modification pays** : Update avec validation
- ✅ **Modification ville** : Update champ city
- ✅ **Modification code** : Update client_code
- ✅ **Modification groupe** : Update client_group
- ✅ **Modification adresse** : Update address
- ✅ **Modification multiple** : Update plusieurs champs simultanément
- ✅ **Validation pays** : Contrôle énumération sur update
- ✅ **Doublon code** : Prévention doublons sur update
- ✅ **Client inexistant** : Gestion erreur 404 sur update

#### 🗑️ Tests de Suppression de Clients (5 tests)
- ✅ **Authentification requise** : Tests de sécurité
- ✅ **Rôle admin requis** : Vérification des permissions
- ✅ **Suppression réussie** : Suppression avec vérification
- ✅ **Client inexistant** : Gestion erreur 404 sur delete
- ✅ **Suppression de la liste** : Vérification retrait de la liste

#### 🔐 Tests d'Autorisation (3 tests)
- ✅ **Création protégée** : Authentification requise pour POST
- ✅ **Création admin** : Rôle admin/superuser requis pour POST
- ✅ **Permissions CRUD** : Vérification rôles pour toutes opérations

## Configuration de Sécurité

### Mesures de Protection Testées
1. **Délai anti-brute force** : 2 secondes pour les échecs de connexion
2. **Hachage des mots de passe** : bcrypt avec salt
3. **Validation JWT** : Tokens sécurisés
4. **Validation des données** : Contrôles des entrées utilisateur
5. **Validation métier** : Contraintes d'unicité, champs requis
6. **Validation enum** : Contrôle des valeurs autorisées
7. **Contrôle d'accès** : Authentification et autorisation par rôle
8. **Protection CRUD** : Vérification permissions pour Create/Update/Delete

## Commandes de Test

### Exécuter tous les tests
```bash
npm test
```

### Exécuter avec couverture de code
```bash
npm run test:coverage
```

### Exécuter en mode watch
```bash
npm run test:watch
```

### Exécuter un test spécifique
```bash
npm test -- tests/auth/auth.test.js
npm test -- tests/clients/client.test.js
```

## Résultats de Couverture Actuels

```
Test Suites: 3 passed, 3 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        8.022 s

PASS tests/auth/auth.test.js (6 tests)
PASS tests/clients/client.test.js (32 tests)
PASS tests/app.test.js (1 test)
```

### Détail des Tests
- **6 tests d'authentification** : Registration, login, sécurité
- **32 tests de clients** : CRUD complet avec permissions et validations
- **1 test application** : Configuration de base
- **Total : 39 tests** - Tous passent ✅

## Plan de Test Complet

### ✅ Phase 1 : Tests de Base (Terminée)
- [x] Tests d'authentification avec validation et sécurité
- [x] Tests de gestion des clients (CRUD complet)
- [x] Gestion des erreurs et validation des données
- [x] Tests de sécurité et contraintes métier
- [x] Tests d'autorisation et contrôle d'accès par rôle
- [x] Tests de modification de tous les champs clients
- [x] Tests de suppression avec vérifications

### 🔄 Phase 2 : Extension des Tests (Optionnelle)
- [ ] Tests de middleware d'authentification avancés
- [ ] Tests de permissions et rôles étendus
- [ ] Tests d'autorisation par endpoint spécifiques
- [ ] Tests de session et tokens avancés

### 📋 Phase 3 : Tests Métier (Planifiée)
- [ ] Tests des modèles (Client, Order, Part, etc.)
- [ ] Tests des contrôleurs métier
- [ ] Tests d'intégration base de données
- [ ] Tests de validation des données métier

### 🚀 Phase 4 : Tests End-to-End (Planifiée)
- [ ] Tests de workflows complets
- [ ] Tests d'intégration frontend/backend
- [ ] Tests de performance
- [ ] Tests de charge

## Configuration Base de Données Test

### Environnement Isolé
- **Base de données** : SQLite en mémoire (`:memory:`)
- **Isolation** : Chaque test a une DB propre
- **Performance** : Très rapide, pas de persistance
- **Compatibilité** : Fonctionne sur tous les OS

### Avantages
1. **Rapidité** : Tests très rapides
2. **Isolation** : Pas d'interférence entre tests
3. **Simplicité** : Pas de configuration externe
4. **CI/CD friendly** : Fonctionne dans tous les environnements

## Cas de Test Avancés

### Tests de Sécurité Implémentés
```javascript
// Exemple de test anti-injection SQL
test('should prevent SQL injection in login', async () => {
  const maliciousLogin = {
    username: "admin' OR '1'='1",
    password: "password' OR '1'='1"
  };
  // Sequelize protège automatiquement
});
```

### Tests de Validation Métier
```javascript
// Exemple de test de validation client
test('should fail with duplicate client_code', async () => {
  const clientData = {
    name: 'First Company',
    client_code: 'DUPLICATE001',
    country: 'FRANCE'
  };
  
  // Créer le premier client
  await request(app).post('/api/clients').send(clientData).expect(201);
  
  // Tenter de créer un doublon
  const response = await request(app)
    .post('/api/clients')
    .send({ ...clientData, name: 'Second Company' })
    .expect(400);
    
  expect(response.body.message).toBe('Un client avec ce code existe déjà');
});
```

### Tests d'Autorisation et Permissions
```javascript
// Exemple de test de vérification des rôles
test('should require admin/superuser role for client creation', async () => {
  const clientData = {
    name: 'Test Client',
    country: 'FRANCE'
  };

  // Tentative avec utilisateur standard (doit échouer)
  const response = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${userToken}`)
    .send(clientData)
    .expect(403);

  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message', 'Droits insuffisants pour cette opération');
});

// Exemple de test de modification de champ spécifique
test('should update client name', async () => {
  const updateData = { name: 'New Client Name' };

  const response = await request(app)
    .put(`/api/clients/${testClientId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send(updateData)
    .expect(200);

  expect(response.body.data).toHaveProperty('name', 'New Client Name');
  expect(response.body.data).toHaveProperty('client_code', 'TC001'); // Autres champs inchangés
});
```

## Recommandations

### Pour l'Amélioration Continue
1. **Augmenter la couverture** : Objectif 80%+ pour les parties critiques
2. **Tests d'intégration** : Tester les workflows complets
3. **Tests de régression** : Automatiser après chaque bug fix
4. **Documentation** : Maintenir ce guide à jour

### Meilleures Pratiques
1. **Un test = un concept** : Tests focalisés et clairs
2. **Noms descriptifs** : `should register first user as superuser`
3. **Isolation** : Chaque test indépendant
4. **Données de test** : Utiliser des fixtures réutilisables

### Intégration CI/CD
```bash
# Dans votre pipeline
npm ci
npm run test:coverage
# Échouer si couverture < 70%
```

## Problèmes Connus et Solutions

### Base de Données Test vs Production
- **Problème** : Différences SQLite vs MySQL
- **Solution** : Tests d'intégration sur environnement similaire à la prod

### Performance Tests
- **Problème** : Tests lents avec base externe
- **Solution** : Séparation tests unitaires (rapides) / intégration (plus lents)

## Contact et Support

Pour toute question sur les tests :
1. Consulter la documentation Jest
2. Vérifier les logs d'erreur avec `npm test -- --verbose`
3. Utiliser `console.log()` pour débugger les tests
