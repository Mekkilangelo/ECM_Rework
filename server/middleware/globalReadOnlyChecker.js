/**
 * Middleware pour vérifier si le mode lecture seule global est activé
 * Si activé, cela bloque toutes les opérations de modification (POST, PUT, DELETE)
 * même pour les utilisateurs ayant des droits d'administrateur.
 */

const config = require('../config/config');

const globalReadOnlyChecker = (req, res, next) => {
  // Vérifier si le mode lecture seule global est activé
  if (config.ACCESS && config.ACCESS.GLOBAL_READ_ONLY === true) {
    return res.status(403).json({
      success: false,
      message: 'Système en lecture seule. Aucune modification n\'est autorisée actuellement.'
    });
  }

  // Le mode lecture seule n'est pas activé, continuer
  next();
};

module.exports = globalReadOnlyChecker;
