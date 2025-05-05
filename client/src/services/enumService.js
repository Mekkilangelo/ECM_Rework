import api from './api';

const API_URL = '/enums';

const enumService = {
  getAllEnums: async () => {
    try {
      const response = await api.get(`${API_URL}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all enums:', error);
      throw error;
    }
  },

  getEnumsByTable: async (tableName) => {
    try {
      const response = await api.get(`${API_URL}/table/${tableName}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching enums for table ${tableName}:`, error);
      throw error;
    }
  },

  getEnumValues: async (tableName, columnName) => {
    try {
      const response = await api.get(`${API_URL}/table/${tableName}/column/${columnName}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching enum values for ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  addEnumValue: async (tableName, columnName, value) => {
    try {
      const response = await api.post(`${API_URL}/table/${tableName}/column/${columnName}`, { value });
      return response.data;
    } catch (error) {
      console.error(`Error adding enum value to ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  updateEnumValue: async (tableName, columnName, oldValue, newValue) => {
    try {
      const response = await api.put(`${API_URL}/table/${tableName}/column/${columnName}`, {
        oldValue,
        newValue
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating enum value in ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  deleteEnumValue: async (tableName, columnName, value) => {
    try {
      const response = await api.delete(`${API_URL}/table/${tableName}/column/${columnName}`, {
        data: { value }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting enum value from ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  // Nouvelles méthodes pour gérer les valeurs déjà attribuées
  checkEnumValueUsage: async (tableName, columnName, value) => {
    try {
      const response = await api.get(`${API_URL}/usage/${tableName}/${columnName}/${value}`);
      return response.data;
    } catch (error) {
      console.error(`Error checking enum value usage in ${tableName}.${columnName}:`, error);
      throw error;
    }
  },

  replaceAndDeleteEnumValue: async (tableName, columnName, oldValue, replacementValue) => {
    try {
      const response = await api.post(`${API_URL}/replace/${tableName}/${columnName}`, {
        oldValue,
        replacementValue
      });
      return response.data;
    } catch (error) {
      console.error(`Error replacing and deleting enum value in ${tableName}.${columnName}:`, error);
      throw error;
    }
  }
};

export default enumService;