/**
 * Système de journalisation centralisé avec Winston
 * Fournit des fonctions pour logger avec rotation automatique des fichiers
 * et niveaux de logs configurables
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

// Configuration selon l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Créer le dossier de logs s'il n'existe pas
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Icônes et couleurs par niveau
const levelConfig = {
  error: { icon: '❌', color: chalk.red.bold, bg: chalk.bgRed.white },
  warn: { icon: '⚠️ ', color: chalk.yellow.bold, bg: chalk.bgYellow.black },
  info: { icon: 'ℹ️ ', color: chalk.blue, bg: chalk.bgBlue.white },
  http: { icon: '🌐', color: chalk.magenta, bg: chalk.bgMagenta.white },
  debug: { icon: '🐛', color: chalk.gray, bg: chalk.bgGray.white },
  success: { icon: '✅', color: chalk.green.bold, bg: chalk.bgGreen.white }
};

// Format personnalisé pour les fichiers (sans couleur)
const fileFormat = winston.format.combine(
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

// Format amélioré pour la console avec couleurs et icônes
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const config = levelConfig[level] || levelConfig.info;
    
    // Formater le timestamp
    const timeStr = chalk.gray(`[${timestamp}]`);
    
    // Formater le niveau avec icône
    const levelStr = `${config.icon} ${config.bg(` ${level.toUpperCase()} `)}`;
    
    // Message principal
    let logMessage = `${timeStr} ${levelStr} ${config.color(message)}`;
    
    // Ajouter les métadonnées formatées
    if (metadata && Object.keys(metadata).length > 0) {
      // Filtrer les métadonnées sensibles
      const sanitizedMetadata = { ...metadata };
      if (sanitizedMetadata.password) sanitizedMetadata.password = '***';
      if (sanitizedMetadata.token) sanitizedMetadata.token = '***';
      if (sanitizedMetadata.authorization) sanitizedMetadata.authorization = '***';
      
      // Formater les métadonnées importantes
      const metaParts = [];
      
      if (sanitizedMetadata.statusCode) {
        const statusColor = sanitizedMetadata.statusCode >= 400 ? chalk.red : chalk.green;
        metaParts.push(statusColor(`[${sanitizedMetadata.statusCode}]`));
      }
      
      if (sanitizedMetadata.duration !== undefined) {
        const duration = sanitizedMetadata.duration;
        const durationColor = duration > 1000 ? chalk.red : duration > 500 ? chalk.yellow : chalk.green;
        metaParts.push(durationColor(`⏱️  ${duration}ms`));
      }
      
      if (sanitizedMetadata.method) {
        const methodColors = {
          GET: chalk.blue,
          POST: chalk.green,
          PUT: chalk.yellow,
          DELETE: chalk.red,
          PATCH: chalk.cyan
        };
        const methodColor = methodColors[sanitizedMetadata.method] || chalk.white;
        metaParts.push(methodColor(sanitizedMetadata.method));
      }
      
      if (sanitizedMetadata.url) {
        metaParts.push(chalk.cyan(sanitizedMetadata.url));
      }
      
      if (sanitizedMetadata.userId) {
        metaParts.push(chalk.magenta(`👤 User #${sanitizedMetadata.userId}`));
      }
      
      if (sanitizedMetadata.username) {
        metaParts.push(chalk.magenta(`@${sanitizedMetadata.username}`));
      }
      
      // Afficher les parties formatées
      if (metaParts.length > 0) {
        logMessage += `\n  ${metaParts.join(' ')}`;
      }
      
      // Afficher les détails supplémentaires si présents
      const additionalMeta = { ...sanitizedMetadata };
      delete additionalMeta.statusCode;
      delete additionalMeta.duration;
      delete additionalMeta.method;
      delete additionalMeta.url;
      delete additionalMeta.userId;
      delete additionalMeta.username;
      
      if (Object.keys(additionalMeta).length > 0) {
        logMessage += `\n  ${chalk.gray(JSON.stringify(additionalMeta, null, 2))}`;
      }
    }
    
    return logMessage;
  })
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
      format: fileFormat,
      level: 'debug',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Logs d'erreurs uniquement
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      format: fileFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Logs HTTP pour le monitoring
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'http.log'),
      format: fileFormat,
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
   * Log de niveau success (opérations réussies importantes)
   * @param {string} message - Message à logger
   * @param {Object} meta - Métadonnées additionnelles
   */
  success: (message, meta = {}) => {
    winstonLogger.info(message, { ...meta, level: 'success' });
  },

  /**
   * Accès direct à l'instance Winston pour usage avancé
   */
  winston: winstonLogger
};

// Log du démarrage du système de logging
if (!isTest) {
  logger.success('Logger Winston initialisé', {
    level: LOG_LEVEL,
    environment: process.env.NODE_ENV || 'development',
    logsDirectory: logsDir
  });
}

module.exports = logger;
  