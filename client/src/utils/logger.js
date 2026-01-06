/**
 * Utilitaire de logging centralisé professionnel
 * Permet de contrôler les logs selon l'environnement et les catégories
 * Supporte l'envoi vers des services de monitoring en production (Sentry, LogRocket, etc.)
 */

const isDev = process.env.NODE_ENV === 'development';

// Configuration des niveaux de log par catégorie
const LOG_CONFIG = {
  // Services API
  api: {
    enabled: true,
    level: isDev ? 'info' : 'error' // 'debug', 'info', 'warn', 'error'
  },
  // Hooks et état
  hooks: {
    enabled: true,
    level: isDev ? 'info' : 'error'
  },
  // Composants UI
  ui: {
    enabled: true,
    level: isDev ? 'warn' : 'error' // Seulement les warnings et erreurs
  },
  // Formulaires
  forms: {
    enabled: true,
    level: isDev ? 'info' : 'error'
  },
  // Fichiers et uploads
  files: {
    enabled: true,
    level: isDev ? 'info' : 'error'
  },
  // Authentification
  auth: {
    enabled: true,
    level: isDev ? 'info' : 'error'
  }
};

/**
 * Classe Logger avec support monitoring production
 */
class Logger {
  constructor() {
    this.isDev = isDev;
    this.context = {}; // Contexte global (userId, sessionId, etc.)
  }

  /**
   * Définir le contexte global (ex: userId après login)
   * @param {Object} context - Contexte à ajouter à tous les logs
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Nettoyer le contexte (ex: après logout)
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Vérifier si un niveau de log est activé pour une catégorie
   * @private
   */
  _isLevelEnabled(category, level) {
    if (!LOG_CONFIG[category]) return false;
    if (!LOG_CONFIG[category].enabled) return false;

    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = LOG_CONFIG[category].level;
    const configLevelIndex = levels.indexOf(configLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= configLevelIndex;
  }

  /**
   * Formater les données pour l'affichage
   * @private
   */
  _formatData(data) {
    if (!data) return '';
    if (typeof data === 'object') {
      return data;
    }
    return data;
  }

  /**
   * Envoyer vers service de monitoring en production
   * @private
   */
  _sendToMonitoring(level, category, message, error, additionalContext = {}) {
    if (this.isDev) return; // Pas de monitoring en dev

    // TODO: Intégrer votre service de monitoring (Sentry, LogRocket, etc.)
    // Exemple avec Sentry:
    // if (window.Sentry && level === 'error') {
    //   window.Sentry.captureException(error || new Error(message), {
    //     level,
    //     tags: { category },
    //     extra: { ...this.context, ...additionalContext }
    //   });
    // }

    // Pour l'instant, on log juste en production pour traces
    if (level === 'error') {
      console.error(`[${category.toUpperCase()}] ${message}`, error || '');
    }
  }

  /**
   * Log niveau DEBUG
   * @param {string} category - Catégorie du log (api, hooks, forms, etc.)
   * @param {string} message - Message à logger
   * @param {*} data - Données additionnelles
   */
  debug(category, message, data = null) {
    if (!this._isLevelEnabled(category, 'debug')) return;

    if (this.isDev) {
      console.debug(
        `🔍 [${category.toUpperCase()}]`,
        message,
        this._formatData(data)
      );
    }
  }

  /**
   * Log niveau INFO
   * @param {string} category - Catégorie du log
   * @param {string} message - Message à logger
   * @param {*} data - Données additionnelles
   */
  info(category, message, data = null) {
    if (!this._isLevelEnabled(category, 'info')) return;

    if (this.isDev) {
      console.info(
        `ℹ️ [${category.toUpperCase()}]`,
        message,
        this._formatData(data)
      );
    }
  }

  /**
   * Log niveau WARN
   * @param {string} category - Catégorie du log
   * @param {string} message - Message à logger
   * @param {*} data - Données additionnelles
   */
  warn(category, message, data = null) {
    if (!this._isLevelEnabled(category, 'warn')) return;

    console.warn(
      `⚠️ [${category.toUpperCase()}]`,
      message,
      this._formatData(data)
    );

    this._sendToMonitoring('warn', category, message, null, { data });
  }

  /**
   * Log niveau ERROR
   * @param {string} category - Catégorie du log
   * @param {string} message - Message à logger
   * @param {Error|*} error - Objet Error ou données d'erreur
   * @param {Object} additionalContext - Contexte additionnel
   */
  error(category, message, error = null, additionalContext = {}) {
    if (!this._isLevelEnabled(category, 'error')) return;

    console.error(
      `❌ [${category.toUpperCase()}]`,
      message,
      error || ''
    );

    this._sendToMonitoring('error', category, message, error, additionalContext);
  }

  // ====================
  // Méthodes spécialisées par domaine
  // ====================

  /**
   * Logs pour les appels API
   */
  api = {
    request: (endpoint, params = null) => {
      this.debug('api', `Request to ${endpoint}`, params);
    },
    response: (endpoint, data) => {
      this.debug('api', `Response from ${endpoint}`, data);
    },
    error: (endpoint, error, context = {}) => {
      this.error('api', `Error from ${endpoint}`, error, { endpoint, ...context });
    }
  };

  /**
   * Logs pour les formulaires
   */
  form = {
    init: (formName, data = null) => {
      this.info('forms', `Form ${formName} initialized`, data);
    },
    submit: (formName, data = null) => {
      this.info('forms', `Form ${formName} submitted`, data);
    },
    error: (formName, error, context = {}) => {
      this.error('forms', `Form ${formName} error`, error, { formName, ...context });
    },
    validation: (formName, errors) => {
      this.warn('forms', `Form ${formName} validation failed`, errors);
    }
  };

  /**
   * Logs pour les fichiers
   */
  file = {
    upload: (count, files = null) => {
      this.info('files', `Uploading ${count} files`, files);
    },
    loaded: (count, type = 'files') => {
      this.info('files', `Loaded ${count} ${type}`);
    },
    error: (operation, error, context = {}) => {
      this.error('files', `File ${operation} error`, error, { operation, ...context });
    }
  };

  /**
   * Logs pour l'authentification
   */
  auth = {
    login: (userId) => {
      this.info('auth', `User ${userId} logged in`);
      this.setContext({ userId });
    },
    logout: (userId) => {
      this.info('auth', `User ${userId} logged out`);
      this.clearContext();
    },
    tokenRefresh: (success) => {
      if (success) {
        this.debug('auth', 'Token refreshed successfully');
      } else {
        this.warn('auth', 'Token refresh failed');
      }
    },
    error: (operation, error, context = {}) => {
      this.error('auth', `Auth ${operation} error`, error, { operation, ...context });
    }
  };

  /**
   * Logs pour les hooks
   */
  hook = {
    init: (hookName, params = null) => {
      this.debug('hooks', `Hook ${hookName} initialized`, params);
    },
    update: (hookName, data) => {
      this.debug('hooks', `Hook ${hookName} updated`, data);
    },
    error: (hookName, error, context = {}) => {
      this.error('hooks', `Hook ${hookName} error`, error, { hookName, ...context });
    }
  };
}

// Singleton instance
const logger = new Logger();

// Export de l'instance et de la classe
export { Logger };
export default logger;
