/**
 * Configuration des logs du serveur
 * Permet de contrôler le niveau de verbosité des logs pour faciliter le débogage
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Configuration par défaut - peut être surchargée par les variables d'environnement
const DEFAULT_CONFIG = {
  // Niveau de log global (0 = ERROR seulement, 4 = TRACE tout)
  globalLevel: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LOG_LEVELS.INFO,
  
  // Configuration par module
  modules: {
    // Routes et contrôleurs
    routes: process.env.LOG_ROUTES_LEVEL ? parseInt(process.env.LOG_ROUTES_LEVEL) : LOG_LEVELS.WARN,
    controllers: process.env.LOG_CONTROLLERS_LEVEL ? parseInt(process.env.LOG_CONTROLLERS_LEVEL) : LOG_LEVELS.WARN,
    
    // Middleware
    middleware: process.env.LOG_MIDDLEWARE_LEVEL ? parseInt(process.env.LOG_MIDDLEWARE_LEVEL) : LOG_LEVELS.ERROR,
    authentication: process.env.LOG_AUTH_LEVEL ? parseInt(process.env.LOG_AUTH_LEVEL) : LOG_LEVELS.WARN,
    
    // Base de données
    database: process.env.LOG_DB_LEVEL ? parseInt(process.env.LOG_DB_LEVEL) : LOG_LEVELS.ERROR,
    queries: process.env.LOG_QUERIES_LEVEL ? parseInt(process.env.LOG_QUERIES_LEVEL) : LOG_LEVELS.ERROR,
    
    // Services
    fileService: process.env.LOG_FILE_SERVICE_LEVEL ? parseInt(process.env.LOG_FILE_SERVICE_LEVEL) : LOG_LEVELS.WARN,
    reportService: process.env.LOG_REPORT_SERVICE_LEVEL ? parseInt(process.env.LOG_REPORT_SERVICE_LEVEL) : LOG_LEVELS.INFO,
    
    // Sécurité
    security: process.env.LOG_SECURITY_LEVEL ? parseInt(process.env.LOG_SECURITY_LEVEL) : LOG_LEVELS.WARN,
    
    // Performance
    performance: process.env.LOG_PERFORMANCE_LEVEL ? parseInt(process.env.LOG_PERFORMANCE_LEVEL) : LOG_LEVELS.ERROR
  },
  
  // Configuration d'affichage
  display: {
    colors: process.env.NODE_ENV !== 'production',
    timestamps: true,
    stackTrace: process.env.NODE_ENV === 'development'
  }
};

/**
 * Créer un logger contextualisé pour un module
 */
function createLogger(moduleName) {
  const moduleLevel = DEFAULT_CONFIG.modules[moduleName] || DEFAULT_CONFIG.globalLevel;
  
  const colors = {
    ERROR: '\x1b[31m', // Rouge
    WARN: '\x1b[33m',  // Jaune
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m', // Magenta
    TRACE: '\x1b[37m', // Blanc
    RESET: '\x1b[0m'
  };
  
  function formatMessage(level, message, data = null) {
    const timestamp = DEFAULT_CONFIG.display.timestamps 
      ? `[${new Date().toISOString()}]` 
      : '';
    
    const color = DEFAULT_CONFIG.display.colors ? colors[level] : '';
    const reset = DEFAULT_CONFIG.display.colors ? colors.RESET : '';
    
    let formattedMessage = `${color}${timestamp} [${level}] [${moduleName.toUpperCase()}] ${message}${reset}`;
    
    if (data) {
      formattedMessage += `\n${color}Data: ${JSON.stringify(data, null, 2)}${reset}`;
    }
    
    return formattedMessage;
  }
  
  return {
    error: (message, data = null) => {
      if (moduleLevel >= LOG_LEVELS.ERROR) {
        console.error(formatMessage('ERROR', message, data));
      }
    },
    
    warn: (message, data = null) => {
      if (moduleLevel >= LOG_LEVELS.WARN) {
        console.warn(formatMessage('WARN', message, data));
      }
    },
    
    info: (message, data = null) => {
      if (moduleLevel >= LOG_LEVELS.INFO) {
        console.info(formatMessage('INFO', message, data));
      }
    },
    
    debug: (message, data = null) => {
      if (moduleLevel >= LOG_LEVELS.DEBUG) {
        console.log(formatMessage('DEBUG', message, data));
      }
    },
    
    trace: (message, data = null) => {
      if (moduleLevel >= LOG_LEVELS.TRACE) {
        console.log(formatMessage('TRACE', message, data));
      }
    },
    
    // Fonction utilitaire pour vérifier si un niveau est activé
    isLevelEnabled: (level) => {
      return moduleLevel >= LOG_LEVELS[level.toUpperCase()];
    }
  };
}

/**
 * Middleware pour logger les requêtes HTTP (optionnel)
 */
function httpLoggerMiddleware(req, res, next) {
  const logger = createLogger('middleware');
  
  if (logger.isLevelEnabled('INFO')) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
      
      logger[level.toLowerCase()](`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
  }
  
  next();
}

module.exports = {
  LOG_LEVELS,
  DEFAULT_CONFIG,
  createLogger,
  httpLoggerMiddleware
};