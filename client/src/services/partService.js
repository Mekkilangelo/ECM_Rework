import api from './api';

/**
 * Service de gestion des pièces
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD sur les pièces
 */
const partService = {
  /**
   * Récupère la liste des pièces avec pagination
   * @param {string|number} orderId - Identifiant de la commande associée (optionnel)
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des pièces et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  getParts: async (orderId, page = 1, limit = 10) => {
    try {
      const response = await api.get('/parts', { 
        params: { orderId, page, limit } 
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          parts: response.data.data,
          pagination: response.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des pièces:', error);
      throw error;
    }
  },
  
  /**
   * Récupère une pièce par son identifiant
   * @param {string|number} id - L'identifiant de la pièce
   * @returns {Promise<Object>} Les données de la pièce
   * @throws {Error} En cas d'échec de la requête
   */
  getPart: async (id) => {
    try {
      const response = await api.get(`/parts/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la pièce ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée une nouvelle pièce
   * @param {Object} data - Les données de la nouvelle pièce
   * @returns {Promise<Object>} Les données de la pièce créée
   * @throws {Error} En cas d'échec de la requête
   */
  createPart: async (data) => {
    try {
      const response = await api.post('/parts', data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la pièce:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour une pièce existante
   * @param {string|number} id - L'identifiant de la pièce à mettre à jour
   * @param {Object} data - Les nouvelles données de la pièce
   * @returns {Promise<Object>} Les données de la pièce mise à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updatePart: async (id, data) => {
    try {
      const response = await api.put(`/parts/${id}`, data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la pièce ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime une pièce
   * @param {string|number} id - L'identifiant de la pièce à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  deletePart: async (id) => {
    try {
      const response = await api.delete(`/parts/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la pièce ${id}:`, error);
      throw error;
    }
  }
};

export default partService;