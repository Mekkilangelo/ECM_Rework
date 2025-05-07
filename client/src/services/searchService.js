import api from './api';

const searchService = {
  // Fonction de recherche avec support pour les filtres avancés
  search: async (params) => {
    try {
      // Transformation des paramètres en chaîne de requête
      const queryParams = new URLSearchParams();
      
      // Ajouter les paramètres de base de la recherche
      if (params.q) queryParams.append('q', params.q);
      if (params.entityTypes) queryParams.append('entityTypes', params.entityTypes);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      // Ajouter les filtres pour les clients
      if (params.clientGroup) queryParams.append('clientGroup', params.clientGroup);
      if (params.country) queryParams.append('country', params.country);
      if (params.city) queryParams.append('city', params.city);
      if (params.address) queryParams.append('address', params.address);
      
      // Ajouter les filtres pour les commandes
      if (params.orderDate) queryParams.append('orderDate', params.orderDate);
      if (params.commercial) queryParams.append('commercial', params.commercial);
      if (params.contacts) queryParams.append('contacts', params.contacts);
      
      // Ajouter les filtres pour les pièces
      if (params.partDesignation) queryParams.append('partDesignation', params.partDesignation);
      if (params.clientDesignation) queryParams.append('clientDesignation', params.clientDesignation);
      if (params.reference) queryParams.append('reference', params.reference);
      if (params.steelType) queryParams.append('steelType', params.steelType);
      if (params.minQuantity) queryParams.append('minQuantity', params.minQuantity);
      if (params.maxQuantity) queryParams.append('maxQuantity', params.maxQuantity);
      
      // Ajouter les filtres de dimensions pour les pièces
      if (params.minLength) queryParams.append('minLength', params.minLength);
      if (params.maxLength) queryParams.append('maxLength', params.maxLength);
      if (params.minWidth) queryParams.append('minWidth', params.minWidth);
      if (params.maxWidth) queryParams.append('maxWidth', params.maxWidth);
      if (params.minHeight) queryParams.append('minHeight', params.minHeight);
      if (params.maxHeight) queryParams.append('maxHeight', params.maxHeight);
      
      // Ajouter les filtres de spécification pour les pièces
      if (params.minCoreHardness) queryParams.append('minCoreHardness', params.minCoreHardness);
      if (params.maxCoreHardness) queryParams.append('maxCoreHardness', params.maxCoreHardness);
      
      // Ajouter les filtres pour les tests
      if (params.testStatus) queryParams.append('testStatus', params.testStatus);
      if (params.testLocation) queryParams.append('testLocation', params.testLocation);
      if (params.mountingType) queryParams.append('mountingType', params.mountingType);
      if (params.processType) queryParams.append('processType', params.processType);
      if (params.positionType) queryParams.append('positionType', params.positionType);
      if (params.testDateFrom) queryParams.append('testDateFrom', params.testDateFrom);
      if (params.testDateTo) queryParams.append('testDateTo', params.testDateTo);
      if (params.loadNumber) queryParams.append('loadNumber', params.loadNumber);
      if (params.furnaceType) queryParams.append('furnaceType', params.furnaceType);
      if (params.recipeNumber) queryParams.append('recipeNumber', params.recipeNumber);
      if (params.preoxMedia) queryParams.append('preoxMedia', params.preoxMedia);
      
      // Ajouter les filtres pour les aciers
      if (params.steelFamily) queryParams.append('steelFamily', params.steelFamily);
      if (params.steelStandard) queryParams.append('steelStandard', params.steelStandard);
      if (params.steelGrade) queryParams.append('steelGrade', params.steelGrade);
      if (params.equivalent) queryParams.append('equivalent', params.equivalent);
      if (params.chemicalElement) queryParams.append('chemicalElement', params.chemicalElement);
      
      // Appel à l'API avec les paramètres
      const response = await api.get(`/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  },
  
  // Fonction pour obtenir les suggestions de recherche
  getSuggestions: async (query) => {
    try {
      const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Get suggestions error:', error);
      throw error;
    }
  }
};

export default searchService;