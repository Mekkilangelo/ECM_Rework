const { User } = require('../models');
const crypto = require('crypto');

/**
 * Enregistrer un nouvel utilisateur
 * @route POST /api/users/register
 */
const register = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Vérifiez que les informations sont complètes
    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis (username, password, role)' });
    }

    // Vérifiez si le rôle est valide
    const validRoles = ['admin', 'user', 'superuser'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Le rôle doit être l'un de : ${validRoles.join(', ')}` });
    }

    // Vérifiez que l'utilisateur connecté a le droit d'attribuer ce rôle
    if (req.user.role !== 'superuser' && role === 'superuser') {
      return res.status(403).json({ message: 'Vous n\'avez pas les droits pour créer un superuser' });
    }

    // Vérifiez qu'il n'existe pas déjà
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur existe déjà.' });
    }

    // Créez et enregistrez l'utilisateur
    const newUser = await User.create({
      username,
      password_hash: password,
      role
    });

    return res.status(201).json({ message: 'Utilisateur enregistré avec succès.', user: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement de l\'utilisateur.' });
  }
};

/**
 * Récupérer tous les utilisateurs
 * @route GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'created_at']
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
  }
};

/**
 * Récupérer un utilisateur par son ID
 * @route GET /api/users/:userId
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: ['id', 'username', 'role', 'created_at']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur.' });
  }
};

/**
 * Mettre à jour les rôles des utilisateurs
 * @route PUT /api/users/roles
 */
const updateUsersRoles = async (req, res) => {
  const { users } = req.body;
  
  if (!users || !Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: 'Aucun utilisateur à mettre à jour.' });
  }
  
  try {
    const validRoles = ['admin', 'user', 'superuser'];
    const userRole = req.user.role;
    const updatedUsers = [];
    
    // Parcourir tous les utilisateurs à mettre à jour
    for (const userData of users) {
      const { id, role } = userData;
      
      if (!id || !role) {
        continue; // Ignorer les entrées incomplètes
      }
      
      if (!validRoles.includes(role)) {
        continue; // Ignorer les rôles invalides
      }
      
      // Vérifier que l'utilisateur a le droit de modifier ce rôle
      if (userRole !== 'superuser' && role === 'superuser') {
        continue; // Un admin ne peut pas attribuer le rôle superuser
      }
      
      // Vérifier que l'utilisateur existe
      const userToUpdate = await User.findByPk(id);
      if (!userToUpdate) {
        continue; // Ignorer les utilisateurs qui n'existent pas
      }
      
      // Ne pas permettre de modifier son propre rôle
      if (userToUpdate.id === req.user.id) {
        continue;
      }
      
      // Ne pas permettre à un admin de modifier un superuser
      if (userRole === 'admin' && userToUpdate.role === 'superuser') {
        continue;
      }
      
      // Mettre à jour le rôle
      userToUpdate.role = role;
      await userToUpdate.save();
      updatedUsers.push(userToUpdate);
    }
    
    return res.status(200).json({
      message: `${updatedUsers.length} utilisateur(s) mis à jour avec succès.`,
      users: updatedUsers
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour des rôles.' });
  }
};

/**
 * Supprimer un utilisateur
 * @route DELETE /api/users/:userId
 */
const deleteUser = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    // Ne pas permettre de supprimer son propre compte
    if (user.id === req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }
    
    // Ne pas permettre à un admin de supprimer un superuser
    if (req.user.role === 'admin' && user.role === 'superuser') {
      return res.status(403).json({ message: 'Vous n\'avez pas les droits pour supprimer un superuser.' });
    }
    
    await user.destroy();
    return res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
  }
};

/**
 * Récupérer l'utilisateur actuel
 * @route GET /api/users/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'created_at']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur actuel:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur.' });
  }
};

/**
 * Régénérer le mot de passe d'un utilisateur
 * @route POST /api/users/:userId/reset-password
 */
const resetPassword = async (req, res) => {
  const userId = req.params.userId;
  
  try {
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    
    // Ne pas permettre de réinitialiser le mot de passe d'un superuser si on n'est pas superuser
    if (req.user.role !== 'superuser' && user.role === 'superuser') {
      return res.status(403).json({ 
        message: 'Vous n\'avez pas les droits pour réinitialiser le mot de passe d\'un superuser.' 
      });
    }
    
    // Générer un nouveau mot de passe aléatoire
    const newPassword = generateRandomPassword(12);
    
    // Mettre à jour le mot de passe de l'utilisateur
    user.password_hash = newPassword;
    await user.save();
    
    return res.status(200).json({ 
      message: 'Mot de passe réinitialisé avec succès.', 
      newPassword
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      message: 'Erreur serveur lors de la réinitialisation du mot de passe.' 
    });
  }
};

/**
 * Générer un mot de passe aléatoire
 * @param {number} length - Longueur du mot de passe
 * @returns {string} - Mot de passe généré
 */
const generateRandomPassword = (length = 12) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

module.exports = {
  register,
  getUsers,
  getUserById,
  updateUsersRoles,
  deleteUser,
  getCurrentUser,
  resetPassword
};