/**
 * Configuration Jest pour les tests d'intégration
 * Tests avec base de données et services complets
 */

module.exports = {
  displayName: 'Integration Tests',
  testMatch: [
    '**/tests/integration/**/*.test.js',
    '**/tests/integration/**/*.integration.test.js'
  ],
  testEnvironment: 'node',
  
  // Setup pour les tests d'intégration
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.js'],
  
  // Timeouts plus longs pour les tests d'intégration
  testTimeout: 30000,
  
  // Pas de mocks automatiques pour les tests d'intégration
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
  
  // Configuration pour les modules
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Collecte de couverture pour les tests d'intégration
  collectCoverage: false, // Désactivé pour éviter les conflits avec les tests unitaires
  
  // Mode séquentiel pour éviter les conflits de base de données
  maxWorkers: 1,
  
  // Verbose pour plus de détails
  verbose: true,
  
  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/tests/integration/env.js']
};
