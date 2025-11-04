/**
 * Gestion de l'arrêt gracieux du serveur
 * Ferme proprement les connexions lors de l'arrêt
 */
const logger = require('../utils/logger');
const database = require('../config/database');

/**
 * Configurer les handlers d'arrêt gracieux
 */
function setupGracefulShutdown(server) {
  // Fonction d'arrêt
  const shutdown = async (signal) => {
    logger.info(`📡 Signal ${signal} reçu, arrêt gracieux en cours...`);

    // Arrêter d'accepter de nouvelles connexions
    server.close(async () => {
      logger.info('🔌 Serveur HTTP fermé');

      try {
        // Fermer la connexion à la base de données
        await database.close();
        
        logger.info('✅ Arrêt gracieux terminé');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Erreur lors de l\'arrêt gracieux', { error: error.message });
        process.exit(1);
      }
    });

    // Force l'arrêt après 10 secondes
    setTimeout(() => {
      logger.error('⏰ Timeout: arrêt forcé');
      process.exit(1);
    }, 10000);
  };

  // Écouter les signaux d'arrêt
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Gérer les rejections non capturées
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection', { 
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception', { 
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });

  logger.info('✅ Handlers d\'arrêt gracieux configurés');
}

module.exports = { setupGracefulShutdown };
