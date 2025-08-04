# Structure des Tests

Ce projet utilise une architecture de tests organisée en deux catégories principales : **tests unitaires** et **tests d'intégration**.

## 📁 Structure des Dossiers

```
tests/
├── unit/                          # Tests unitaires (isolés)
│   ├── controllers/               # Tests des contrôleurs
│   │   ├── authController.unit.test.js
│   │   └── clientController.unit.test.js
│   ├── middleware/                # Tests des middlewares
│   │   └── auth.unit.test.js
│   └── setup.js                   # Configuration globale des tests unitaires
├── integration/                   # Tests d'intégration (complets)
│   ├── auth/                      # Tests d'authentification complets
│   │   └── auth.test.js
│   ├── clients/                   # Tests CRUD clients complets
│   │   └── client.test.js
│   ├── app.test.js               # Tests de l'application complète
│   ├── env.js                    # Variables d'environnement
│   └── setup.js                 # Configuration des tests d'intégration
└── examples/                     # Exemples de tests (référence)
```

## 🔧 Configuration

### Fichiers de Configuration Jest

- `jest.unit.config.js` - Configuration pour les tests unitaires
- `jest.integration.config.js` - Configuration pour les tests d'intégration
- `jest.config.js` - Configuration générale (existante)

## 🧪 Types de Tests

### Tests Unitaires (`tests/unit/`)

**Objectif :** Tester des composants individuels de manière isolée.

**Caractéristiques :**
- ✅ Rapides à exécuter (< 1s par test)
- ✅ Pas de base de données
- ✅ Pas de serveur HTTP
- ✅ Mocks de toutes les dépendances
- ✅ Tests de logique métier pure

**Exemple :** Test d'un contrôleur avec mocks
```javascript
// Mock des dépendances
jest.mock('../../../models');
jest.mock('../../../utils/logger');

test('should return 400 when required fields are missing', async () => {
  const mockReq = { body: {} };
  const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  
  await clientController.createClient(mockReq, mockRes);
  
  expect(mockRes.status).toHaveBeenCalledWith(400);
});
```

### Tests d'Intégration (`tests/integration/`)

**Objectif :** Tester l'interaction complète entre tous les composants.

**Caractéristiques :**
- ✅ Base de données en mémoire (SQLite)
- ✅ Serveur HTTP complet
- ✅ Middleware d'authentification
- ✅ Tests end-to-end des API
- ✅ Validation complète des workflows

**Exemple :** Test d'API complète
```javascript
test('should create client with valid data and admin role', async () => {
  const response = await request(app)
    .post('/api/clients')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(validClientData);
    
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
});
```

## 🚀 Commands de Test

### Exécuter Tous les Tests
```bash
npm test                    # Tests d'intégration (comportement existant)
npm run test:all           # Tests unitaires + intégration
```

### Tests Unitaires
```bash
npm run test:unit          # Exécuter les tests unitaires
npm run test:watch:unit    # Tests unitaires en mode watch
npm run test:coverage:unit # Tests unitaires avec couverture
```

### Tests d'Intégration
```bash
npm run test:integration        # Exécuter les tests d'intégration
npm run test:watch:integration  # Tests d'intégration en mode watch
```

### Modes Watch
```bash
npm run test:watch         # Mode watch général
npm run test:watch:unit    # Watch des tests unitaires uniquement
npm run test:watch:integration # Watch des tests d'intégration uniquement
```

## 📊 Couverture de Code

### Tests Unitaires
- **Objectif :** 80% de couverture minimum
- **Focus :** Logique métier, validation, gestion d'erreurs
- **Rapport :** `coverage/unit/`

### Tests d'Intégration
- **Objectif :** Validation des workflows complets
- **Focus :** Intégration des composants, APIs end-to-end
- **Couverture :** Désactivée pour éviter les conflits

## 🎯 Bonnes Pratiques

### Tests Unitaires
1. **Isolation complète** - Mocker toutes les dépendances
2. **Tests rapides** - Chaque test < 10ms
3. **Focus logique** - Tester la logique métier pure
4. **Noms descriptifs** - Décrire exactement ce qui est testé

### Tests d'Intégration
1. **Environnement réaliste** - Base de données + serveur complet
2. **Données de test** - Créer des jeux de données représentatifs
3. **Nettoyage** - Nettoyer la DB après chaque test
4. **Workflows complets** - Tester les parcours utilisateur complets

## 🔍 Debugging

### Tests Unitaires
```bash
# Debug avec verbose
npm run test:unit -- --verbose

# Test spécifique
npm run test:unit -- --testNamePattern="should return 400"
```

### Tests d'Intégration
```bash
# Debug avec logs détaillés
DEBUG=* npm run test:integration

# Test d'un fichier spécifique
npm run test:integration -- tests/integration/auth/auth.test.js
```

## 📝 Ajout de Nouveaux Tests

### Pour ajouter un test unitaire :
1. Créer le fichier dans `tests/unit/[category]/`
2. Nommer avec `.unit.test.js`
3. Mocker toutes les dépendances
4. Tester la logique isolée

### Pour ajouter un test d'intégration :
1. Créer le fichier dans `tests/integration/[feature]/`
2. Nommer avec `.test.js`
3. Utiliser la base de données test
4. Tester le workflow complet

## 📈 Métriques Actuelles

- **Tests Unitaires :** 30 tests (nouveaux)
- **Tests d'Intégration :** 39 tests (existants)
- **Couverture Unitaire :** Objectif 80%
- **Temps d'Exécution :**
  - Unitaires : ~2s
  - Intégration : ~15s

Cette structure offre une couverture complète avec des tests rapides (unitaires) pour le développement quotidien et des tests complets (intégration) pour la validation finale.
