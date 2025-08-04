/**
 * Middleware d'authentification et d'autorisation
 * ===============================================
 * 
 * Ce module contient les middlewares fondamentaux pour:
 * 1. Authentifier les utilisateurs via JWT
 * 2. Valider les droits d'accès basés sur les rôles
 * 3. Gérer le rafraîchissement des tokens
 * 
 * Ces middlewares servent de briques de base pour construire des politiques 
 * d'accès plus complexes dans accessControl.js.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const { parseJwtTime } = require('../config/auth');

// Configuration des paramètres d'authentification
const JWT_SECRET = config.JWT.SECRET;
// Délai d'inactivité en millisecondes (utiliser la fonction de conversion pour traiter correctement les formats comme "10m")
const INACTIVITY_TIMEOUT = parseJwtTime(config.JWT.INACTIVITY_EXPIRE);

/**
 * Middleware d'authentification principal
 * ======================================
 * 
 * Vérifie l'authentification de l'utilisateur via le token JWT.
 * Ce middleware est la première couche de sécurité pour toutes les routes protégées.
 * 
 * Fonctionnalités:
 * - Extrait et valide le token JWT des en-têtes HTTP
 * - Vérifie l'expiration naturelle du token
 * - Contrôle le délai d'inactivité utilisateur
 * - Charge les données utilisateur depuis la base de données
 * - Expose les informations utilisateur via req.user
 * 
 * Utilisation typique:
 * router.get('/resource', authenticate, resourceController.getResource);
 * 
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */
const authenticate = async (req, res, next) => {
  let token;

  // Extrait le token du header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    // Journaliser le token (masquer une partie pour la sécurité)
    if (process.env.NODE_ENV === 'development' && token) {
      const tokenPreview = token.length > 20 ? 
        `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 
        'token trop court';
      console.log(`Token reçu (aperçu): ${tokenPreview}`);
      console.log(`Structure du token: ${token ? token.split('.').length : 0} segments`);
      
      // Vérifier si le token a une structure valide de JWT (doit avoir 3 segments séparés par des points)
      if (token.split('.').length !== 3) {
        console.error('Token JWT malformé - Structure incorrecte');
      }
    }
  }

  // Vérifie la présence du token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé, token manquant' 
    });
  }
  try {
    // Vérifie et décode le token JWT
    const decoded = jwt.verify(token, JWT_SECRET);    // Journalisation en mode développement pour faciliter le débogage
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SERVER] 🔒 Token vérifié`);
      console.log(`📋 DONNÉES JWT:`);
      console.log(`  • Utilisateur: ${decoded.username}`);
      console.log(`  • Dernière activité: ${new Date(decoded.lastActivity).toLocaleString()}`);
      console.log(`  • Délai d'inactivité configuré: ${INACTIVITY_TIMEOUT/1000}s (${config.JWT.INACTIVITY_EXPIRE})`);
      console.log(`  • Valeur du .env: JWT_INACTIVITY_EXPIRE=${process.env.JWT_INACTIVITY_EXPIRE || 'non définie'}`);
    }

    // Vérification du délai d'inactivité
    // Cette vérification est complémentaire à l'expiration naturelle du JWT
    if (decoded.lastActivity) {
      const now = Date.now();
      const inactiveTime = now - decoded.lastActivity;
      
      if (process.env.NODE_ENV === 'development') {
        const inactiveSeconds = Math.round(inactiveTime/1000);
        const inactivePercent = Math.round((inactiveTime / INACTIVITY_TIMEOUT) * 100);
        console.log(`[SERVER] ⏱️ Inactivité: ${inactiveSeconds}s / ${INACTIVITY_TIMEOUT/1000}s (${inactivePercent}%)`);
      }
      
      // Si le délai d'inactivité dépasse la limite configurée, rejette la requête
      if (inactiveTime > INACTIVITY_TIMEOUT) {
        console.log(`[SERVER] ⚠️ SESSION EXPIRÉE pour l'utilisateur "${decoded.username}"`);
        console.log(`  • Cause: Inactivité de ${Math.round(inactiveTime/1000)}s > limite de ${INACTIVITY_TIMEOUT/1000}s`);
        return res.status(401).json({ 
          success: false, 
          message: 'Session expirée due à l\'inactivité',
          errorType: 'inactivity_timeout'
        });
      }
    }    // Récupère l'utilisateur depuis la base de données pour confirmer son existence
    // et récupérer ses informations à jour (rôle, statut, etc.)
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Ajoute l'utilisateur authentifié à l'objet requête
    // Ces données seront disponibles pour tous les middlewares suivants
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    // Passe au middleware suivant
    next();  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    // Afficher plus de détails sur le token qui a causé l'erreur
    if (process.env.NODE_ENV === 'development' && token) {
      console.error(`Token problématique (aperçu): ${token.length > 20 ? 
        `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 
        token}`);
      console.error(`Type d'erreur JWT: ${error.name}`);
      console.error(`Message d'erreur JWT: ${error.message}`);
    }
    
    // Gestion spécifique selon le type d'erreur JWT
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
 * Middleware de validation pour le rafraîchissement des tokens
 * ==========================================================
 * 
 * Middleware spécialisé pour la route de rafraîchissement des tokens.
 * Contrairement au middleware authenticate standard, ce middleware accepte:
 * - Les tokens légèrement expirés
 * - Une période d'inactivité plus longue
 * 
 * Ce comportement permet aux utilisateurs de rafraîchir leur session même
 * après une courte période d'expiration, offrant une meilleure expérience
 * tout en maintenant la sécurité.
 * 
 * Utilisation typique:
 * router.post('/refresh-token', validateRefreshToken, authController.refreshToken);
 * 
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */
const validateRefreshToken = async (req, res, next) => {
  let token;

  // Extrait le token du header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Vérifie la présence du token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Accès non autorisé, token manquant' 
    });
  }  try {
    // Vérifie le token en ignorant l'expiration pour permettre le rafraîchissement
    // de tokens récemment expirés
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
      // Journalisation en mode développement pour faciliter le débogage
    if (process.env.NODE_ENV === 'development') {
      console.log('Tentative de rafraîchissement du token pour:', decoded.username);
      console.log('Dernière activité:', new Date(decoded.lastActivity));
    }

    // Définit un délai d'inactivité étendu spécifique au rafraîchissement
    // Ce délai est plus long que pour l'authentification standard
    // On multiplie par 2 pour donner plus de temps lors du rafraîchissement
    const extendedInactivityTimeout = parseJwtTime(config.JWT.INACTIVITY_EXPIRE) * 2;
    
    // Vérification du délai d'inactivité étendu
    if (decoded.lastActivity) {
      const now = Date.now();
      const inactiveTime = now - decoded.lastActivity;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Temps d\'inactivité pour rafraîchissement:', Math.round(inactiveTime/1000), 'secondes');
        console.log('Délai étendu autorisé:', Math.round(extendedInactivityTimeout/1000), 'secondes');
      }
      
      // Même avec la tolérance étendue, refuse les tokens inactifs depuis trop longtemps
      if (inactiveTime > extendedInactivityTimeout) {
        console.log('Rafraîchissement refusé - Inactivité trop longue pour:', decoded.username);
        return res.status(401).json({ 
          success: false, 
          message: 'Session expirée, impossible de rafraîchir après une inactivité prolongée',
          errorType: 'inactivity_timeout'
        });
      }
    }    // Vérifie que l'utilisateur existe toujours dans la base de données
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Ajoute l'utilisateur authentifié à l'objet requête
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    
    // Ajoute le token décodé pour permettre au contrôleur
    // d'accéder aux métadonnées du token lors du rafraîchissement
    req.decodedToken = decoded;

    // Passe au middleware suivant (généralement le contrôleur de rafraîchissement)
    next();
  } catch (error) {
    console.error('Erreur lors de la validation pour rafraîchissement:', error);
    
    // Gestion spécifique des erreurs pour le rafraîchissement
    // Même en ignorant l'expiration, un token corrompu doit être rejeté
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
 * Middleware d'autorisation basé sur les rôles
 * ===========================================
 * 
 * Fonction factory qui génère un middleware vérifiant si le rôle de l'utilisateur
 * est inclus dans la liste des rôles autorisés.
 * 
 * Ce middleware fournit un contrôle d'accès granulaire au niveau des routes
 * et permet une flexibilité pour définir quels rôles peuvent accéder à quelles ressources.
 * 
 * Utilisation typique:
 * router.get('/admin-resource', authenticate, authorizeRoles('admin', 'superuser'), controller.getResource);
 * router.get('/user-resource', authenticate, authorizeRoles('user', 'admin', 'superuser'), controller.getResource);
 * 
 * Note: Ce middleware doit être utilisé après authenticate car il dépend de req.user.
 * 
 * @param {...string} roles - Liste des rôles autorisés
 * @returns {Function} Middleware Express pour la vérification des rôles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Vérifie que le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource` 
      });
    }
    // Si le rôle est autorisé, passe au middleware suivant
    next();
  };
};

/**
 * Middleware pour les droits d'administration
 * ==========================================
 * 
 * Vérifie si l'utilisateur possède des droits d'administration.
 * Ce middleware autorise les utilisateurs ayant les rôles 'admin' ou 'superuser'.
 * 
 * Utilisé pour protéger les routes administratives qui ne devraient être
 * accessibles qu'aux administrateurs du système.
 * 
 * Utilisation typique:
 * router.get('/admin/users', authenticate, requireAdmin, userController.getAllUsers);
 * 
 * Note: Ce middleware doit être utilisé après authenticate car il dépend de req.user.
 * 
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */
const requireAdmin = (req, res, next) => {
  // Vérifie si l'utilisateur a un rôle d'administration
  if (req.user.role !== 'admin' && req.user.role !== 'superuser') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  // Si l'utilisateur est un administrateur, passe au middleware suivant
  next();
};

/**
 * Middleware pour les droits de super-administrateur
 * ================================================
 * 
 * Vérifie si l'utilisateur possède des droits de super-administrateur.
 * Ce middleware n'autorise que les utilisateurs ayant le rôle 'superuser'.
 * 
 * Utilisé pour protéger les routes critiques qui ne devraient être accessibles
 * qu'aux super-administrateurs du système, comme la configuration système,
 * la gestion des sauvegardes, ou les opérations sensibles.
 * 
 * Utilisation typique:
 * router.put('/system/settings', authenticate, requireSuperUser, systemController.updateSettings);
 * 
 * Note: Ce middleware doit être utilisé après authenticate car il dépend de req.user.
 * 
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */
const requireSuperUser = (req, res, next) => {
  // Vérifie que l'utilisateur est strictement un super-administrateur
  if (req.user.role !== 'superuser') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux super-administrateurs'
    });
  }
  // Si l'utilisateur est un super-administrateur, passe au middleware suivant
  next();
};

/**
 * Middleware pour les droits d'édition
 * ===================================
 * 
 * Vérifie si l'utilisateur possède des droits d'édition sur le système.
 * Ce middleware autorise les utilisateurs ayant les rôles 'admin' ou 'superuser'
 * à effectuer des opérations de modification (POST, PUT, DELETE).
 * 
 * Utilisé pour protéger les routes de modification qui ne devraient pas
 * être accessibles aux utilisateurs en lecture seule.
 * 
 * Note: Pour un contrôle d'accès complet incluant la vérification du mode
 * lecture seule global, utilisez plutôt le middleware combiné 'writeAccess'
 * du module accessControl.js.
 * 
 * Utilisation typique:
 * router.post('/resource', authenticate, requireEditRights, resourceController.createResource);
 * 
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */
const requireEditRights = (req, res, next) => {
  // Vérifie si l'utilisateur existe et a des droits d'édition
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superuser')) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Mode lecture seule actif.'
    });
  }
  // Si l'utilisateur a des droits d'édition, passe au middleware suivant
  next();
};

module.exports = { 
  authenticate, 
  authorizeRoles, 
  requireAdmin,
  requireSuperUser,
  validateRefreshToken,
  requireEditRights
};