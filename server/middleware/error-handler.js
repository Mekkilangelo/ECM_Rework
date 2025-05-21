/**
 * Middleware de gestion centralisée des erreurs
 */
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Intercepte et formate toutes les erreurs de l'application
 * @param {Error} err - L'erreur interceptée
 * @param {Object} req - La requête Express
 * @param {Object} res - La réponse Express
 * @param {Function} next - Fonction next d'Express
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Génération d'un ID de requête pour faciliter le debugging
  const requestId = req.id || `req-${Date.now()}`;
  
  // Log détaillé de l'erreur
  logger.error(`[${requestId}] ${err.name || 'Error'}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode
  });
  
  // Format de réponse selon le type d'erreur
  const response = {
    success: false,
    status: 'error',
    statusCode,
    message: err.message || 'Erreur interne du serveur',
    requestId
  };
  
  // Ajouter les détails de validation si disponibles
  if (err instanceof ValidationError && err.errors) {
    response.errors = err.errors;
  }
  
  // Inclure la stack trace seulement en développement
  if (!isProduction) {
    response.stack = err.stack;
  }
  
  // Envoi de la réponse
  res.status(statusCode).json(response);
}

module.exports = errorHandler;
