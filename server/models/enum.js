const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Enum = sequelize.define('enum', {
    // Modèle virtuel pour la gestion des énumérations
  }, {
    tableName: 'enums',
    timestamps: false,
    freezeTableName: true
  });

  // Récupérer toutes les colonnes ENUM de la base de données
  Enum.getAllEnums = async function() {
    try {
      // Requête pour récupérer les colonnes ENUM
      const query = `
        SELECT 
          TABLE_NAME AS tableName, 
          COLUMN_NAME AS columnName, 
          COLUMN_TYPE AS enumType
        FROM 
          INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_SCHEMA = DATABASE() 
          AND COLUMN_TYPE LIKE 'enum%'
        ORDER BY 
          TABLE_NAME, COLUMN_NAME
      `;
      
      const [results] = await sequelize.query(query);
      
      return results.map(row => {
        const enumValues = extractEnumValues(row.enumType);
        
        return {
          tableName: row.tableName,
          columnName: row.columnName,
          values: enumValues
        };
      });
    } catch (error) {
      console.error('Error retrieving all ENUMs:', error);
      throw error;
    }
  };

  // Récupérer les ENUM d'une table spécifique
  Enum.getEnumsByTable = async function(tableName) {
    try {
      const query = `
        SELECT 
          COLUMN_NAME AS columnName, 
          COLUMN_TYPE AS enumType
        FROM 
          INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ? 
          AND COLUMN_TYPE LIKE 'enum%'
        ORDER BY 
          COLUMN_NAME
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [tableName]
      });
      
      return results.map(row => {
        const enumValues = extractEnumValues(row.enumType);
        
        return {
          columnName: row.columnName,
          values: enumValues
        };
      });
    } catch (error) {
      console.error(`Error retrieving ENUMs for table ${tableName}:`, error);
      throw error;
    }
  };

  // Récupérer les valeurs d'une colonne ENUM spécifique
  Enum.getEnumValues = async function(tableName, columnName) {
    try {
      const query = `
        SELECT 
          COLUMN_TYPE AS enumType
        FROM 
          INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ? 
          AND COLUMN_NAME = ? 
          AND COLUMN_TYPE LIKE 'enum%'
      `;
      
      const [results] = await sequelize.query(query, {
        replacements: [tableName, columnName]
      });
      
      if (!results || results.length === 0) {
        return { 
          error: `No ENUM column found with name ${columnName} in table ${tableName}` 
        };
      }
      
      const enumValues = extractEnumValues(results[0].enumType);
      
      return { 
        tableName, 
        columnName, 
        values: enumValues 
      };
    } catch (error) {
      console.error(`Error retrieving ENUM values for ${tableName}.${columnName}:`, error);
      throw error;
    }
  };

  // Fonction utilitaire pour extraire les valeurs d'énumération
  function extractEnumValues(enumString) {
    let enumValues = [];
    
    if (enumString && enumString.startsWith('enum(')) {
      const match = enumString.match(/^enum\((.*)\)$/);
      if (match && match[1]) {
        // Extraction compatible entre Windows et Linux
        enumValues = match[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
          .map(val => val.trim().replace(/^'|'$/g, ''))
          .sort();
      }
    }
    
    return enumValues;
  }

  return Enum;
};