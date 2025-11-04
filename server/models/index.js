/**
 * Chargement et association des modèles Sequelize
 * Utilise l'instance Singleton de la base de données
 */
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const database = require('../config/database');

const db = {};

// Utiliser l'instance Singleton de Sequelize
const sequelize = database.getSequelize();
const { DataTypes } = require('sequelize');

// Import automatique de tous les modèles
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Association des modèles
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

// Exposer l'instance Sequelize et les modèles
db.sequelize = sequelize;
db.Sequelize = require('sequelize');
db.database = database; // Accès au singleton complet

module.exports = db;