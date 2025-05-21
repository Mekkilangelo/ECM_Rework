/**
 * Middleware de journalisation des réponses
 * Enregistre les réponses API pour le débogage
 */

const logger = require('../utils/logger');

/**
 * Journalisation des réponses API
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */
const responseLogger = (req, res, next) => {
  // Sauvegarde de la méthode originale
  const originalSend = res.json;
  
  // Remplacer temporairement res.json pour capturer la réponse
  res.json = function(body) {
    // Si c'est une route d'authentification, journaliser la structure (pas les valeurs sensibles)
    if (req.path.includes('/auth/login')) {
      // Créer une version sécurisée du corps de la réponse pour le logging
      const safeBody = { ...body };
      if (safeBody.data && safeBody.data.token) {
        safeBody.data.token = 'TOKEN_PRÉSENT';
      } else if (safeBody.token) {
        safeBody.token = 'TOKEN_PRÉSENT';
      }
      
      logger.debug(`Réponse à ${req.method} ${req.path}:`, {
        statusCode: res.statusCode,
        body: safeBody
      });
    }
    
    // Appeler la méthode originale
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = responseLogger;
