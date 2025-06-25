import api from './api';

/**
 * Service de gestion des aciers
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD et de recherche sur les aciers
 */
const steelService = {  /**
   * Récupère tous les aciers avec pagination, tri et recherche
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @param {string} sortBy - Champ de tri (optionnel)
   * @param {string} sortOrder - Ordre de tri: 'asc' ou 'desc' (optionnel)
   * @param {string} search - Terme de recherche optionnel
   * @returns {Promise<Object>} Données des aciers et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */    getSteels: async (page = 1, limit = 10, sortBy = null, sortOrder = 'asc', search = '') => {
    try {
      // Logs condensés uniquement en mode debug
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev && search) {
        console.log('🔍 Recherche aciers:', { search, page, limit });
      }
      
      const params = { 
        limit, 
        offset: (page - 1) * limit 
      };
      
      // Ajouter les paramètres de tri si fournis
      if (sortBy) {
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }
      
      // Ajouter le paramètre de recherche s'il est fourni
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      const response = await api.get('/steels', { params });
      
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
      console.error('Détails de l\'erreur:', error.response?.data);
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
      console.log('=== FRONTEND steelService.getSteelGrades called ===');
      
      const response = await api.get('/steels/grades');
      
      console.log('Réponse brute grades:', response);
      console.log('Données grades:', response.data);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        console.log('Grades formatés:', response.data.data);
        return response.data.data;
      }
      
      console.log('Retour grades brutes:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des nuances d\'acier:', error);
      console.error('Détails de l\'erreur grades:', error.response?.data);
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
    }  }
};

// Ajouter un alias pour maintenir la compatibilité
steelService.getAllSteels = steelService.getSteels;

export default steelService;
