/**
 * Middleware pour valider le chemin de fichier ou dossier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next
 */
exports.validatePath = (req, res, next) => {
    const path = req.query.path || req.body.path || '/';
    
    // Vérifier si le chemin contient des séquences dangereuses
    if (path.includes('..') || path.includes('~') || /[<>:"|?*]/.test(path)) {
      return res.status(400).json({ message: 'Chemin invalide' });
    }
    
    next();
  };
  
  /**
   * Middleware pour valider les champs de formulaire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   * @param {Function} next - Fonction next
   * @param {Array} requiredFields - Liste des champs requis
   */
  exports.validateFields = (requiredFields) => {
    return (req, res, next) => {
      const missingFields = requiredFields.filter(field => !req.body[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: 'Champs requis manquants', 
          fields: missingFields 
        });
      }
      
      next();
    };
  };