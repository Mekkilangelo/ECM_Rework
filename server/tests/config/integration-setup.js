/**
 * Setup pour les tests d'intégration RÉELS
 * Override la configuration des modèles pour utiliser SQLite en test
 */

const { testSequelize } = require('./test-database');

// Override des modèles pour les tests d'intégration
const setupTestModels = () => {
  // Mock le fichier models/index.js pour utiliser notre DB de test
  jest.doMock('../../models', () => {
    // Importer et configurer tous les modèles avec SQLite
    const defineUser = require('../../models/user');
    const defineNode = require('../../models/node');
    const defineClient = require('../../models/client');
    const defineLog = require('../../models/log');
    
    const User = defineUser(testSequelize);
    const Node = defineNode(testSequelize);
    const Client = defineClient(testSequelize);
    const Log = defineLog(testSequelize);
    
    // Définir les associations (comme dans le vrai models/index.js)
    Client.belongsTo(Node, { foreignKey: 'node_id', as: 'node' });
    Node.hasOne(Client, { foreignKey: 'node_id', as: 'client' });
    
    const models = {
      user: User,
      User,
      node: Node,
      Node,
      client: Client,
      Client,
      log: Log,
      Log
    };

    return {
      ...models,
      sequelize: testSequelize,
      Sequelize: require('sequelize')
    };
  });
};

// Setup de base pour les tests d'intégration
const setupIntegrationTest = async () => {
  // Synchroniser la base de test
  await testSequelize.sync({ force: true });
  
  // Créer des données de base pour les tests
  const bcrypt = require('bcrypt');
  
  // Créer un utilisateur admin de test
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await testSequelize.models.user.create({
    username: 'testadmin',
    password_hash: hashedPassword,
    role: 'admin'
  });
  
  // Créer un utilisateur normal de test
  const hashedUserPassword = await bcrypt.hash('user123', 10);
  await testSequelize.models.user.create({
    username: 'testuser',
    password_hash: hashedUserPassword,
    role: 'user'
  });
  
  return testSequelize;
};

// Nettoyage après les tests
const cleanupIntegrationTest = async () => {
  await testSequelize.close();
};

module.exports = {
  setupTestModels,
  setupIntegrationTest,
  cleanupIntegrationTest,
  testSequelize
};
