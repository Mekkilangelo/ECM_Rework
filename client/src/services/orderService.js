import api from './api';

/**
 * Service de gestion des commandes
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD sur les commandes
 */
const orderService = {
  /**
   * Récupère la liste des commandes avec pagination
   * @param {string|number} clientId - Identifiant du client (optionnel)
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des commandes et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  getOrders: async (clientId, page = 1, limit = 10) => {
    try {
      const response = await api.get('/orders', { 
        params: { clientId, page, limit } 
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          orders: response.data.data,
          pagination: response.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error;
    }
  },
  
  /**
   * Récupère une commande par son identifiant
   * @param {string|number} id - L'identifiant de la commande
   * @returns {Promise<Object>} Les données de la commande
   * @throws {Error} En cas d'échec de la requête
   */
  getOrder: async (id) => {
    try {
      const response = await api.get(`/orders/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la commande ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée une nouvelle commande
   * @param {Object} data - Les données de la nouvelle commande
   * @returns {Promise<Object>} Les données de la commande créée
   * @throws {Error} En cas d'échec de la requête
   */
  createOrder: async (data) => {
    try {
      const response = await api.post('/orders', data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour une commande existante
   * @param {string|number} id - L'identifiant de la commande à mettre à jour
   * @param {Object} data - Les nouvelles données de la commande
   * @returns {Promise<Object>} Les données de la commande mise à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updateOrder: async (id, data) => {
    try {
      const response = await api.put(`/orders/${id}`, data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la commande ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime une commande
   * @param {string|number} id - L'identifiant de la commande à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  deleteOrder: async (id) => {
    try {
      const response = await api.delete(`/orders/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la commande ${id}:`, error);
      throw error;
    }
  }
};

export default orderService;