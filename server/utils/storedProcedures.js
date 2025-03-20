const initStoredProcedures = async (sequelize) => {
  try {
    console.log('Initializing stored procedures for ENUM management...');
    
    // Procedure to get values of an ENUM column
    console.log('Creating GetEnumValues procedure...');
    await sequelize.query(`DROP PROCEDURE IF EXISTS GetEnumValues;`);
    await sequelize.query(`
      CREATE PROCEDURE GetEnumValues(IN p_table_name VARCHAR(255), IN p_column_name VARCHAR(255))
      BEGIN
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND COLUMN_NAME = p_column_name
          AND DATA_TYPE = 'enum';
      END;
    `);
    console.log('GetEnumValues procedure created successfully');
    
    // Procedure to list all ENUM columns in the database
    console.log('Creating ListAllEnums procedure...');
    await sequelize.query(`DROP PROCEDURE IF EXISTS ListAllEnums;`);
    await sequelize.query(`
      CREATE PROCEDURE ListAllEnums()
      BEGIN
        SELECT 
          TABLE_NAME as tableName,
          COLUMN_NAME as columnName,
          COLUMN_TYPE as columnType
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND DATA_TYPE = 'enum'
        ORDER BY TABLE_NAME, COLUMN_NAME;
      END;
    `);
    console.log('ListAllEnums procedure created successfully');
    
    // Procedure to get all ENUM columns of a table
    console.log('Creating GetTableEnums procedure...');
    await sequelize.query(`DROP PROCEDURE IF EXISTS GetTableEnums;`);
    await sequelize.query(`
      CREATE PROCEDURE GetTableEnums(IN table_name VARCHAR(255))
      BEGIN
        SELECT 
          COLUMN_NAME as columnName,
          COLUMN_TYPE as enumValues
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name
          AND DATA_TYPE = 'enum';
      END;
    `);
    console.log('GetTableEnums procedure created successfully');
    
    // Verify that procedures exist
    const [procedures] = await sequelize.query(`
      SHOW PROCEDURE STATUS WHERE Db = DATABASE();
    `);
    console.log('Created procedures:', procedures.map(p => p.Name).join(', '));
    
    console.log('All stored procedures for ENUM management created successfully');
    return true;
  } catch (error) {
    console.error('Error creating stored procedures:', error);
    console.error('Error details:', error.message);
    if (error.parent) {
      console.error('SQL error:', error.parent.message);
    }
    return false;
  }
};

module.exports = {
  initStoredProcedures
};