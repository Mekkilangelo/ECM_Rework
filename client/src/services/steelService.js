import api from './api';

/**
 * Service de gestion des aciers
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD et de recherche sur les aciers
 */
const steelService = {
  /**
   * Récupère tous les aciers avec pagination
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des aciers et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  getSteels: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/steels', { 
        params: { limit, offset: (page - 1) * limit } 
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          steels: response.data.data,
          pagination: response.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des aciers:', error);
      throw error;
    }
  },

  /**
   * Récupère toutes les nuances d'acier disponibles
   * @returns {Promise<Array>} Liste des nuances d'acier
   * @throws {Error} En cas d'échec de la requête
   */
  getSteelGrades: async () => {
    try {
      const response = await api.get('/steels/grades');
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des nuances d\'acier:', error);
      throw error;
    }
  },
  
  /**
   * Récupère un acier par son identifiant
   * @param {string|number} id - L'identifiant de l'acier
   * @returns {Promise<Object>} Les données de l'acier
   * @throws {Error} En cas d'échec de la requête
   */
  getSteel: async (id) => {
    try {
      const response = await api.get(`/steels/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'acier ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée un nouvel acier
   * @param {Object} steelData - Les données du nouvel acier
   * @returns {Promise<Object>} Les données de l'acier créé
   * @throws {Error} En cas d'échec de la requête
   */
  createSteel: async (steelData) => {
    try {
      const response = await api.post('/steels', steelData);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'acier:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour un acier existant
   * @param {string|number} id - L'identifiant de l'acier à mettre à jour
   * @param {Object} steelData - Les nouvelles données de l'acier
   * @returns {Promise<Object>} Les données de l'acier mis à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updateSteel: async (id, steelData) => {
    try {
      const response = await api.put(`/steels/${id}`, steelData);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'acier ${id}:`, error);
      throw error;
    }  },
  
  /**
   * Supprime un acier
   * @param {string|number} id - L'identifiant de l'acier à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  deleteSteel: async (id) => {
    try {
      const response = await api.delete(`/steels/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'acier ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Recherche des aciers par mot-clé
   * @param {string} query - Terme de recherche (nuance, famille, etc.)
   * @returns {Promise<Array>} Liste des aciers correspondant à la recherche
   * @throws {Error} En cas d'échec de la requête
   */
  searchSteels: async (query) => {
    try {
      const response = await api.get('/steels/search', { 
        params: { q: query } 
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la recherche d'aciers avec le terme "${query}":`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les aciers par famille
   * @param {string} family - Nom de la famille d'acier
   * @returns {Promise<Array>} Liste des aciers de la famille spécifiée
   * @throws {Error} En cas d'échec de la requête
   */
  getSteelsByFamily: async (family) => {
    try {
      const response = await api.get(`/steels/family/${family}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des aciers de la famille "${family}":`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les aciers par norme
   * @param {string} standard - Nom de la norme
   * @returns {Promise<Array>} Liste des aciers conformes à la norme spécifiée
   * @throws {Error} En cas d'échec de la requête
   */
  getSteelsByStandard: async (standard) => {
    try {
      const response = await api.get(`/steels/standard/${standard}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des aciers selon la norme "${standard}":`, error);
      throw error;
    }
  }
};

export default steelService;
