/**
 * Configuration de base de données pour les tests d'intégration
 * Utilise une base SQLite en fichier partagée entre l'app et les tests
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Base SQLite de test en fichier (pas en mémoire) pour être partagée
const testDbPath = path.join(__dirname, '../../test-database.sqlite');

const testSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: testDbPath,
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
    paranoid: false
  }
});

module.exports = {
  testSequelize,
  testDbPath
};
