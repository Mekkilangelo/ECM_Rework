/**
 * INFRASTRUCTURE: Repository pour les données de rapport
 * Abstraction de l'API
 */

import api from '../../../../services/api';

export class ReportDataRepository {
  /**
   * Récupère les données complètes pour un rapport de trial
   */
  async getTrialReportData(trialId, sections = {}) {
    try {
      // Normaliser les sections en tableau
      let sectionsParam = sections;
      if (typeof sections === 'object' && !Array.isArray(sections)) {
        sectionsParam = Object.entries(sections)
          .filter(([_, enabled]) => enabled)
          .map(([key, _]) => key);
      }

      const params = new URLSearchParams();
      if (sectionsParam.length > 0) {
        params.append('sections', JSON.stringify(sectionsParam));
      }

      const url = `/reports/trials/${trialId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);

      const data = response.data.data || response.data;
      
      // DEBUG: Log les données reçues de l'API
      console.log('🔍 [ReportDataRepository] Données reçues de l\'API:', {
        hasPartData: !!data.partData,
        dim_weight_unit: data.partData?.dim_weight_unit,
        dim_rect_unit: data.partData?.dim_rect_unit,
        dim_circ_unit: data.partData?.dim_circ_unit,
        dim_weight_value: data.partData?.dim_weight_value,
        weightUnit: data.partData?.weightUnit,
        rectUnit: data.partData?.rectUnit
      });

      return data;

    } catch (error) {
      console.error(`Error fetching report data for trial ${trialId}:`, error);
      throw new Error(`Failed to fetch report data: ${error.message}`);
    }
  }

  /**
   * Récupère les photos pour une section spécifique
   */
  async getSectionPhotos(nodeId, category, subcategory = null) {
    try {
      const params = {
        nodeId,
        category
      };

      if (subcategory) {
        params.subcategory = subcategory;
      }

      const response = await api.get('/files', { params });
      return response.data.files || [];

    } catch (error) {
      console.error(`Error fetching section photos:`, error);
      throw new Error(`Failed to fetch section photos: ${error.message}`);
    }
  }

  /**
   * Récupère l'URL d'un fichier optimisé
   */
  getFileUrl(fileId, options = {}) {
    const { optimized = false, thumbnail = false } = options;
    
    let url = `/api/files/${fileId}/preview`;
    
    if (thumbnail) {
      url += '?thumbnail=true';
    } else if (optimized) {
      url += '?optimized=true&maxWidth=1920&quality=85';
    }

    return url;
  }
}
