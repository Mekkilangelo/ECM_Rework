// Configuration de l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// Mock des modèles en utilisant le modèle existant mais avec SQLite
jest.mock('../models', () => {
  const { Sequelize } = require('sequelize');
  const dbConfig = {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  };
  
  const sequelize = new Sequelize(dbConfig);
  
  // Charger le modèle User
  const User = require('../models/user')(sequelize, Sequelize.DataTypes);
  
  // Synchroniser et exposer
  const models = {
    User,
    sequelize,
    Sequelize
  };
  
  return models;
});

const { setupTestDatabase, closeTestDatabase } = require('./helpers/database');

// Configuration globale avant tous les tests
beforeAll(async () => {
  // Configurer la base de données de test
  await setupTestDatabase();
});

// Nettoyage après tous les tests
afterAll(async () => {
  // Fermer la connexion à la base de données
  await closeTestDatabase();
});
