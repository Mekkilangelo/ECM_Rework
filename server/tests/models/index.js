// Mock des modèles pour les tests
const { setupTestDatabase } = require('./helpers/database');

let models = {};

const initModels = async () => {
  const { models: dbModels } = await setupTestDatabase();
  models = dbModels;
  return models;
};

// Export des modèles avec chargement lazy
module.exports = new Proxy({}, {
  get: function(target, prop) {
    if (prop === 'sequelize' || prop === 'Sequelize') {
      return global[prop] || models[prop];
    }
    
    if (prop === 'User') {
      return global.User || models.User;
    }
    
    if (prop === 'Node') {
      return global.Node || models.Node;
    }
    
    if (prop === 'Closure') {
      return global.Closure || models.Closure;
    }
    
    return models[prop];
  }
});
