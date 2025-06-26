import api from './api';
import performanceMonitor from '../utils/performanceMonitor';

const API_URL = '/enums';

// Cache pour les énumérations avec timestamp
const enumCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map();

/**
 * Service de gestion des énumérations
 * Fournit des méthodes pour interagir avec l'API REST pour la gestion des valeurs d'énumération
 */
const enumService = {
  /**
   * Récupère toutes les énumérations
   * @returns {Promise<Object>} Toutes les énumérations regroupées par table et colonne
   * @throws {Error} En cas d'échec de la requête
   */
  getEnums: async () => {
    try {
      const response = await api.get(`${API_URL}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des énumérations:', error);
      throw error;
    }
  },

  /**
   * Récupère les énumérations pour une table spécifique
   * @param {string} tableName - Nom de la table
   * @returns {Promise<Object>} Énumérations de la table spécifiée
   * @throws {Error} En cas d'échec de la requête
   */
  getTableEnums: async (tableName) => {
    try {
      const response = await api.get(`${API_URL}/table/${tableName}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des énumérations pour la table ${tableName}:`, error);
      throw error;
    }  },  /**
   * Récupère les valeurs d'énumération pour une colonne spécifique
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne
   * @returns {Promise<Array>} Valeurs d'énumération de la colonne spécifiée
   * @throws {Error} En cas d'échec de la requête
   */  getEnumValues: async (tableName, columnName) => {
    try {
      // Clé de cache
      const cacheKey = `${tableName}.${columnName}`;
      const cached = enumCache.get(cacheKey);
      
      // Tracker l'appel API pour détecter les duplicatas
      performanceMonitor.trackApiCall(`enum-${cacheKey}`, cacheKey);
      
      // Vérifier si les données en cache sont encore valides
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }
      
      // Vérifier si une requête similaire est déjà en cours (debouncing)
      if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
      }
      
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log(`[EnumService] Fetching ${tableName}.${columnName}`);
      }
      
      const url = `${API_URL}/table/${tableName}/column/${columnName}`;
      
      // Créer la promesse de requête
      const requestPromise = api.get(url)
        .then(response => {
          let data;
          // Traitement de la réponse selon le nouveau format d'API
          if (response.data && response.data.success === true) {
            data = response.data.data;
          } else {
            data = response.data;
          }
          
          // Mettre en cache le résultat
          enumCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
          });
          
          return data;
        })
        .catch(error => {
          console.error(`[EnumService] Error fetching ${tableName}.${columnName}:`, error.message);
          throw error;
        })
        .finally(() => {
          // Nettoyer la requête en cours
          pendingRequests.delete(cacheKey);
        });
      
      // Mettre la requête en cache temporairement
      pendingRequests.set(cacheKey, requestPromise);
      
      return requestPromise;
    } catch (error) {
      console.error(`[EnumService] Error fetching ${tableName}.${columnName}:`, error.message);
      throw error;
    }
  },
  /**
   * Ajoute une nouvelle valeur d'énumération
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne
   * @param {string} value - Valeur à ajouter
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */  addEnumValue: async (tableName, columnName, value) => {
    try {
      const response = await api.post(`${API_URL}/table/${tableName}/column/${columnName}`, { value });
      
      // Invalider le cache pour cette clé après ajout
      const cacheKey = `${tableName}.${columnName}`;
      enumCache.delete(cacheKey);
      
      // Retourner l'objet complet avec success pour compatibilité avec useFormHandlers
      if (response.data && response.data.success === true) {
        return response.data;  // Retourner l'objet complet avec success et data
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajout d'une valeur d'énumération à ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  /**
   * Met à jour une valeur d'énumération existante
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne
   * @param {string} oldValue - Valeur existante à remplacer
   * @param {string} newValue - Nouvelle valeur
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */  updateEnumValue: async (tableName, columnName, oldValue, newValue) => {
    try {
      const response = await api.put(`${API_URL}/table/${tableName}/column/${columnName}`, {
        oldValue,
        newValue
      });
      
      // Invalider le cache pour cette clé après mise à jour
      const cacheKey = `${tableName}.${columnName}`;
      enumCache.delete(cacheKey);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour d'une valeur d'énumération dans ${tableName}.${columnName}:`, error);
      throw error;
    }  },

  /**
   * Supprime une valeur d'énumération
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne
   * @param {string} value - Valeur à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */  deleteEnumValue: async (tableName, columnName, value) => {
    try {
      const response = await api.delete(`${API_URL}/table/${tableName}/column/${columnName}`, {
        data: { value }
      });
      
      // Invalider le cache pour cette clé après suppression
      const cacheKey = `${tableName}.${columnName}`;
      enumCache.delete(cacheKey);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression d'une valeur d'énumération de ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  /**
   * Vérifie si une valeur d'énumération est utilisée dans la base de données
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne
   * @param {string} value - Valeur à vérifier
   * @returns {Promise<Object>} Informations sur l'utilisation de la valeur
   * @throws {Error} En cas d'échec de la requête
   */
  checkEnumValueUsage: async (tableName, columnName, value) => {
    try {
      const response = await api.get(`${API_URL}/usage/${tableName}/${columnName}/${value}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'utilisation d'une valeur d'énumération dans ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  /**
   * Remplace et supprime une valeur d'énumération
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne
   * @param {string} oldValue - Valeur à remplacer et supprimer
   * @param {string} replacementValue - Valeur de remplacement
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */  replaceAndDeleteEnumValue: async (tableName, columnName, oldValue, replacementValue) => {
    try {
      const response = await api.post(`${API_URL}/replace/${tableName}/${columnName}`, {
        oldValue,
        replacementValue
      });
      
      // Invalider le cache pour cette clé après modification
      const cacheKey = `${tableName}.${columnName}`;
      enumCache.delete(cacheKey);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du remplacement et de la suppression d'une valeur d'énumération dans ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  /**
   * Vide le cache des énumérations
   */
  clearCache: () => {
    enumCache.clear();
    pendingRequests.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log('[EnumService] Cache cleared');
    }
  },

  /**
   * Nettoie le cache en supprimant les entrées expirées
   */
  cleanExpiredCache: () => {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, value] of enumCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        enumCache.delete(key);
        removedCount++;
      }
    }
    
    if (process.env.NODE_ENV === 'development' && removedCount > 0) {
      console.log(`[EnumService] Removed ${removedCount} expired cache entries`);
    }
    
    return removedCount;
  }
};

export default enumService;