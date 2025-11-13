const { Sequelize } = require('sequelize');
const path = require('path');

// Configuration pour la base de données de test (SQLite en mémoire)
const testDbConfig = {
  dialect: 'sqlite',
  storage: ':memory:', // Base de données en mémoire pour les tests
  logging: false, // Désactiver les logs pendant les tests
  dialectOptions: {
    // Options spécifiques à SQLite
  }
};

// Configuration pour la base de données de développement/production
const devDbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'synergia',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  dialect: 'mysql',
  dialectOptions: {
    multipleStatements: true,
    decimalNumbers: true
  },
  logging: process.env.NODE_ENV !== 'production'
};

// Sélectionner la configuration selon l'environnement
const config = process.env.NODE_ENV === 'test' ? testDbConfig : devDbConfig;

module.exports = {
  development: devDbConfig,
  test: testDbConfig,
  production: devDbConfig,
  current: config
};
