/**
 * Middleware de pagination
 * Gère l'extraction et la validation des paramètres de pagination depuis la requête
 */

/**
 * Configure les paramètres de pagination à partir de la requête
 * @param {Object} options - Options de configuration
 * @returns {Function} Middleware Express
 */
const paginationMiddleware = (options = {}) => {
  const {
    defaultLimit = 10,
    maxLimit = 100,
    defaultSort = 'created_at',
    defaultOrder = 'DESC'
  } = options;
  
  return (req, res, next) => {
    // Extraire les paramètres de pagination
    let { limit, offset, page, sortBy, sortOrder } = req.query;
    
    // Traiter la limite
    limit = limit ? parseInt(limit, 10) : defaultLimit;
    if (isNaN(limit) || limit <= 0) {
      limit = defaultLimit;
    } else if (limit > maxLimit) {
      limit = maxLimit;
    }
    
    // Traiter l'offset et la page
    let parsedOffset = offset ? parseInt(offset, 10) : 0;
    const parsedPage = page ? parseInt(page, 10) : 1;
    
    // Si la page est fournie et pas l'offset, calculer l'offset
    if (!offset && page) {
      parsedOffset = (parsedPage - 1) * limit;
    }
    
    // S'assurer que l'offset est un nombre positif
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      parsedOffset = 0;
    }
    
    // Traiter le tri
    sortBy = sortBy || defaultSort;
    sortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : defaultOrder;
    
    // Ajouter les paramètres de pagination à l'objet requête
    req.pagination = {
      limit,
      offset: parsedOffset,
      page: parsedOffset === 0 ? 1 : Math.floor(parsedOffset / limit) + 1,
      sortBy,
      sortOrder
    };
    
    next();
  };
};

module.exports = paginationMiddleware;
