import api from './api';

/**
 * Service d'authentification
 * Gère les appels API liés à l'authentification
 */
const authService = {
  /**
   * Connexion utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise} - Promesse avec les données de connexion
   */
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Stocker le token dans le localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Déconnexion utilisateur
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  /**
   * Récupération des informations de l'utilisateur connecté
   * @returns {Promise} - Promesse avec les données utilisateur
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Récupération du token stocké
   * @returns {string|null} - Token JWT ou null
   */
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  /**
   * Vérification si un utilisateur est connecté
   * @returns {boolean} - Vrai si connecté
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Récupération de l'utilisateur stocké
   * @returns {Object|null} - Objet utilisateur ou null
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;