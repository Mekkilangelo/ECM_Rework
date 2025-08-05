/**
 * Controller de gestion des utilisateurs
 * Gère les opérations CRUD sur les utilisateurs
 */

const { userService } = require('../services');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { ValidationError, AuthorizationError } = require('../utils/errors');

/**
 * Création du premier utilisateur du système (sans authentification)
 * @route POST /api/users/first-user
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Premier utilisateur créé
 */
const createFirstUser = async (req, res, next) => {
  try {
    const userData = req.body;
    
    // Vérifier s'il y a déjà des utilisateurs dans le système
    const userCount = await userService.getUserCount();
    
    // Cette route ne fonctionne que s'il n'y a aucun utilisateur dans la base
    if (userCount > 0) {
      logger.warn('Tentative de création du premier utilisateur alors que des utilisateurs existent déjà', {
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        message: 'Impossible de créer le premier utilisateur : des utilisateurs existent déjà'
      });
    }
    
    // S'assurer que le premier utilisateur est un superuser
    userData.role = 'superuser';
    
    logger.info('Création du premier utilisateur (superuser)', { 
      username: userData.username,
      role: userData.role
    });
    
    // Créer le premier utilisateur
    const newUser = await userService.createFirstUser(userData);
    
    return apiResponse.success(
      res,
      newUser,
      'Premier utilisateur créé avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création du premier utilisateur: ${error.message}`, error);
    next(error);
  }
};

/**
 * Enregistre un nouvel utilisateur (nécessite des droits admin/superuser)
 * @route POST /api/users/register
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Utilisateur créé
 */
const register = async (req, res, next) => {
  try {
    const userData = req.body;
    const currentUser = req.user;
    
    // Cette route est protégée par adminWriteAccess, donc currentUser existe forcément
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superuser')) {
      return res.status(403).json({
        success: false,
        message: 'Droits administrateur requis pour créer un utilisateur'
      });
    }
    
    logger.info('Création d\'un nouvel utilisateur', { 
      username: userData.username,
      role: userData.role,
      by: currentUser.username
    });
    
    // Déléguer au service
    const createdUser = await userService.createUser(userData, currentUser);
    
    return apiResponse.success(
      res,
      createdUser,
      'Utilisateur enregistré avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de l'enregistrement de l'utilisateur: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère tous les utilisateurs avec pagination
 * @route GET /api/users
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des utilisateurs
 */
const getUsers = async (req, res, next) => {
  try {
    const { limit, offset, sortBy, sortOrder } = req.pagination || {
      limit: 10,
      offset: 0,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };
    
    logger.info('Récupération des utilisateurs', { 
      limit, 
      offset, 
      sortBy, 
      sortOrder 
    });
    
    // Déléguer au service
    const result = await userService.getAllUsers({
      limit,
      offset,
      sortBy,
      sortOrder
    });
    
    return apiResponse.paginated(
      res,
      result.users,
      result.pagination,
      'Utilisateurs récupérés avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des utilisateurs: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère un utilisateur par son ID
 * @route GET /api/users/:userId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails de l'utilisateur
 */
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Récupération de l'utilisateur #${userId}`);
    
    // Déléguer au service
    const user = await userService.getUserById(userId);
    
    return apiResponse.success(res, user, 'Utilisateur récupéré avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'utilisateur #${req.params.userId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour les rôles des utilisateurs
 * @route PUT /api/users/roles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Résultat de la mise à jour
 */
const updateUsersRoles = async (req, res, next) => {
  try {
    const { users } = req.body;
    const currentUser = req.user;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      throw new ValidationError('Aucun utilisateur à mettre à jour');
    }
    
    logger.info(`Mise à jour des rôles pour ${users.length} utilisateur(s)`, {
      by: currentUser.username
    });
    
    // Déléguer au service
    const result = await userService.updateUsersRoles(users, currentUser);
    
    return apiResponse.success(res, result, 'Rôles mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour des rôles: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour un utilisateur
 * @route PUT /api/users/:userId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Utilisateur mis à jour
 */
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userData = req.body;
    const currentUser = req.user;
    
    logger.info(`Mise à jour de l'utilisateur #${userId}`, {
      by: currentUser.username
    });
    
    // Déléguer au service
    const updatedUser = await userService.updateUser(userId, userData, currentUser);
    
    return apiResponse.success(res, updatedUser, 'Utilisateur mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'utilisateur #${req.params.userId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime un utilisateur
 * @route DELETE /api/users/:userId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    
    if (parseInt(userId) === currentUser.id) {
      throw new ValidationError('Vous ne pouvez pas supprimer votre propre compte');
    }
    
    logger.info(`Suppression de l'utilisateur #${userId}`, {
      by: currentUser.username
    });
    
    // Déléguer au service
    await userService.deleteUser(userId, currentUser);
    
    return apiResponse.success(res, { deletedId: userId }, 'Utilisateur supprimé avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'utilisateur #${req.params.userId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère l'utilisateur actuellement connecté
 * @route GET /api/users/me
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Informations de l'utilisateur connecté
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Réutiliser la méthode getUserById
    const user = await userService.getUserById(userId);
    
    return apiResponse.success(res, user, 'Profil récupéré avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération du profil: ${error.message}`, error);
    next(error);
  }
};

/**
 * Génère un mot de passe aléatoire
 * @param {number} length - Longueur du mot de passe
 * @returns {string} Mot de passe généré
 */
const generateRandomPassword = (length = 12) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

/**
 * Réinitialise le mot de passe d'un utilisateur
 * @route POST /api/users/:userId/reset-password
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Nouveau mot de passe
 */
const resetPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    
    logger.info(`Réinitialisation du mot de passe pour l'utilisateur #${userId}`, {
      by: currentUser.username
    });
    
    // Récupérer l'utilisateur
    const user = await userService.getUserById(userId);
    
    // Vérifier les droits
    if (user.role === 'superuser' && currentUser.role !== 'superuser') {
      throw new AuthorizationError('Vous n\'avez pas les droits pour réinitialiser le mot de passe d\'un superuser');
    }
    
    // Générer un nouveau mot de passe
    const newPassword = generateRandomPassword(12);
    
    // Mettre à jour l'utilisateur avec le nouveau mot de passe
    await userService.updateUser(userId, { password: newPassword }, currentUser);
    
    return apiResponse.success(res, { newPassword }, 'Mot de passe réinitialisé avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la réinitialisation du mot de passe: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  register,
  createFirstUser,
  getUsers,
  getUserById,
  updateUsersRoles,
  updateUser,
  deleteUser,
  getCurrentUser,
  resetPassword
};