/**
 * Point d'entrée principal du serveur
 * Architecture KISS : Simple, Claire, Modulaire
 */

// CRITIQUE : Charger les variables d'environnement EN PREMIER
require('dotenv').config();

const app = require('./app');
const logger = require('./utils/logger');

// Modules de démarrage
const { initializeDatabase } = require('./startup/database');
const { setupGracefulShutdown } = require('./startup/graceful-shutdown');

// Port de l'application
const PORT = process.env.PORT || 5001;

/**
 * Démarrer le serveur
 */
async function startServer() {
  try {
    logger.info('🚀 Démarrage du serveur ECM Monitoring...');
    logger.info(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);

    // 1. Initialiser la base de données
    await initializeDatabase();

    // 2. Démarrer le serveur HTTP
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`✅ Serveur démarré sur le port ${PORT}`);
      logger.info(`🌐 API accessible sur http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'production') {
        logger.info(`🌐 Application accessible sur http://localhost:${PORT}`);
      }
    });

    // 3. Configurer l'arrêt gracieux
    setupGracefulShutdown(server);

    logger.info('✨ Application prête à recevoir des requêtes');

  } catch (error) {
    logger.error('💥 Erreur fatale lors du démarrage', { 
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Lancer le serveur
startServer();

