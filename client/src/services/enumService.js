import api from './api';

// Service pour récupérer les données ENUM
const enumService = {
  // Récupérer toutes les colonnes ENUM
  getAllEnums: async () => {
    const response = await api.get(`/enums/all`);
    return response.data;
  },
  
  // Récupérer toutes les colonnes ENUM d'une table spécifique
  getEnumsByTable: async (tableName) => {
    const response = await api.get(`/enums/table/${tableName}`);
    return response.data;
  },
  
  // Récupérer les valeurs d'une colonne ENUM spécifique
  getEnumValues: async (tableName, columnName) => {
    const response = await api.get(`/enums/table/${tableName}/column/${columnName}`);
    return response.data;
  },
  
  // Récupérer les désignations de pièces
  getDesignations: async () => {
    return await enumService.getEnumValues('parts', 'designation');
  },

  
  // Récupérer les unités
  getUnits: async () => {
    try {
      // Get the units data from API
      const response = await api.get(`/enums/table/units`);
      
      console.log('Units API response:', response);
      
      const unitTypes = {
        'length_units': 'length',
        'weight_units': 'weight',
        'hardness_units': 'hardness',
        'temperature_units': 'temperature',
        'time_units': 'time',
        'pressure_units': 'pressure'
      };
      
      let units = [];
      
      // The data is in response.data.data
      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        
        // Check if data has columns property
        if (data.columns) {
          data.columns.forEach(column => {
            const unitType = unitTypes[column.columnName] || 'other';
            column.values.forEach(value => {
              units.push({
                id: value,
                name: value,
                type: unitType
              });
            });
          });
        } 
        // If data is direct object with unit types
        else if (typeof data === 'object') {
          Object.keys(data).forEach(key => {
            const unitType = unitTypes[key] || 'other';
            if (Array.isArray(data[key])) {
              data[key].forEach(value => {
                units.push({
                  id: value,
                  name: value,
                  type: unitType
                });
              });
            }
          });
        }
      }
      
      console.log('Processed units:', units);
      return units;
    } catch (error) {
      console.error('Error fetching units:', error);
      return [];
    }
  },

  // Add a new enum value
  addEnumValue: async (tableName, columnName, value) => {
    const response = await api.post(`/enums/table/${tableName}/column/${columnName}`, { value });
    return response.data;
  },

  // Update an enum value
  updateEnumValue: async (tableName, columnName, oldValue, newValue) => {
    const response = await api.put(`/enums/table/${tableName}/column/${columnName}`, { 
      oldValue, 
      newValue 
    });
    return response.data;
  },

  // Delete an enum value
  deleteEnumValue: async (tableName, columnName, value) => {
    const response = await api.delete(`/enums/table/${tableName}/column/${columnName}`, { 
      data: { value } 
    });
    return response.data;
  }

};



export default enumService;