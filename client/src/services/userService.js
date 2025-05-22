import api from './api';

/**
 * Service de gestion des utilisateurs
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD sur les utilisateurs
 */
const userService = {
  /**
   * Récupère tous les utilisateurs
   * @returns {Promise<Array>} Liste des utilisateurs
   * @throws {Error} En cas d'échec de la requête
   */
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },

  /**
   * Récupère un utilisateur par son identifiant
   * @param {string|number} userId - L'identifiant de l'utilisateur
   * @returns {Promise<Object>} Les données de l'utilisateur
   * @throws {Error} En cas d'échec de la requête
   */
  getUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Les données du nouvel utilisateur
   * @returns {Promise<Object>} Les données de l'utilisateur créé
   * @throws {Error} En cas d'échec de la requête
   */
  createUser: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Met à jour les rôles de plusieurs utilisateurs
   * @param {Array} usersData - Tableau d'objets utilisateur avec leurs nouveaux rôles
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  updateUsersRoles: async (usersData) => {
    try {
      const response = await api.put('/users/roles', { users: usersData });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des rôles utilisateurs:', error);
      throw error;
    }
  },

  /**
   * Supprime un utilisateur
   * @param {string|number} userId - L'identifiant de l'utilisateur à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Réinitialise le mot de passe d'un utilisateur
   * @param {string|number} userId - L'identifiant de l'utilisateur
   * @returns {Promise<Object>} Données incluant le nouveau mot de passe
   * @throws {Error} En cas d'échec de la requête
   */
  resetPassword: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/reset-password`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la réinitialisation du mot de passe de l'utilisateur ${userId}:`, error);
      throw error;
    }
  },
};

export default userService;