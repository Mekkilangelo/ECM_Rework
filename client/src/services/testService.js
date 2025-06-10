import api from './api';

/**
 * Service de gestion des tests
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD sur les tests
 */
const testService = {
  /**
   * Récupère la liste des tests avec pagination
   * @param {string|number} parent_id - Identifiant de la pièce associée (optionnel)
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des tests et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  getTests: async (parent_id, page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      const response = await api.get('/tests', { 
        params: { parent_id, offset, limit } 
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          tests: response.data.data,
          pagination: response.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tests:', error);
      throw error;
    }
  },
  
  /**
   * Récupère un test par son identifiant
   * @param {string|number} id - L'identifiant du test
   * @returns {Promise<Object>} Les données du test
   * @throws {Error} En cas d'échec de la requête
   */
  getTest: async (id) => {
    try {
      const response = await api.get(`/tests/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du test ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée un nouveau test
   * @param {Object} data - Les données du test à créer
   * @returns {Promise<Object>} Le test créé
   * @throws {Error} En cas d'échec de la requête
   */
  createTest: async (data) => {
    try {
      const response = await api.post('/tests', data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du test:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour un test existant
   * @param {string|number} id - L'identifiant du test
   * @param {Object} data - Les nouvelles données du test
   * @returns {Promise<Object>} Le test mis à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updateTest: async (id, data) => {
    try {
      const response = await api.put(`/tests/${id}`, data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du test ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un test
   * @param {string|number} id - L'identifiant du test à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   * @throws {Error} En cas d'échec de la requête
   */
  deleteTest: async (id) => {
    try {
      const response = await api.delete(`/tests/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du test ${id}:`, error);
      throw error;
    }
  },
  /**
   * Récupère les spécifications d'un test
   * @param {string|number} testId - L'identifiant du test
   * @param {string|number} parentId - L'identifiant du parent (optionnel)
   * @returns {Promise<Object>} Les spécifications du test
   * @throws {Error} En cas d'échec de la requête
   */
  getTestSpecs: async (testId, parentId) => {
    try {
      console.log(`Récupération des spécifications pour test #${testId}, parentId=${parentId || 'non spécifié'}`);
      
      // Si parentId est null, undefined ou vide, ne pas l'inclure dans les paramètres
      const params = {};
      if (parentId !== null && parentId !== undefined && parentId !== '') {
        params.parent_id = parentId;
      }
      
      const response = await api.get(`/tests/${testId}/specs`, { params });
        // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        console.log(`Spécifications récupérées avec succès pour test #${testId}`);
        
        // Vérifier si les spécifications sont une chaîne JSON et les parser si nécessaire
        let specs = response.data.data.specifications || [];
        if (typeof specs === 'string') {
          try {
            specs = JSON.parse(specs);
          } catch (e) {
            console.error('Erreur lors du parsing des spécifications:', e);
            specs = {};
          }
        }
        
        // Standardiser le format de retour pour faciliter l'utilisation dans les composants
        return {
          testId: response.data.data.testId,
          testName: response.data.data.testName,
          specifications: specs
        };
      }
      
      // Pour assurer la compatibilité avec les anciens formats
      if (response.data) {
        // Vérifier si les spécifications sont une chaîne JSON et les parser si nécessaire
        let specs = response.data.specifications || [];
        if (typeof specs === 'string') {
          try {
            specs = JSON.parse(specs);
          } catch (e) {
            console.error('Erreur lors du parsing des spécifications:', e);
            specs = {};
          }
        }
        
        return {
          ...response.data,
          specifications: specs
        };
      }
      
      return { specifications: [] };
    } catch (error) {
      console.error(`Erreur lors de la récupération des spécifications du test ${testId}:`, error);
      console.error('Détails de l\'erreur:', error.response?.data || 'Pas de données dans la réponse');
      throw error;
    }
  },
    
  /**
   * Récupère les données du rapport d'un test
   * @param {string|number} testId - L'identifiant du test
   * @param {Array} selectedSections - Les sections du rapport à récupérer
   * @returns {Promise<Object>} Les données du rapport
   * @throws {Error} En cas d'échec de la requête
   */  getTestReportData: async (testId, selectedSections) => {
    try {
      console.log(`Récupération des données de rapport pour test ${testId}`, selectedSections);
      const response = await api.get(`/tests/${testId}/report`, { 
        params: { 
          sections: JSON.stringify(selectedSections) 
        } 
      });
      
      console.log('Réponse brute du serveur:', response);
      console.log('Données de la réponse:', response.data);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        console.log('Format API success détecté, retour de response.data.data');
        return response.data.data;
      }
      console.log('Format direct détecté, retour de response.data');
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données du rapport pour le test ${testId}:`, error);
      throw error;
    }
  }
};

export default testService;