import api from './api';

/**
 * Service de gestion des clients
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD sur les clients
 */
const clientService = {  /**
   * Récupère la liste des clients avec pagination et recherche
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @param {string} sortBy - Champ de tri
   * @param {string} sortOrder - Ordre de tri (asc/desc)
   * @param {string} search - Terme de recherche optionnel
   * @returns {Promise<Object>} Données des clients et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  getClients: async (page = 1, limit = 10, sortBy = 'modified_at', sortOrder = 'desc', search = '') => {
    try {
      const params = { 
        page, 
        limit, 
        sortBy, 
        sortOrder 
      };
      
      // Ajouter le paramètre de recherche s'il est fourni
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      const response = await api.get('/clients', { params });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          clients: response.data.data,
          pagination: response.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },
  
  /**
   * Récupère un client par son identifiant
   * @param {string|number} id - L'identifiant du client
   * @returns {Promise<Object>} Les données du client
   * @throws {Error} En cas d'échec de la requête
   */
  getClient: async (id) => {
    try {
      const response = await api.get(`/clients/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée un nouveau client
   * @param {Object} data - Les données du nouveau client
   * @returns {Promise<Object>} Les données du client créé
   * @throws {Error} En cas d'échec de la requête
   */
  createClient: async (data) => {
    try {
      const response = await api.post('/clients', data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour un client existant
   * @param {string|number} id - L'identifiant du client à mettre à jour
   * @param {Object} data - Les nouvelles données du client
   * @returns {Promise<Object>} Les données du client mis à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updateClient: async (id, data) => {
    try {
      const response = await api.put(`/clients/${id}`, data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un client
   * @param {string|number} id - L'identifiant du client à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */  deleteClient: async (id) => {
    try {
      const response = await api.delete(`/clients/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du client ${id}:`, error);
      throw error;
    }
  }
};

export default clientService;
