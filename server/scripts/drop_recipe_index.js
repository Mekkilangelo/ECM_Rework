const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const database = require('../config/database');
const logger = require('../utils/logger');

async function fixIndex() {
  const sequelize = database.getSequelize();
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');
    
    // Tentative de suppression de l'index
    try {
        await sequelize.query('DROP INDEX unique_recipe_number ON recipes');
        console.log('SUCCESS: Index unique_recipe_number dropped from recipes table.');
    } catch (e) {
        if (e.original && e.original.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
             console.log('INFO: Index unique_recipe_number does not exist (already dropped).');
        } else {
             console.log('WARNING: Could not drop index:', e.message);
        }
    }
  } catch (err) {
    console.error('ERROR connecting to DB:', err.message);
  } finally {
    // Force close allow script to exit
    process.exit(0);
  }
}

fixIndex();