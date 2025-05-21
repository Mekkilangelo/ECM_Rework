/**
 * Utilitaire de formatage des réponses API
 * Permet d'uniformiser toutes les réponses HTTP de l'application
 */

/**
 * Envoie une réponse de succès
 * @param {Object} res - L'objet response d'Express
 * @param {*} data - Les données à retourner
 * @param {string} message - Message de succès
 * @param {number} statusCode - Code HTTP de succès
 * @returns {Object} Réponse HTTP formatée
 */
const success = (res, data = null, message = 'Opération réussie', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Envoie une réponse d'erreur
 * @param {Object} res - L'objet response d'Express
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP d'erreur
 * @param {Object|Array} errors - Détails des erreurs (validation, etc.)
 * @returns {Object} Réponse HTTP formatée
 */
const error = (res, message = 'Une erreur est survenue', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Envoie une réponse avec pagination
 * @param {Object} res - L'objet response d'Express
 * @param {Array} data - Les données à retourner
 * @param {Object} pagination - Informations de pagination (total, limit, offset)
 * @param {string} message - Message de succès
 * @param {number} statusCode - Code HTTP de succès
 * @returns {Object} Réponse HTTP formatée avec pagination
 */
const paginated = (res, data, pagination, message = 'Opération réussie', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination
  });
};

module.exports = {
  success,
  error,
  paginated
};
