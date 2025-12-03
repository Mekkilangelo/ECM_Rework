import api from './api';

/**
 * Service de gestion des demandes d'essai (trial requests)
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD sur les demandes d'essai
 */
const trialRequestService = {  /**
   * Récupère la liste des demandes d'essai avec pagination et recherche
   * @param {string|number} clientId - Identifiant du client (optionnel)
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @param {string} sortBy - Champ de tri
   * @param {string} sortOrder - Ordre de tri (asc/desc)
   * @param {string} search - Terme de recherche optionnel
   * @returns {Promise<Object>} Données des demandes d'essai et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  getTrialRequests: async (clientId, page = 1, limit = 10, sortBy = 'modified_at', sortOrder = 'desc', search = '') => {
    try {
      const params = { 
        clientId, 
        page, 
        limit, 
        sortBy, 
        sortOrder 
      };
      
      // Ajouter le paramètre de recherche s'il est fourni
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      const response = await api.get('/trial-requests', { params });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          trialRequests: response.data.data,
          pagination: response.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes d\'essai:', error);
      throw error;
    }
  },
  
  /**
   * Récupère une demande d'essai par son identifiant
   * @param {string|number} id - L'identifiant de la demande d'essai
   * @returns {Promise<Object>} Les données de la demande d'essai
   * @throws {Error} En cas d'échec de la requête
   */
  getTrialRequest: async (id) => {
    try {
      const response = await api.get(`/trial-requests/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la demande d'essai ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée une nouvelle demande d'essai
   * @param {Object} data - Les données de la nouvelle demande d'essai
   * @returns {Promise<Object>} Les données de la demande d'essai créée
   * @throws {Error} En cas d'échec de la requête
   */
  createTrialRequest: async (data) => {
    try {
      const response = await api.post('/trial-requests', data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la demande d\'essai:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour une demande d'essai existante
   * @param {string|number} id - L'identifiant de la demande d'essai à mettre à jour
   * @param {Object} data - Les nouvelles données de la demande d'essai
   * @returns {Promise<Object>} Les données de la demande d'essai mise à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updateTrialRequest: async (id, data) => {
    try {
      const response = await api.put(`/trial-requests/${id}`, data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la demande d'essai ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime une demande d'essai
   * @param {string|number} id - L'identifiant de la demande d'essai à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  deleteTrialRequest: async (id) => {
    try {
      const response = await api.delete(`/trial-requests/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la demande d'essai ${id}:`, error);
      throw error;
    }
  }
};

export default trialRequestService;