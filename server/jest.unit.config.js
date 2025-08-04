/**
 * Configuration Jest pour les tests unitaires
 * Tests isolés sans base de données ni services externes
 */

module.exports = {
  displayName: 'Unit Tests',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/unit/**/*.unit.test.js'
  ],
  testEnvironment: 'node',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Configuration pour les mocks
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],
  
  // Collecte de couverture pour les tests unitaires
  collectCoverage: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Seuils de couverture pour les tests unitaires
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Configuration des modules
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Verbose pour plus de détails
  verbose: true
};
