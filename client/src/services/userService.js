import api from './api';

const userService = {  // Récupérer tous les utilisateurs
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      // Si la réponse correspond au nouveau format (data + pagination)
      if (response.data && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  // Créer un nouvel utilisateur
  createUser: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      return response.data && response.data.data ? response.data.data : response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
    // Mettre à jour plusieurs utilisateurs (leurs rôles)
  updateUsersRoles: async (usersData) => {
    try {
      const response = await api.put('/users/roles', { users: usersData });
      return response.data && response.data.data ? response.data.data : response.data;
    } catch (error) {
      console.error('Error updating user roles:', error);
      throw error;
    }
  },
    // Supprimer un utilisateur
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data && response.data.data ? response.data.data : response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
    // Récupérer un utilisateur par son ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data && response.data.data ? response.data.data : response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
  
  // Réinitialiser le mot de passe d'un utilisateur
  resetPassword: async (userId) => {
    try {
      const response = await api.post(`/users/${userId}/reset-password`);
      return response.data && response.data.data ? response.data.data : response.data;
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  },
};

export default userService;