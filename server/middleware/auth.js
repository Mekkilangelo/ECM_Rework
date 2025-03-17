/**
 * Middleware d'authentification
 * Vérifie la validité du token JWT dans les requêtes
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const { User } = require('../models');

/**
 * Middleware pour protéger les routes nécessitant une authentification
 */
const protect = async (req, res, next) => {
  let token;

  // Vérifier si le token est présent dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé, token manquant' 
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Récupérer l'utilisateur correspondant au token
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token invalide ou expiré' 
    });
  }
};

/**
 * Middleware pour autoriser seulement certains rôles
 * @param {String[]} roles - Tableau des rôles autorisés
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };