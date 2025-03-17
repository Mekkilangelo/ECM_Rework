/**
 * Configuration de l'authentification
 * Gère les tokens JWT et les fonctions d'authentification
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRE } = require('./config');

/**
 * Génère un token JWT pour l'utilisateur
 * @param {Object} user - Données de l'utilisateur à encoder dans le token
 * @returns {String} - Token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

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
  hashPassword
};