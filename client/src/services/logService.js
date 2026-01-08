import api from './api';

/**
 * Service pour la gestion des logs côté frontend
 * =============================================
 * 
 * Ce service communique avec l'API backend pour récupérer,
 * filtrer et exporter les logs du système.
 */

class LogService {
  
  /**
   * Récupère la liste des logs avec pagination et filtres
   * @param {Object} params - Paramètres de requête
   * @param {number} params.page - Numéro de page
   * @param {number} params.limit - Nombre d'éléments par page
   * @param {string} params.level - Niveau de log
   * @param {string} params.action - Action
   * @param {string} params.entity - Type d'entité
   * @param {number} params.userId - ID utilisateur
   * @param {string} params.username - Nom d'utilisateur
   * @param {string} params.dateFrom - Date de début
   * @param {string} params.dateTo - Date de fin
   * @param {string} params.ipAddress - Adresse IP
   * @param {string} params.orderBy - Champ de tri
   * @param {string} params.orderDirection - Direction du tri
   * @returns {Promise<Object>} Liste des logs avec pagination
   */  async getLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Ajouter tous les paramètres non vides
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });      
      const response = await api.get(`/logs?${queryParams.toString()}`);
      
      console.log('LogService: Response data structure:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataType: typeof response.data
      });
      
      
      // Extraire les données de la structure API standardisée
      if (response.data && response.data.success && response.data.data) {
        
        return response.data.data;
      } else {
        console.error('LogService: Unexpected response structure');
        return { logs: [], total: 0, page: 1, limit: 50, totalPages: 0 };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Récupère les statistiques des logs
   * @param {string} dateFrom - Date de début (optionnel)
   * @param {string} dateTo - Date de fin (optionnel)
   * @returns {Promise<Object>} Statistiques des logs
   */  async getLogStats(dateFrom = null, dateTo = null) {
    try {
      const queryParams = new URLSearchParams();
      
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);      
      const response = await api.get(`/logs/stats?${queryParams.toString()}`);
      
      
      
      // Extraire les données de la structure API standardisée
      if (response.data && response.data.success && response.data.data) {
        
        return response.data.data;
      } else {
        console.error('LogService: Unexpected stats response structure');
        return { totalLogs: 0, errorCount: 0, warningCount: 0, todayCount: 0 };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      console.error('Stats error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }/**
   * Exporte les logs au format CSV
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise<Blob>} Fichier CSV
   */
  async exportLogs(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Ajouter tous les filtres non vides
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await api.get(`/logs/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });

      return new Blob([response.data], { type: 'text/csv' });
    } catch (error) {
      console.error('Erreur lors de l\'export des logs:', error);
      throw error;
    }
  }

  /**
   * Nettoie les anciens logs
   * @param {number} daysToKeep - Nombre de jours à conserver
   * @returns {Promise<Object>} Résultat du nettoyage
   */
  async cleanupLogs(daysToKeep = 90) {
    try {
      const response = await api.delete('/logs/cleanup', {
        data: { daysToKeep }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error);
      throw error;
    }
  }

  /**
   * Formate une date pour l'affichage
   * @param {string|Date} date - Date à formater
   * @returns {string} Date formatée
   */
  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Formate la durée en millisecondes
   * @param {number} duration - Durée en millisecondes
   * @returns {string} Durée formatée
   */
  formatDuration(duration) {
    if (!duration) return '';
    
    if (duration < 1000) {
      return `${duration}ms`;
    } else if (duration < 60000) {
      return `${(duration / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(duration / 60000);
      const seconds = ((duration % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Obtient la classe CSS pour un niveau de log
   * @param {string} level - Niveau du log
   * @returns {string} Classe CSS
   */
  getLevelClass(level) {
    const levelClasses = {
      error: 'danger',
      warning: 'warning',
      success: 'success',
      info: 'info',
      debug: 'secondary'
    };
    return levelClasses[level] || 'secondary';
  }

  /**
   * Obtient l'icône pour un niveau de log
   * @param {string} level - Niveau du log
   * @returns {string} Nom de l'icône FontAwesome
   */
  getLevelIcon(level) {
    const levelIcons = {
      error: 'ban',
      warning: 'exclamation-triangle',
      success: 'check-circle',
      info: 'info-circle',
      debug: 'bug'
    };
    return levelIcons[level] || 'info-circle';
  }

  /**
   * Obtient le libellé traduit pour un niveau de log
   * @param {string} level - Niveau du log
   * @param {Function} t - Fonction de traduction
   * @returns {string} Libellé traduit
   */
  getLevelLabel(level, t) {
    const levelLabels = {
      error: t('logs.error'),
      warning: t('logs.warning'),
      success: t('logs.success'),
      info: t('logs.info'),
      debug: t('logs.debug')
    };
    return levelLabels[level] || level;
  }
  /**
   * Valide les paramètres de filtrage
   * @param {Object} filters - Filtres à valider
   * @returns {Object} Filtres validés
   */
  validateFilters(filters) {
    const validated = { ...filters };

    // Valider les dates
    if (validated.dateFrom && validated.dateTo) {
      const from = new Date(validated.dateFrom);
      const to = new Date(validated.dateTo);
      
      if (from > to) {
        // Échanger les dates si l'ordre est inversé
        validated.dateFrom = to.toISOString();
        validated.dateTo = from.toISOString();
      }
    }

    // Valider la pagination
    if (validated.page && validated.page < 1) {
      validated.page = 1;
    }
    
    if (validated.limit && (validated.limit < 1 || validated.limit > 500)) {
      validated.limit = 50;
    }

    return validated;
  }

  /**
   * Alias pour getLogStats pour la compatibilité
   * @param {string} dateFrom - Date de début (optionnel)
   * @param {string} dateTo - Date de fin (optionnel)  
   * @returns {Promise<Object>} Statistiques des logs
   */
  async getStats(dateFrom = null, dateTo = null) {
    return this.getLogStats(dateFrom, dateTo);
  }
}

const logServiceInstance = new LogService();
export default logServiceInstance;
