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
    console.log("EH OOOOH:",response.data);
    return response.data;
  },
  
  // Récupérer les désignations de pièces
  getDesignations: async () => {
    return await enumService.getEnumValues('parts', 'designation');
  },

  
  // Récupérer les unités
  getUnits: async () => {
    // Récupérer toutes les colonnes de la table units
    const response = await enumService.getEnumsByTable('units');
    
    // Transformer les résultats en un format plus facile à utiliser
    const unitTypes = {
      'length_units': 'length',
      'weight_units': 'weight',
      'hardness_units': 'hardness',
      'temperature_units': 'temperature',
      'time_units': 'time',
      'pressure_units': 'pressure'
    };
    
    // Créer un tableau plat d'unités avec leur type
    let units = [];
    if (response.data && response.data.columns) {
      response.data.columns.forEach(column => {
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
    
    return units;
  }
};

export default enumService;