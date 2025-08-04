const { Sequelize } = require('sequelize');
const { current: dbConfig } = require('../../config/database.test');

let sequelize;

const setupTestDatabase = async () => {
  if (!sequelize) {
    sequelize = new Sequelize(dbConfig);
    
    // Initialiser seulement le modèle User pour commencer
    const User = require('../../models/user')(sequelize, Sequelize.DataTypes);
    
    const models = {
      User,
      sequelize,
      Sequelize
    };
    
    // Ajouter les modèles au global pour les tests
    global.User = User;
    global.sequelize = sequelize;
    
    // Synchroniser la base de données (créer les tables)
    await sequelize.sync({ force: true });
    
    return { sequelize, models };
  }
  
  return { sequelize };
};

const closeTestDatabase = async () => {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
};

const clearTestDatabase = async () => {
  if (sequelize) {
    // Effacer toutes les données des tables
    await sequelize.sync({ force: true });
  }
};

module.exports = {
  setupTestDatabase,
  closeTestDatabase,
  clearTestDatabase
};
