/**
 * Initialisation de la base de données
 * Gère la connexion et la synchronisation des modèles
 */
const database = require('../config/database');
const logger = require('../utils/logger');
const { runMigrations } = require('./migrator');

/**
 * Initialiser la connexion et synchroniser les modèles
 */
async function initializeDatabase() {
  try {
    // 1. Tester la connexion
    const isConnected = await database.testConnection();
    if (!isConnected) {
      throw new Error('Échec de la connexion à la base de données');
    }

    // 2. Charger les modèles (force le require de models/index.js)
    require('../models');
    logger.info('📦 Modèles Sequelize chargés');

    // 3. Synchroniser les modèles
    await database.syncModels();

    // 4. Exécuter les migrations en attente
    await runMigrations(database.getSequelize());

    return database;
  } catch (error) {
    logger.error('❌ Erreur d\'initialisation de la base de données', { error: error.message });
    throw error;
  }
}

module.exports = { initializeDatabase };
