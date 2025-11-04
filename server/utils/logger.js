/**
 * Système de journalisation centralisé avec Winston
 * Fournit des fonctions pour logger avec rotation automatique des fichiers
 * et niveaux de logs configurables
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Configuration selon l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Créer le dossier de logs s'il n'existe pas
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuration des couleurs pour la console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    let logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    
    // Ajouter les métadonnées si présentes
    if (metadata && Object.keys(metadata).length > 0) {
      // Filtrer les métadonnées sensibles
      const sanitizedMetadata = { ...metadata };
      if (sanitizedMetadata.password) sanitizedMetadata.password = '***';
      if (sanitizedMetadata.token) sanitizedMetadata.token = '***';
      if (sanitizedMetadata.authorization) sanitizedMetadata.authorization = '***';
      
      logMessage += ` ${JSON.stringify(sanitizedMetadata)}`;
    }
    
    return logMessage;
  })
);

// Format pour la console avec couleurs
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  customFormat
);

// Transports - Destinations des logs
const transports = [];

// Console transport (toujours actif sauf en test)
if (!isTest) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL
    })
  );
}

// File transports (fichiers avec rotation)
if (!isTest) {
  // Logs combinés (tous les niveaux)
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: customFormat,
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Logs d'erreurs uniquement
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: customFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Logs HTTP pour le monitoring
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      format: customFormat,
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  );
}

// Création de l'instance Winston
const winstonLogger = winston.createLogger({
  level: LOG_LEVEL,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  transports,
  exitOnError: false // Ne pas quitter l'app sur erreur de log
});

/**
 * Interface de logging compatible avec l'ancienne API
 */
const logger = {
  /**
   * Log de niveau debug (développement uniquement)
   * @param {string} message - Message à logger
   * @param {Object} meta - Métadonnées additionnelles
   */
  debug: (message, meta = {}) => {
    winstonLogger.debug(message, meta);
  },
  
  /**
   * Log de niveau info (informations générales)
   * @param {string} message - Message à logger
   * @param {Object} meta - Métadonnées additionnelles
   */
  info: (message, meta = {}) => {
    winstonLogger.info(message, meta);
  },
  
  /**
   * Log de niveau http (requêtes HTTP)
   * @param {string} message - Message à logger
   * @param {Object} meta - Métadonnées additionnelles
   */
  http: (message, meta = {}) => {
    winstonLogger.http(message, meta);
  },
  
  /**
   * Log de niveau warn (avertissements)
   * @param {string} message - Message à logger
   * @param {Object} meta - Métadonnées additionnelles
   */
  warn: (message, meta = {}) => {
    winstonLogger.warn(message, meta);
  },
  
  /**
   * Log de niveau error (erreurs)
   * @param {string} message - Message à logger
   * @param {Object} meta - Métadonnées additionnelles
   */
  error: (message, meta = {}) => {
    winstonLogger.error(message, meta);
  },

  /**
   * Accès direct à l'instance Winston pour usage avancé
   */
  winston: winstonLogger
};

// Log du démarrage du système de logging
if (!isTest) {
  logger.info('Logger Winston initialisé', {
    level: LOG_LEVEL,
    environment: process.env.NODE_ENV || 'development',
    logsDirectory: logsDir
  });
}

module.exports = logger;
  