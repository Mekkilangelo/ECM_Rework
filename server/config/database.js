/**
 * Configuration de la connexion à la base de données
 */
require('dotenv').config();

// Paramètres de la base de données depuis les variables d'environnement
const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'synergy',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  dialect: 'mysql',
  dialectOptions: {
    multipleStatements: true,
    decimalNumbers: true
  },
  logging: process.env.NODE_ENV === 'development'
};

// Test de la connexion à la base de données
const testConnection = async () => {
  const { Sequelize } = require('sequelize');
  const testSequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      logging: config.logging
    }
  );
  
  try {
    await testSequelize.authenticate();
    console.log('Connexion à la base de données établie avec succès.');
    return true;
  } catch (error) {
    console.error('Impossible de se connecter à la base de données:', error);
    return false;
  } finally {
    await testSequelize.close();
  }
};

module.exports = {
  config,
  testConnection
};