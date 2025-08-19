const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// Configuration de la base de données directement ici pour éviter les imports circulaires
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'synergy',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  dialect: 'mysql',
  logging: false, // Désactivé pour réduire le bruit
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    multipleStatements: true,
    decimalNumbers: true
  }
};

// Création de l'instance Sequelize avec la configuration
const sequelize = new Sequelize(
  dbConfig.database, 
  dbConfig.username, 
  dbConfig.password, 
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
    define: {
      underscored: false
    }
  }
);

// Importe tous les modèles dans le dossier courant
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
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Assurer que les modèles sont bien exportés avec les deux casses pour compatibilité
// Windows/MySQL est moins strict avec la casse, mais Linux/Docker l'est
Object.keys(db).forEach(modelName => {
  if (modelName !== 'sequelize' && modelName !== 'Sequelize') {
    // Exporter avec majuscule initiale
    const capitalizedName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
    if (!db[capitalizedName]) {
      db[capitalizedName] = db[modelName];
    }
    
    // Exporter avec minuscule initiale
    const lowercaseName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    if (!db[lowercaseName]) {
      db[lowercaseName] = db[modelName];
    }
  }
});

// Établit les associations entre les modèles
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;