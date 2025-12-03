/**
 * Utilitaire de logging centralisé
 * Permet de contrôler les logs selon l'environnement et les catégories
 */

const isDev = process.env.NODE_ENV === 'development';

// Configuration des niveaux de log par catégorie
const LOG_CONFIG = {
  // Services API
  api: {
    enabled: isDev,
    level: 'info' // 'debug', 'info', 'warn', 'error'
  },
  // Hooks et état
  hooks: {
    enabled: isDev,
    level: 'info'
  },
  // Composants UI
  ui: {
    enabled: isDev,
    level: 'warn' // Seulement les warnings et erreurs
  },
  // Formulaires
  forms: {
    enabled: isDev,
    level: 'info'
  },
  // Fichiers et uploads
  files: {
    enabled: isDev,
    level: 'info'
  }
};

/**
 * Logger avec gestion des catégories et niveaux
 */
export const logger = {
  debug: (category, message, data = null) => {
    if (!LOG_CONFIG[category]?.enabled) return;
    if (LOG_CONFIG[category].level === 'debug' || isDev) {
      console.debug(`🔍 [${category.toUpperCase()}]`, message, data || '');
    }
  },

  info: (category, message, data = null) => {
    if (!LOG_CONFIG[category]?.enabled) return;
    const levels = ['debug', 'info'];
    if (levels.includes(LOG_CONFIG[category].level)) {
      }]`, message, data || '');
    }
  },

  warn: (category, message, data = null) => {
    if (!LOG_CONFIG[category]?.enabled) return;
    const levels = ['debug', 'info', 'warn'];
    if (levels.includes(LOG_CONFIG[category].level)) {
      console.warn(`⚠️ [${category.toUpperCase()}]`, message, data || '');
    }
  },

  error: (category, message, error = null) => {
    if (!LOG_CONFIG[category]?.enabled) return;
    console.error(`❌ [${category.toUpperCase()}]`, message, error || '');
  },

  // Logs spécialisés pour différents types d'opérations
  api: {
    request: (endpoint, params = null) => {
      logger.debug('api', `Request to ${endpoint}`, params);
    },
    response: (endpoint, data) => {
      logger.debug('api', `Response from ${endpoint}`, data);
    },
    error: (endpoint, error) => {
      logger.error('api', `Error from ${endpoint}`, error);
    }
  },

  form: {
    init: (formName, data = null) => {
      logger.info('forms', `Form ${formName} initialized`, data);
    },
    submit: (formName, data = null) => {
      logger.info('forms', `Form ${formName} submitted`, data);
    },
    error: (formName, error) => {
      logger.error('forms', `Form ${formName} error`, error);
    }
  },

  file: {
    upload: (count, files = null) => {
      logger.info('files', `Uploading ${count} files`, files);
    },
    loaded: (count, type = 'files') => {
      logger.info('files', `Loaded ${count} ${type}`);
    },
    error: (operation, error) => {
      logger.error('files', `File ${operation} error`, error);
    }
  }
};

/**
 * Configuration des logs pour la production
 * En production, seuls les erreurs sont loggées
 */
if (!isDev) {
  // En production, réduire tous les logs sauf les erreurs
  Object.keys(LOG_CONFIG).forEach(category => {
    LOG_CONFIG[category].level = 'error';
  });
}

export default logger;
