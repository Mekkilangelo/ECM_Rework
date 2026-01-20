const loggingService = require('../services/loggingService');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware de logging automatique
 * =================================
 * 
 * Ce middleware capture automatiquement :
 * - Toutes les requêtes HTTP
 * - Les erreurs non gérées
 * - Les actions CRUD
 * - Les tentatives d'accès non autorisés
 */

/**
 * Utilitaire pour extraire l'adresse IP de la requête
 */
const getClientIp = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         (req.connection.socket ? req.connection.socket.remoteAddress : null) || 
         'unknown';
};

/**
 * Middleware pour logger toutes les requêtes HTTP
 */
const logRequest = (req, res, next) => {
  // Générer un ID unique pour cette requête
  req.requestId = uuidv4();
  req.startTime = Date.now();  // Extraire les informations de la requête
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    params: req.params,
    userAgent: req.get('User-Agent'),
    ipAddress: getClientIp(req),
    sessionId: req.session?.id
  };

  // Ne pas logger le body pour les requêtes sensibles (mot de passe, etc.)
  if (req.body && !req.originalUrl.includes('/auth/login') && !req.originalUrl.includes('/password')) {
    requestInfo.body = req.body;
  }

  // Logger la requête en mode debug seulement
  if (process.env.NODE_ENV === 'development') {
    loggingService.debug('http_request', `${req.method} ${req.originalUrl}`, {
      details: requestInfo
    }, {
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      sessionId: requestInfo.sessionId,
      requestId: req.requestId
    });
  }

/**
 * Traduit une route API en message user-friendly
 */
const translateApiRoute = (method, url, statusCode, user) => {
  // Extraire l'entité et l'action de l'URL
  const pathParts = url.split('/').filter(part => part);
  
  if (pathParts[0] !== 'api') return null; // Ignorer les routes non-API
  
  // Ignorer certaines routes automatiques/techniques
  const ignoredRoutes = [
    '/api/auth/refresh-token', // Rafraîchissement automatique du token
    '/api/health',             // Health check
    '/api/logs'                // Pour éviter la boucle infinie
  ];
  
  if (ignoredRoutes.some(route => url.startsWith(route))) {
    return null;
  }
  
  const entity = pathParts[1]; // clients, users, orders, etc.
  const entityId = pathParts[2] && /^\d+$/.test(pathParts[2]) ? pathParts[2] : null;
  const subAction = pathParts[2] && !/^\d+$/.test(pathParts[2]) ? pathParts[2] : null;
    // Messages par entité et action
  const translations = {
    // Authentication
    auth: {
      'POST:/login': () => `User ${user?.username || 'unknown'} login`,
      'POST:/logout': () => `User ${user?.username || 'unknown'} logout`,
    },
    
    // Clients
    clients: {
      'GET:': () => entityId ? `View client ${entityId}` : 'View clients list',
      'POST:': () => 'Create new client',
      'PUT:': () => `Update client ${entityId}`,
      'DELETE:': () => `Delete client ${entityId}`,
    },
    
    // Users
    users: {
      'GET:': () => entityId ? `View user ${entityId}` : 'View users list',
      'POST:': () => 'Create new user',
      'PUT:': () => `Update user ${entityId}`,
      'DELETE:': () => `Delete user ${entityId}`,
    },
    
    // Orders
    orders: {
      'GET:': () => entityId ? `View order ${entityId}` : 'View orders list',
      'POST:': () => 'Create new order',
      'PUT:': () => `Update order ${entityId}`,
      'DELETE:': () => `Delete order ${entityId}`,
    },
    
    // Parts
    parts: {
      'GET:': () => entityId ? `View part ${entityId}` : 'View parts list',
      'POST:': () => 'Create new part',
      'PUT:': () => `Update part ${entityId}`,      'DELETE:': () => `Delete part ${entityId}`,
    },
    
    // Tests
    tests: {
      'GET:': () => entityId ? `View test ${entityId}` : 'View tests list',
      'POST:': () => 'Create new test',
      'PUT:': () => `Update test ${entityId}`,
      'DELETE:': () => `Delete test ${entityId}`,
    },
    
    // Files
    files: {
      'GET:': () => 'Download file',
      'POST:': () => 'Upload file',
      'DELETE:': () => 'Delete file',
    },
    
    // Search
    search: {
      'GET:': () => 'Database search',
      'POST:': () => 'Advanced search',
    },
    
    // Logs (for admins)
    logs: {
      'GET:': () => subAction === 'stats' ? 'View log statistics' : 'View system logs',
      'GET:/export': () => 'Export logs',
      'DELETE:/cleanup': () => 'Cleanup old logs',
    }
  };
  
  if (translations[entity]) {
    const key = `${method}:${subAction ? `/${subAction}` : ''}`;
    const translator = translations[entity][key] || translations[entity][`${method}:`];
      if (translator) {
      const message = translator();
      
      // Add status if failed
      if (statusCode >= 400) {
        return `${message} (Failed - ${statusCode})`;
      }
      
      return message;
    }
  }
  
  return null; // Ignorer cette route
};  // Capturer la réponse
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - req.startTime;
    
    // Traduire la route en message user-friendly
    const friendlyMessage = translateApiRoute(req.method, req.originalUrl, res.statusCode, req.user);
    
    // Ne logger que si le message est intéressant pour l'utilisateur
    if (friendlyMessage) {      const logData = {
        action: 'user_action',
        message: friendlyMessage,
        details: {
          statusCode: res.statusCode,
          duration: duration,
          method: req.method,
          url: req.originalUrl
        },
        duration: duration
      };

      // Choisir le niveau selon le code de statut
      let level = 'info';
      if (res.statusCode >= 400 && res.statusCode < 500) {
        level = 'warning';
      } else if (res.statusCode >= 500) {
        level = 'error';
      } else if (req.method !== 'GET') {
        level = 'success'; // Actions de modification réussies
      }

      logData.level = level;

      // Logger selon l'importance de l'action
      const importantActions = ['POST', 'PUT', 'DELETE']; // Actions de modification
      const shouldLog = importantActions.includes(req.method) || res.statusCode >= 400;
        if (shouldLog) {
        loggingService.log(logData, {
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
          sessionId: requestInfo.sessionId,
          requestId: req.requestId,
          userId: req.user?.id,
          username: req.user?.username
        });
      }
    }

    originalSend.call(this, body);
  };

  next();
};

