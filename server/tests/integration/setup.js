/**
 * Setup pour les tests d'intégration
 * Configuration de base pour l'environnement de test
 */

// Configuration d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';

// Setup global simplifié - chaque test gère sa propre base de données
beforeAll(async () => {
  
});

// Cleanup global
afterAll(async () => {
  
});

// Configuration des timeouts
jest.setTimeout(30000);
