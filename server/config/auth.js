/**
 * Configuration de l'authentification
 * Gère les tokens JWT et les fonctions d'authentification
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('./config');

// Accéder correctement aux propriétés JWT imbriquées
const JWT_SECRET = config.JWT.SECRET;
const JWT_EXPIRE = config.JWT.EXPIRE;
const JWT_INACTIVITY_EXPIRE = config.JWT.INACTIVITY_EXPIRE;

// Affichage des paramètres d'authentification en mode développement
if (process.env.NODE_ENV === 'development') {
  
  
  
}

/**
 * Génère un token JWT pour l'utilisateur
 * @param {Object} user - Données de l'utilisateur à encoder dans le token
 * @returns {String} - Token JWT
 */
const generateToken = (user) => {
  try {
    if (!JWT_SECRET) {
      console.error('ERREUR CRITIQUE: JWT_SECRET est undefined ou vide!');
      throw new Error('JWT_SECRET manquant');
    }
    
    const payload = { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      lastActivity: Date.now() // Ajouter un timestamp d'activité
    };
    
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_INACTIVITY_EXPIRE } // Utiliser la durée d'inactivité pour l'expiration
    );
    
    // Vérification que le token généré est valide
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('ERREUR: Token JWT généré malformé!');
    } else {
    }
    
    return token;
  } catch (error) {
    console.error('Erreur lors de la génération du token JWT:', error);
    throw error;
  }
};

/**
 * Renouvelle un token JWT existant
 * @param {String} oldToken - Ancien token à vérifier
 * @returns {Object} - Objet contenant le nouveau token et les données utilisateur
 */
const refreshToken = (oldToken) => {
  try {
    // Vérifier le token existant en permettant des tokens expirés
    const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
    
    // Vérifier si le token est expiré en raison d'inactivité
    const now = Date.now();
    const lastActivity = decoded.lastActivity || 0;
    const inactiveTime = now - lastActivity;
    
    // Convertir JWT_INACTIVITY_EXPIRE en millisecondes (en considérant le format '10m')
    const inactivityExpireMs = parseJwtTime(JWT_INACTIVITY_EXPIRE);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Tentative de rafraîchissement:', {
        lastActivity: new Date(lastActivity),
        inactiveTime: Math.round(inactiveTime/1000) + 's',
        inactivityExpireMs: Math.round(inactivityExpireMs/1000) + 's',
        username: decoded.username
      });
    }
    
    // Si l'inactivité dépasse la limite, rejeter le rafraîchissement
    if (inactiveTime > inactivityExpireMs) {
      
      return { 
        success: false, 
        message: 'Session expirée en raison d\'une inactivité prolongée' 
      };
    }
    
    // Générer un nouveau token avec la durée d'inactivité mise à jour
    const newToken = jwt.sign(
      { 
        id: decoded.id, 
        username: decoded.username, 
        role: decoded.role,
        lastActivity: Date.now() // Mettre à jour le timestamp d'activité
      },
      JWT_SECRET,
      { expiresIn: JWT_INACTIVITY_EXPIRE }
    );
    
    return { 
      success: true, 
      token: newToken,
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      }
    };
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return { 
      success: false, 
      message: 'Token invalide ou corrompu'
    };
  }
};

/**
 * Convertit une durée JWT (ex: '10m', '2h', '1d') en millisecondes
 * @param {String} time - Durée au format JWT
 * @returns {Number} - Durée en millisecondes
 */
function parseJwtTime(time) {
  if (!time) return 600000; // Valeur par défaut: 10 minutes
  
  const unit = time.slice(-1);
  const value = parseInt(time.slice(0, -1), 10);
  
  switch (unit) {
    case 's': return value * 1000; // secondes
    case 'm': return value * 60 * 1000; // minutes
    case 'h': return value * 60 * 60 * 1000; // heures
    case 'd': return value * 24 * 60 * 60 * 1000; // jours
    default: return 600000; // Valeur par défaut en cas d'erreur
  }
}

/**
 * Vérifie le mot de passe de l'utilisateur
 * @param {String} password - Mot de passe en clair
 * @param {String} hashedPassword - Mot de passe haché stocké en base
 * @returns {Boolean} - True si le mot de passe correspond
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Hache un mot de passe
 * @param {String} password - Mot de passe en clair
 * @returns {String} - Mot de passe haché
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

module.exports = {
  generateToken,
  verifyPassword,
  hashPassword,
  refreshToken,
  parseJwtTime
};