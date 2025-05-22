import api from './api';

/**
 * Service de gestion des nœuds
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations sur les nœuds
 */
const nodeService = {
  /**
   * Nettoie les données des nœuds (suppression complète)
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  cleanData: async () => {
    try {
      const response = await api.delete('/nodes/');
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors du nettoyage des données:', error);
      throw error.response?.data || { message: 'Erreur lors du nettoyage des données' };
    }
  }
};

export default nodeService;