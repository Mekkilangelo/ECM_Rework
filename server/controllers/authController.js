/**
 * Contrôleur d'authentification
 * Gère les opérations d'authentification (login, logout, etc.)
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateToken, verifyPassword, hashPassword, refreshToken } = require('../config/auth');
const config = require('../config/config');

// Accès aux constantes JWT
const JWT_SECRET = config.JWT.SECRET;
const JWT_INACTIVITY_EXPIRE = config.JWT.INACTIVITY_EXPIRE;

/**
 * Authentification d'un utilisateur
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { username } });
    
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      // Délai pour contrer les attaques par force brute
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si l'utilisateur a les droits nécessaires
    // if (user.role !== 'admin' && user.role !== 'superuser') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Droits insuffisants'
    //   });
    // }

    // Générer un token JWT
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

/**
 * Récupération des informations de l'utilisateur connecté
 * @route GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Rafraîchissement du token JWT
 * @route POST /api/auth/refresh-token
 */
const refreshUserToken = async (req, res) => {
  try {
    const tokenHeader = req.headers.authorization;
    
    if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token non fourni'
      });
    }
    
    const oldToken = tokenHeader.split(' ')[1];
    
    // Utiliser les informations déjà décodées par le middleware refreshTokenValidator
    // Le token peut être légèrement expiré, mais le middleware l'a déjà validé
    // avec des règles plus souples pour permettre le rafraîchissement
    
    // Générer un nouveau token avec la date d'activité mise à jour
    const newToken = jwt.sign(
      { 
        id: req.user.id, 
        username: req.user.username, 
        role: req.user.role,
        lastActivity: Date.now() // Mettre à jour le timestamp d'activité
      },
      JWT_SECRET,
      { expiresIn: JWT_INACTIVITY_EXPIRE }
    );
    
    // Renvoyer le nouveau token
    res.status(200).json({
      success: true,
      token: newToken,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du rafraîchissement du token'
    });
  }
};

module.exports = {
  login,
  getMe,
  refreshUserToken
};