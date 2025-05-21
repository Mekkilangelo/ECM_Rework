/**
 * Middleware pour ajouter un ID unique à chaque requête
 * Facilite le suivi des requêtes dans les logs
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Attribue un ID unique à chaque requête
 */
const requestIdMiddleware = (req, res, next) => {
  req.id = uuidv4();
  
  // Ajouter l'ID aux headers de réponse pour faciliter le débogage côté client
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

module.exports = requestIdMiddleware;
