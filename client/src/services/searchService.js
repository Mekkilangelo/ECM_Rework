import api from './api';

/**
 * Service de recherche
 * Fournit des méthodes pour effectuer des recherches dans le système
 */
const searchService = {
  /**
   * Effectue une recherche avec des filtres avancés
   * @param {Object} params - Paramètres de recherche
   * @param {string} [params.q] - Terme de recherche
   * @param {string} [params.entityTypes] - Types d'entités à rechercher (clients, commandes, pièces, tests, aciers)
   * @param {number} [params.page] - Numéro de page pour la pagination
   * @param {number} [params.limit] - Nombre d'éléments par page
   * @param {string} [params.clientGroup] - Groupe de client (filtre client)
   * @param {string} [params.country] - Pays (filtre client)
   * @param {string} [params.city] - Ville (filtre client)
   * @param {string} [params.address] - Adresse (filtre client)
   * @param {string} [params.orderDate] - Date de commande (filtre commande)
   * @param {string} [params.commercial] - Commercial (filtre commande)
   * @param {string} [params.contacts] - Contacts (filtre commande)
   * @param {string} [params.partDesignation] - Désignation de pièce (filtre pièce)
   * @param {string} [params.clientDesignation] - Désignation client (filtre pièce)
   * @param {string} [params.reference] - Référence (filtre pièce)
   * @param {string} [params.steelType] - Type d'acier (filtre pièce)
   * @param {number} [params.minQuantity] - Quantité minimale (filtre pièce)
   * @param {number} [params.maxQuantity] - Quantité maximale (filtre pièce)
   * @param {number} [params.minLength] - Longueur minimale (filtre pièce)
   * @param {number} [params.maxLength] - Longueur maximale (filtre pièce)
   * @param {number} [params.minWidth] - Largeur minimale (filtre pièce)
   * @param {number} [params.maxWidth] - Largeur maximale (filtre pièce)
   * @param {number} [params.minHeight] - Hauteur minimale (filtre pièce)
   * @param {number} [params.maxHeight] - Hauteur maximale (filtre pièce)
   * @param {number} [params.minCoreHardness] - Dureté à cœur minimale (filtre pièce)
   * @param {number} [params.maxCoreHardness] - Dureté à cœur maximale (filtre pièce)
   * @param {string} [params.testStatus] - Statut du test (filtre test)
   * @param {string} [params.testLocation] - Emplacement du test (filtre test)
   * @param {string} [params.mountingType] - Type de montage (filtre test)
   * @param {string} [params.processType] - Type de processus (filtre test)
   * @param {string} [params.positionType] - Type de position (filtre test)
   * @param {string} [params.testDateFrom] - Date de début du test (filtre test)
   * @param {string} [params.testDateTo] - Date de fin du test (filtre test)
   * @param {string} [params.loadNumber] - Numéro de charge (filtre test)
   * @param {string} [params.furnaceType] - Type de four (filtre test)
   * @param {string} [params.recipeNumber] - Numéro de recette (filtre test)
   * @param {string} [params.preoxMedia] - Média de préoxydation (filtre test)
   * @param {string} [params.steelFamily] - Famille d'acier (filtre acier)
   * @param {string} [params.steelStandard] - Norme d'acier (filtre acier)
   * @param {string} [params.steelGrade] - Nuance d'acier (filtre acier)
   * @param {string} [params.equivalent] - Équivalent (filtre acier)
   * @param {string} [params.chemicalElement] - Élément chimique (filtre acier)
   * @returns {Promise<Object>} Résultats de recherche et métadonnées de pagination
   * @throws {Error} En cas d'échec de la requête
   */
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
      if (params.city) queryParams.append('city', params.city);      if (params.address) queryParams.append('address', params.address);
      
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
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          results: response.data.data,
          pagination: response.data.pagination,
          metadata: response.data.metadata
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw error;
    }
  },
  
  /**
   * Récupère des suggestions de recherche basées sur un terme partiel
   * @param {string} query - Terme de recherche partiel
   * @returns {Promise<Array>} Liste des suggestions
   * @throws {Error} En cas d'échec de la requête
   */
  getSuggestions: async (query) => {
    try {
      const response = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {      console.error('Erreur lors de la récupération des suggestions:', error);
      throw error;
    }
  }
};

export default searchService;