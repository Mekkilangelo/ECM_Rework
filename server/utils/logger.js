/**
 * Système de journalisation centralisé
 * Fournit des fonctions pour logger les différents niveaux d'information
 */

// Configuration selon l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Niveaux de log et leur priorité
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Vérifie si un niveau de log est activé selon la configuration
 * @param {string} level - Niveau de log à vérifier
 * @returns {boolean} True si le niveau est activé
 */
const shouldLog = (level) => {
  return LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL];
};

/**
 * Formate un message de log
 * @param {string} level - Niveau de log
 * @param {string} message - Message principal
 * @returns {string} Message formaté avec timestamp
 */
const formatMessage = (level, message) => {
  return `[${level.toUpperCase()}] ${new Date().toISOString()} - ${message}`;
};

/**
 * Système de journalisation
 */
const logger = {
  /**
   * Log de niveau debug (développement uniquement)
   * @param {string} message - Message à logger
   * @param {*} meta - Métadonnées additionnelles
   */
  debug: (message, meta = null) => {
    if (shouldLog('debug')) {
      console.log(formatMessage('DEBUG', message), meta || '');
    }
  },
  
  /**
   * Log de niveau info (informations générales)
   * @param {string} message - Message à logger
   * @param {*} meta - Métadonnées additionnelles
   */
  info: (message, meta = null) => {
    if (shouldLog('info')) {
      console.log(formatMessage('INFO', message), meta || '');
    }
  },
  
  /**
   * Log de niveau http (requêtes HTTP)
   * @param {string} message - Message à logger
   * @param {*} meta - Métadonnées additionnelles
   */
  http: (message, meta = null) => {
    if (shouldLog('http')) {
      console.log(formatMessage('HTTP', message), meta || '');
    }
  },
  
  /**
   * Log de niveau warn (avertissements)
   * @param {string} message - Message à logger
   * @param {*} meta - Métadonnées additionnelles
   */
  warn: (message, meta = null) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('WARN', message), meta || '');
    }
  },
  
  /**
   * Log de niveau error (erreurs)
   * @param {string} message - Message à logger
   * @param {*} meta - Métadonnées additionnelles
   */
  error: (message, meta = null) => {
    if (shouldLog('error')) {
      console.error(formatMessage('ERROR', message), meta || '');
    }
  }
};

module.exports = logger;
  