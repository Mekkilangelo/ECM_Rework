import api from './api';

const API_URL = '/enums';

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
    }  },
  /**
   * Récupère les valeurs d'énumération pour une colonne spécifique
   * @param {string} tableName - Nom de la table
   * @param {string} columnName - Nom de la colonne
   * @returns {Promise<Array>} Valeurs d'énumération de la colonne spécifiée
   * @throws {Error} En cas d'échec de la requête
   */
  getEnumValues: async (tableName, columnName) => {
    try {
      console.log(`[EnumService] Récupération des valeurs ENUM pour ${tableName}.${columnName}`);
      const url = `${API_URL}/table/${tableName}/column/${columnName}`;
      console.log(`[EnumService] URL de la requête: ${url}`);
      
      const response = await api.get(url);
      console.log(`[EnumService] Réponse brute de l'API:`, response);
      console.log(`[EnumService] Data de la réponse:`, response.data);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        console.log(`[EnumService] Réponse avec success=true, data:`, response.data.data);
        return response.data.data;
      }
      
      console.log(`[EnumService] Réponse sans format success, retour direct:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[EnumService] Erreur lors de la récupération des valeurs d'énumération pour ${tableName}.${columnName}:`, error);
      console.error(`[EnumService] Stack trace:`, error.stack);
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
   */
  addEnumValue: async (tableName, columnName, value) => {
    try {
      const response = await api.post(`${API_URL}/table/${tableName}/column/${columnName}`, { value });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
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
   */
  updateEnumValue: async (tableName, columnName, oldValue, newValue) => {
    try {
      const response = await api.put(`${API_URL}/table/${tableName}/column/${columnName}`, {
        oldValue,
        newValue
      });
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
   */
  deleteEnumValue: async (tableName, columnName, value) => {
    try {
      const response = await api.delete(`${API_URL}/table/${tableName}/column/${columnName}`, {
        data: { value }
      });
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
   */
  replaceAndDeleteEnumValue: async (tableName, columnName, oldValue, replacementValue) => {
    try {
      const response = await api.post(`${API_URL}/replace/${tableName}/${columnName}`, {
        oldValue,
        replacementValue
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du remplacement et de la suppression d'une valeur d'énumération dans ${tableName}.${columnName}:`, error);
      throw error;
    }
  }
};

export default enumService;