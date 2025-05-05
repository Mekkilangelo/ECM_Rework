module.exports = (sequelize, DataTypes) => {
  const Enum = sequelize.define('Enum', {
    // Modèle virtuel, pas de colonnes réelles
  }, {
    tableName: 'enums',
    timestamps: false,
    freezeTableName: true
  });

  // Récupérer toutes les colonnes ENUM de la base de données
  Enum.getAllEnums = async function() {
    try {
      // Requête pour récupérer toutes les colonnes ENUM dans la base de données
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
      
      // Formater les résultats pour extraire les valeurs d'énumération
      return results.map(row => {
        const enumString = row.enumType;
        let enumValues = [];
        
        if (enumString && enumString.startsWith('enum(')) {
          // Extraction des valeurs entre enum( et )
          const match = enumString.match(/^enum\((.*)\)$/);
          if (match && match[1]) {
            // Diviser par virgule, mais pas à l'intérieur des guillemets
            enumValues = match[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
              .map(val => val.trim().replace(/^'|'$/g, ''))
              .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })); // Tri alphabétique
          }
        }
        
        return {
          tableName: row.tableName,
          columnName: row.columnName,
          values: enumValues
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les ENUMs:', error);
      throw error;
    }
  };

  // Récupérer toutes les colonnes ENUM d'une table spécifique
  Enum.getEnumsByTable = async function(tableName) {
    try {
      // Requête pour récupérer toutes les colonnes ENUM d'une table spécifique
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
      
      // Formater les résultats pour extraire les valeurs d'énumération
      return results.map(row => {
        const enumString = row.enumType;
        let enumValues = [];
        
        if (enumString && enumString.startsWith('enum(')) {
          // Extraction des valeurs entre enum( et )
          const match = enumString.match(/^enum\((.*)\)$/);
          if (match && match[1]) {
            // Diviser par virgule, mais pas à l'intérieur des guillemets
            enumValues = match[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
              .map(val => val.trim().replace(/^'|'$/g, ''))
              .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })); // Tri alphabétique
          }
        }
        
        return {
          columnName: row.columnName,
          values: enumValues
        };
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des ENUMs pour la table ${tableName}:`, error);
      throw error;
    }
  };

  // Récupérer les valeurs d'une colonne ENUM spécifique
  Enum.getEnumValues = async function(tableName, columnName) {
    try {
      // Requête pour récupérer une colonne ENUM spécifique
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
      
      // Vérifier si la colonne existe et est de type ENUM
      if (!results || results.length === 0) {
        return { 
          error: `Aucune colonne ENUM trouvée avec le nom ${columnName} dans la table ${tableName}` 
        };
      }
      
      const enumString = results[0].enumType;
      let enumValues = [];
      
      if (enumString && enumString.startsWith('enum(')) {
        // Extraction des valeurs entre enum( et )
        const match = enumString.match(/^enum\((.*)\)$/);
        if (match && match[1]) {
          // Diviser par virgule, mais pas à l'intérieur des guillemets
          enumValues = match[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
            .map(val => val.trim().replace(/^'|'$/g, ''))
            .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })); // Tri alphabétique
        }
      }
      
      return { 
        tableName, 
        columnName, 
        values: enumValues 
      };
    } catch (error) {
      console.error(`Erreur lors de la récupération des valeurs ENUM pour ${tableName}.${columnName}:`, error);
      throw error;
    }
  };

  return Enum;
};