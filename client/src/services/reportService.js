/**
 * Service de génération de rapports
 * Gère les appels API pour la génération de rapports de tests
 */

import api from './api';

const reportService = {
  /**
   * Récupère les données d'un rapport de test
   * @param {number} testId - ID du test
   * @param {Object|Array} sections - Sections à inclure dans le rapport
   * @returns {Promise<Object>} Données du rapport
   */
  getTestReportData: async (testId, sections = {}) => {
    try {
      // Normaliser les sections en objet si c'est un tableau
      let sectionsParam = sections;
      if (Array.isArray(sections)) {
        sectionsParam = sections.reduce((acc, section) => {
          acc[section] = true;
          return acc;
        }, {});
      }

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (Object.keys(sectionsParam).length > 0) {
        params.append('sections', JSON.stringify(sectionsParam));
      }

      const url = `/reports/tests/${testId}${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données du rapport pour le test ${testId}:`, error);
      throw error;
    }
  }
};

export default reportService;
