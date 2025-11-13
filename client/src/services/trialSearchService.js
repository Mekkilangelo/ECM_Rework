import api from './api';

/**
 * Service de recherche d'essais
 * API moderne et simplifiée pour rechercher des essais
 */
const trialSearchService = {
  /**
   * Recherche d'essais avec filtres avancés
   * @param {Object} filters - Filtres de recherche
   * @returns {Promise<Object>} Résultats de la recherche
   */
  searchTrials: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Paramètres de base
      if (filters.query) queryParams.append('query', filters.query);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

      // Filtres sur l'essai
      if (filters.trialCode) queryParams.append('trialCode', filters.trialCode);
      if (filters.loadNumber) queryParams.append('loadNumber', filters.loadNumber);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.mountingType) queryParams.append('mountingType', filters.mountingType);
      if (filters.positionType) queryParams.append('positionType', filters.positionType);
      if (filters.processType) queryParams.append('processType', filters.processType);
      if (filters.trialDateFrom) queryParams.append('trialDateFrom', filters.trialDateFrom);
      if (filters.trialDateTo) queryParams.append('trialDateTo', filters.trialDateTo);

      // Filtres sur le client
      if (filters.clientName) queryParams.append('clientName', filters.clientName);
      if (filters.clientCode) queryParams.append('clientCode', filters.clientCode);
      if (filters.clientCountry) queryParams.append('clientCountry', filters.clientCountry);
      if (filters.clientCity) queryParams.append('clientCity', filters.clientCity);
      if (filters.clientGroup) queryParams.append('clientGroup', filters.clientGroup);

      // Filtres sur la pièce
      if (filters.partName) queryParams.append('partName', filters.partName);
      if (filters.partDesignation) queryParams.append('partDesignation', filters.partDesignation);
      if (filters.partReference) queryParams.append('partReference', filters.partReference);
      if (filters.partClientDesignation) queryParams.append('partClientDesignation', filters.partClientDesignation);

      // Filtres sur l'acier
      if (filters.steelGrade) queryParams.append('steelGrade', filters.steelGrade);
      if (filters.steelFamily) queryParams.append('steelFamily', filters.steelFamily);
      if (filters.steelStandard) queryParams.append('steelStandard', filters.steelStandard);

      // Filtres sur le four
      if (filters.furnaceType) queryParams.append('furnaceType', filters.furnaceType);
      if (filters.furnaceSize) queryParams.append('furnaceSize', filters.furnaceSize);
      if (filters.heatingCell) queryParams.append('heatingCell', filters.heatingCell);
      if (filters.coolingMedia) queryParams.append('coolingMedia', filters.coolingMedia);
      if (filters.quenchCell) queryParams.append('quenchCell', filters.quenchCell);

      // Filtres sur la recette
      if (filters.recipeNumber) queryParams.append('recipeNumber', filters.recipeNumber);

      const response = await api.get(`/trials/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'essais:', error);
      throw error;
    }
  },

  /**
   * Récupère les options disponibles pour les filtres
   * @returns {Promise<Object>} Options de filtrage
   */
  getFilterOptions: async () => {
    try {
      const response = await api.get('/trials/filter-options');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des options de filtres:', error);
      throw error;
    }
  }
};

export default trialSearchService;
