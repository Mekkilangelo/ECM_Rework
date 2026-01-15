const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const database = require('../config/database');

async function fixIndex() {
  const sequelize = database.getSequelize();
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');
    
    // Liste de tous les indexes uniques potentiels vus dans le CREATE TABLE
    const indexesToDrop = [
      'recipe_number',
      'recipe_number_2',
      'recipe_number_3',
      'recipe_number_4',
      'recipe_number_5',
      'recipe_number_6',
      'recipe_number_7',
      'recipe_number_8',
      'recipe_number_9',
      'recipe_number_10',
      'unique_recipe_number' // Au cas où
    ];

    for (const indexName of indexesToDrop) {
        try {
            await sequelize.query(`DROP INDEX \`${indexName}\` ON recipes`);
            console.log(`SUCCESS: Index ${indexName} dropped from recipes table.`);
        } catch (e) {
            // Ignorer silencieusement si l'index n'existe pas
            if (e.original && e.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                 console.log(`INFO: Index ${indexName} does not exist.`);
            } else {
                 console.log(`WARNING: Could not drop index ${indexName}:`, e.message);
            }
        }
    }

  } catch (err) {
    console.error('ERROR connecting to DB:', err.message);
  } finally {
    process.exit(0);
  }
}

fixIndex();