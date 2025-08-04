/**
 * Configuration d'environnement pour les tests d'intégration
 */

// Configuration spécifique aux tests d'intégration
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test-jwt-secret-integration';
process.env.LOG_LEVEL = 'error'; // Réduire les logs pendant les tests
