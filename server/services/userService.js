/**
 * Service de gestion des utilisateurs
 * Contient la logique métier liée aux opérations sur les utilisateurs
 */

const { User } = require('../models');
const { sequelize, Sequelize } = require('../models');
const { Op } = Sequelize;
const { hashPassword } = require('../config/auth');
const { 
  NotFoundError, 
  ValidationError, 
  AuthorizationError,
  ConflictError 
} = require('../utils/errors');
const { validateUserData, userExists } = require('../utils/validators');

/**
 * Récupère tous les utilisateurs avec pagination
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Promise<Object>} Liste paginée des utilisateurs
 */
const getAllUsers = async (options = {}) => {
  const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = options;
  
  const users = await User.findAndCountAll({
    attributes: ['id', 'username', 'role', 'created_at'],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  return {
    users: users.rows,
    pagination: {
      total: users.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
};

/**
 * Récupère un utilisateur par son ID
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Object>} Détails de l'utilisateur
 */
const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'role', 'created_at']
  });
  
  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }
  
  return user;
};

/**
 * Crée un nouvel utilisateur
 * @param {Object} userData - Données du nouvel utilisateur
 * @param {Object} currentUser - Utilisateur qui fait la requête
 * @returns {Promise<Object>} Utilisateur créé
 */
const createUser = async (userData, currentUser) => {
  // Validation des données
  const validationResult = validateUserData({...userData, isNew: true});
  if (!validationResult.isValid) {
    throw new ValidationError('Données utilisateur invalides', validationResult.errors);
  }
  
  const { username, password, role } = userData;
  
  // Vérification des droits d'accès
  if (currentUser.role !== 'superuser' && role === 'superuser') {
    throw new AuthorizationError('Vous n\'avez pas les droits pour créer un superuser');
  }
  
  // Vérification que l'utilisateur n'existe pas déjà
  const exists = await userExists(username);
  if (exists) {
    throw new ConflictError('Ce nom d\'utilisateur existe déjà');
  }
    // Création de l'utilisateur
  const newUser = await User.create({
    username,
    password_hash: password, // Ne pas hacher ici, le hook beforeCreate du modèle le fera
    role,
    created_at: new Date()
  });
  
  // Retourner l'utilisateur sans le mot de passe
  return {
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    created_at: newUser.created_at
  };
};

/**
 * Met à jour un utilisateur
 * @param {number} userId - ID de l'utilisateur à mettre à jour
 * @param {Object} userData - Nouvelles données
 * @param {Object} currentUser - Utilisateur qui fait la requête
 * @returns {Promise<Object>} Utilisateur mis à jour
 */
const updateUser = async (userId, userData, currentUser) => {
  // Récupérer l'utilisateur existant
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }
  
  // Validation des autorisations
  if (userData.role === 'superuser' && currentUser.role !== 'superuser') {
    throw new AuthorizationError('Vous n\'avez pas les droits pour attribuer le rôle superuser');
  }
  
  if (user.role === 'superuser' && currentUser.role !== 'superuser' && user.id !== currentUser.id) {
    throw new AuthorizationError('Vous ne pouvez pas modifier un superuser');
  }
  
  // Validation des données
  const validationResult = validateUserData(userData);
  if (!validationResult.isValid) {
    throw new ValidationError('Données utilisateur invalides', validationResult.errors);
  }
  
  // Vérifier si le nouveau nom d'utilisateur existe déjà
  if (userData.username && userData.username !== user.username) {
    const exists = await userExists(userData.username, userId);
    if (exists) {
      throw new ConflictError('Ce nom d\'utilisateur existe déjà');
    }
  }
    // Préparation des données à mettre à jour
  const updateData = {};
    if (userData.username) updateData.username = userData.username;
  if (userData.role) updateData.role = userData.role;
  if (userData.password) updateData.password_hash = userData.password; // Ne pas hacher ici, le hook beforeUpdate du modèle le fera
  
  // Note: modified_at field removed as it doesn't exist in the database
  
  // Mise à jour de l'utilisateur
  await user.update(updateData);
    // Récupérer les données mises à jour
  const updatedUser = await User.findByPk(userId, {
    attributes: ['id', 'username', 'role', 'created_at']
  });
  
  return updatedUser;
};

/**
 * Supprime un utilisateur
 * @param {number} userId - ID de l'utilisateur à supprimer
 * @param {Object} currentUser - Utilisateur qui fait la requête
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteUser = async (userId, currentUser) => {
  // Récupérer l'utilisateur à supprimer
  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }
  
  // Vérifications de sécurité
  if (user.role === 'superuser' && currentUser.role !== 'superuser') {
    throw new AuthorizationError('Vous ne pouvez pas supprimer un superuser');
  }
  
  // Empêcher la suppression de son propre compte
  if (userId === currentUser.id) {
    throw new ValidationError('Vous ne pouvez pas supprimer votre propre compte');
  }
  
  // Supprimer l'utilisateur
  await user.destroy();
  return true;
};

/**
 * Met à jour le rôle d'un groupe d'utilisateurs
 * @param {Array} userRoles - Liste des {id, role} à mettre à jour
 * @param {Object} currentUser - Utilisateur qui fait la requête
 * @returns {Promise<Object>} Résultat de l'opération
 */
const updateUsersRoles = async (userRoles, currentUser) => {
  const transaction = await sequelize.transaction();
  
  try {
    const validRoles = ['admin', 'user', 'superuser'];
    const results = {
      success: [],
      failed: []
    };
    
    for (const userRole of userRoles) {
      const { id, role } = userRole;
      
      try {
        // Validation du rôle
        if (!validRoles.includes(role)) {
          throw new ValidationError(`Rôle invalide: ${role}`);
        }
        
        // Récupérer l'utilisateur
        const user = await User.findByPk(id, { transaction });
        if (!user) {
          throw new NotFoundError(`Utilisateur #${id} non trouvé`);
        }
        
        // Vérifier les droits
        if (role === 'superuser' && currentUser.role !== 'superuser') {
          throw new AuthorizationError('Droits insuffisants pour attribuer le rôle superuser');
        }
        
        if (user.role === 'superuser' && currentUser.role !== 'superuser') {
          throw new AuthorizationError('Droits insuffisants pour modifier un superuser');
        }
        
        // Mettre à jour le rôle
        await user.update({ 
          role, 
          modified_at: new Date() 
        }, { transaction });
        
        results.success.push({ id, role });
      } catch (error) {
        results.failed.push({ id, role, error: error.message });
      }
    }
    
    // Valider la transaction si au moins une mise à jour réussie
    if (results.success.length > 0) {
      await transaction.commit();
    } else {
      await transaction.rollback();
      throw new ValidationError('Aucune mise à jour n\'a réussi', { failedUpdates: results.failed });
    }
    
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUsersRoles
};
