/**
 * Contrôleur d'authentification
 * Gère les opérations d'authentification (login, logout, etc.)
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateToken, verifyPassword, hashPassword, refreshToken } = require('../config/auth');
const config = require('../config/config');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');
const { AuthenticationError, NotFoundError } = require('../utils/errors');

/**
 * Authentification d'un utilisateur
 * @route POST /api/auth/login
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Réponse avec token JWT et infos utilisateur
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Journalisation de la tentative de connexion
    logger.info(`Tentative de connexion pour l'utilisateur: ${username}`);

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { username } });
    
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      // Délai pour contrer les attaques par force brute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      logger.warn(`Échec d'authentification pour l'utilisateur: ${username}`);
      return apiResponse.error(res, 'Identifiants invalides', 401);
    }    // Mise à jour de la date de dernière connexion
    // Note: last_login field removed as it doesn't exist in the database
    // Générer un token JWT
    const token = generateToken(user);
    
    logger.info(`Connexion réussie pour l'utilisateur: ${username}`, { userId: user.id });

    // Journaliser le token (longueur et format) pour débogage
    logger.debug(`Token généré - longueur: ${token ? token.length : 0}, format valide: ${token && token.split('.').length === 3}`);

    // Renvoyer la réponse de succès avec le token et les infos utilisateur
    return apiResponse.success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }, 'Authentification réussie');
  } catch (error) {
    logger.error(`Erreur lors de la connexion: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupération des informations de l'utilisateur connecté
 * @route GET /api/auth/me
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Informations de l'utilisateur
 */
const getMe = async (req, res, next) => {  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'created_at']
    });

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    return apiResponse.success(res, user, 'Informations utilisateur récupérées avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des informations utilisateur: ${error.message}`, error);
    next(error);
  }
};

/**
 * Rafraîchissement du token JWT
 * @route POST /api/auth/refresh-token
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Nouveau token JWT
 */
const refreshUserToken = async (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;
    
    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token non fourni');
    }
    
    // Utiliser les informations déjà décodées par le middleware refreshTokenValidator
    // Le token peut être légèrement expiré, mais le middleware l'a déjà validé
    // avec des règles plus souples pour permettre le rafraîchissement
      // Récupérer l'ancienne activité du token pour des logs de débogage
    const oldActivity = req.decodedToken.lastActivity;
    const currentTime = Date.now();
    const inactiveTime = currentTime - oldActivity;
    
    // Générer un nouveau token avec la date d'activité mise à jour
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        username: req.user.username, 
        role: req.user.role,
        lastActivity: currentTime // Mettre à jour le timestamp d'activité
      },
      config.JWT.SECRET,
      { expiresIn: config.JWT.INACTIVITY_EXPIRE }
    );
    
    // Logs améliorés pour mieux comprendre le comportement
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Rafraîchissement de token:
      - Utilisateur: ${req.user.username} (ID: ${req.user.id})
      - Dernière activité: ${new Date(oldActivity).toISOString()}
      - Temps d'inactivité: ${Math.round(inactiveTime/1000)}s
      - Inactivité maximale configurée: ${config.JWT.INACTIVITY_EXPIRE}
      - Nouvelle expiration fixée à: ${config.JWT.INACTIVITY_EXPIRE} à partir de maintenant`);
    }
    
    // Renvoyer le nouveau token
    return apiResponse.success(res, {
      token: newToken,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    }, 'Token rafraîchi avec succès');
  } catch (error) {
    logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  refreshUserToken
};