/**
 * Logger les actions CRUD automatiquement
 */
const logCrudAction = (action, entity) => {
  return async (req, res, next) => {
    try {
      // Stocker les infos pour le post-processing
      req.crudAction = {
        action,
        entity,
        startTime: Date.now()
      };

      // Si c'est une création ou modification, capturer les données
      if (['create', 'update'].includes(action) && req.body) {
        req.crudAction.data = { ...req.body };
        // Supprimer les mots de passe des logs
        if (req.crudAction.data.password) {
          req.crudAction.data.password = '[HIDDEN]';
        }
      }

      next();
    } catch (error) {
      console.error('Error in logCrudAction middleware:', error);
      next();
    }
  };
};

/**
 * Middleware pour logger après une action CRUD réussie
 */
const logCrudSuccess = async (req, res, next) => {
  // Attendre que la réponse soit envoyée
  const originalSend = res.send;
  res.send = function(body) {
    // Logger l'action CRUD
    if (req.crudAction && req.user && res.statusCode < 400) {
      const duration = Date.now() - req.crudAction.startTime;
      
      let entityId = null;
      let message = '';      // Extract entity ID based on action
      if (req.crudAction.action === 'create' && body) {
        try {
          const responseData = typeof body === 'string' ? JSON.parse(body) : body;
          entityId = responseData.id || responseData.data?.id;
          message = `Create ${req.crudAction.entity} ${entityId ? `(ID: ${entityId})` : ''} by ${req.user.username}`;
        } catch (e) {
          message = `Create ${req.crudAction.entity} by ${req.user.username}`;
        }
      } else if (req.crudAction.action === 'update') {
        entityId = req.params.id;
        message = `Update ${req.crudAction.entity} ${entityId ? `(ID: ${entityId})` : ''} by ${req.user.username}`;
      } else if (req.crudAction.action === 'delete') {
        entityId = req.params.id;
        message = `Delete ${req.crudAction.entity} ${entityId ? `(ID: ${entityId})` : ''} by ${req.user.username}`;
      } else if (req.crudAction.action === 'read') {
        entityId = req.params.id;
        message = `Read ${req.crudAction.entity} ${entityId ? `(ID: ${entityId})` : ''} by ${req.user.username}`;
      }loggingService.logCrudAction(
        req.crudAction.action,
        req.crudAction.entity,
        entityId,
        req.user.id,
        req.user.username,
        message,
        {
          data: req.crudAction.data,
          duration: duration,
          method: req.method,
          url: req.originalUrl
        },
        {
          ipAddress: getClientIp(req),
          userAgent: req.get('User-Agent'),
          sessionId: req.session?.id,
          requestId: req.requestId
        }
      );
    }
    
    originalSend.call(this, body);
  };

  next();
};

/**
 * Logger les erreurs d'authentification
 */
const logAuthError = async (req, res, next) => {
  const originalSend = res.send;
  res.send = function(body) {
    // Ignorer le refresh-token pour éviter le spam de logs
    // C'est un comportement normal qu'un token expire
    if (req.originalUrl.includes('/auth/refresh-token')) {
      return originalSend.call(this, body);
    }

    if (res.statusCode === 401 || res.statusCode === 403) {      loggingService.logSecurityEvent(
        'auth_failed',
        `Unauthorized access attempt to ${req.originalUrl}`,
        {
          statusCode: res.statusCode,
          method: req.method,
          url: req.originalUrl,
          userAgent: req.get('User-Agent'),
          body: req.body
        },
        {
          ipAddress: getClientIp(req),
          userAgent: req.get('User-Agent'),
          sessionId: req.session?.id,
          requestId: req.requestId
        }
      );
    }

    originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware pour capturer les erreurs non gérées
 */
const logError = (err, req, res, next) => {  loggingService.error(
    'unhandled_error',
    `Unhandled error: ${err.message}`,
    err,
    {
      details: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        userAgent: req.get('User-Agent')
      },
      userId: req.user?.id,
      username: req.user?.username
    },
    {
      ipAddress: getClientIp(req),
      userAgent: req.get('User-Agent'),
      sessionId: req.session?.id,
      requestId: req.requestId
    }
  );

  next(err);
};

module.exports = {
  logRequest,
  logCrudAction,
  logCrudSuccess,
  logAuthError,
  logError
};
