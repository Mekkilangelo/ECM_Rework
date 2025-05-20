/**
 * Middleware d'authentification
 * Vérifie la validité du token JWT dans les requêtes
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');

// Accès correct à la clé secrète JWT
const JWT_SECRET = config.JWT.SECRET;
// Délai d'inactivité en millisecondes (convertir minutes en ms)
const INACTIVITY_TIMEOUT = parseInt(config.JWT.INACTIVITY_EXPIRE) * 60 * 1000;

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

    // Vérification détaillée uniquement en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('Token vérifié pour l\'utilisateur:', decoded.username);
      console.log('Dernière activité:', new Date(decoded.lastActivity));
      console.log('Délai d\'inactivité configuré:', INACTIVITY_TIMEOUT, 'ms');
    }

    // Vérifier si l'utilisateur a été inactif trop longtemps
    // Cette vérification est ajoutée en plus de l'expiration naturelle du token
    if (decoded.lastActivity) {
      const now = Date.now();
      const inactiveTime = now - decoded.lastActivity;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Temps d\'inactivité actuel:', inactiveTime, 'ms', '(', Math.round(inactiveTime/1000), 'secondes)');
      }
      
      // Si l'utilisateur est inactif depuis plus longtemps que le délai configuré
      if (inactiveTime > INACTIVITY_TIMEOUT) {
        console.log('Session expirée due à l\'inactivité pour', decoded.username);
        return res.status(401).json({ 
          success: false, 
          message: 'Session expirée due à l\'inactivité',
          errorType: 'inactivity_timeout'
        });
      }
    }

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
    console.error('Erreur de vérification du token:', error);
    
    // Message d'erreur plus précis selon le type d'erreur
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Session expirée',
        errorType: 'token_expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide',
        errorType: 'token_invalid'
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Erreur d\'authentification',
        errorType: 'auth_error'
      });
    }
  }
};

/**
 * Middleware spécial pour valider le token pendant une opération de rafraîchissement
 * Contrairement au middleware protect, il est plus tolérant avec les tokens expirés
 * et l'inactivité, car son but est de permettre le rafraîchissement
 */
const refreshTokenValidator = async (req, res, next) => {
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
    // Vérifier le token mais ignorer l'expiration
    // Cela permet de rafraîchir des tokens légèrement expirés
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    
    // Vérification détaillée uniquement en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('Tentative de rafraîchissement du token pour:', decoded.username);
      console.log('Dernière activité:', new Date(decoded.lastActivity));
    }

    // Utiliser un délai d'inactivité plus long pour le rafraîchissement
    // Par exemple, 2 fois le délai d'inactivité normal
    const extendedInactivityTimeout = INACTIVITY_TIMEOUT * 2;
    
    // Vérifier si l'utilisateur a été inactif trop longtemps
    if (decoded.lastActivity) {
      const now = Date.now();
      const inactiveTime = now - decoded.lastActivity;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Temps d\'inactivité pour rafraîchissement:', Math.round(inactiveTime/1000), 'secondes');
        console.log('Délai étendu autorisé:', Math.round(extendedInactivityTimeout/1000), 'secondes');
      }
      
      // On utilise un délai plus long que pour le middleware protect
      if (inactiveTime > extendedInactivityTimeout) {
        console.log('Rafraîchissement refusé - Inactivité trop longue pour:', decoded.username);
        return res.status(401).json({ 
          success: false, 
          message: 'Session expirée, impossible de rafraîchir après une inactivité prolongée',
          errorType: 'inactivity_timeout'
        });
      }
    }

    // Vérifier rapidement si l'utilisateur existe toujours
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Ajouter les informations nécessaires à la requête
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    // Ajouter le token décodé à la requête
    req.decodedToken = decoded;

    next();
  } catch (error) {
    console.error('Erreur lors de la validation pour rafraîchissement:', error);
    
    // Même si on ignore l'expiration dans la vérification,
    // un token corrompu ou mal formé devrait être rejeté
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token invalide ou corrompu',
        errorType: 'token_invalid'
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Erreur d\'authentification',
        errorType: 'auth_error'
      });
    }
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

/**
 * Middleware pour vérifier que l'utilisateur est admin ou superuser
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superuser') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est superuser
 */
const superUserOnly = (req, res, next) => {
  if (req.user.role !== 'superuser') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux super-administrateurs'
    });
  }
  next();
};

/**
 * Middleware pour vérifier les droits d'édition (non lecture seule)
 * Note: Pour un contrôle d'accès complet, utilisez plutôt les middleware de accessControl.js
 */
const editRightsOnly = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superuser') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Mode lecture seule actif.'
    });
  }
  next();
};

module.exports = { 
  protect, 
  authorize, 
  adminOnly,
  superUserOnly,
  refreshTokenValidator,
  editRightsOnly
};