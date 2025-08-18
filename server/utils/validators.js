/**
 * Utilitaires de validation des données
 * Centralise les fonctions de validation pour les différentes entités
 */

const { Op } = require('sequelize');
const { user: User, node: Node } = require('../models');

/**
 * Valide les données d'une commande
 * @param {Object} data - Données de la commande à valider
 * @returns {Object} Résultat de validation {isValid, errors}
 */
const validateOrderData = (data) => {
  const errors = {};
    // Validation des champs obligatoires
  if (!data.parent_id) {
    errors.parent_id = 'ID parent est requis';
  }
  
  if (!data.order_date || (typeof data.order_date === 'string' && data.order_date.trim() === '')) {
    errors.order_date = 'La date est requise';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valide les données d'un utilisateur
 * @param {Object} data - Données utilisateur à valider
 * @returns {Object} Résultat de validation {isValid, errors}
 */
const validateUserData = (data) => {
  const errors = {};
  
  // Validation des champs obligatoires, sauf si c'est juste une mise à jour du mot de passe
  const isPasswordOnlyUpdate = data.password && Object.keys(data).length === 1;
  
  if (!isPasswordOnlyUpdate && (!data.username || data.username.trim() === '')) {
    errors.username = 'Le nom d\'utilisateur est requis';
  } else if (data.username && data.username.length < 3) {
    errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
  }
  
  // Validation du mot de passe lors de la création
  if (data.isNew && (!data.password || data.password.trim() === '')) {
    errors.password = 'Le mot de passe est requis';
  } else if (data.password && data.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }
  
  // Validation du rôle
  const validRoles = ['admin', 'user', 'superuser'];
  if (data.role && !validRoles.includes(data.role)) {
    errors.role = `Le rôle doit être l'un de : ${validRoles.join(', ')}`;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validation des données d'un fichier
 * @param {Object} data - Données du fichier à valider
 * @returns {Object} Résultat de validation {isValid, errors}
 */
const validateFileData = (data) => {
  const errors = {};
  
  // Validation des champs obligatoires pour les fichiers
  if (!data.files || data.files.length === 0) {
    errors.files = 'Aucun fichier fourni';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Vérifie si un utilisateur existe par son nom d'utilisateur
 * @param {string} username - Nom d'utilisateur à vérifier
 * @param {number} excludeId - ID utilisateur à exclure (lors d'une mise à jour)
 * @returns {Promise<boolean>} True si existe, false sinon
 */
const userExists = async (username, excludeId = null) => {
  const whereClause = { username };
  if (excludeId) {
    whereClause.id = { [Op.ne]: excludeId };
  }
  
  const user = await User.findOne({ where: whereClause });
  return !!user;
};

/**
 * Vérifie si un nœud existe par son ID
 * @param {number} nodeId - ID du nœud à vérifier
 * @returns {Promise<boolean>} True si existe, false sinon
 */
const nodeExists = async (nodeId) => {
  const node = await Node.findByPk(nodeId);
  return !!node;
};

module.exports = {
  validateOrderData,
  validateUserData,
  validateFileData,
  userExists,
  nodeExists
};
