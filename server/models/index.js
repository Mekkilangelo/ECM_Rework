const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// Configuration de la base de données
require('dotenv').config();

// Configuration simple pour Windows et Linux
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'synergy',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  dialect: 'mysql',
  logging: false,
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

// Création de l'instance Sequelize
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
    dialectOptions: dbConfig.dialectOptions
  }
);

// Import des modèles de façon simple et compatible
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
    
    // Utilisation des noms de modèles exactement comme définis dans les fichiers de modèle
    // pour assurer une compatibilité parfaite avec les noms de tables
    db[model.name] = model;
  });

// Association des modèles
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

// Export des objets de base de données
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;