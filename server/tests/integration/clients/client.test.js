const request = require('supertest');
const express = require('express');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuration de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// Configuration SQLite en mémoire pour les tests
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Import des modèles
const defineUser = require('../../../models/user');
const defineNode = require('../../../models/node');
const defineClient = require('../../../models/client');

// Initialisation des modèles avec seulement ceux nécessaires
const User = defineUser(sequelize);
const Node = defineNode(sequelize);
const Client = defineClient(sequelize);

// Configuration des associations simplifiées
Client.belongsTo(Node, { foreignKey: 'node_id' });
Node.hasOne(Client, { foreignKey: 'node_id' });

// Configuration Express simplifiée pour les tests
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fonction utilitaire pour générer un token JWT
const generateTestToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Middleware d'authentification simplifié pour les tests
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Middleware de vérification des droits d'écriture
const requireWriteAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  // Vérifier les rôles autorisés pour l'écriture (admin, superuser)
  if (!['admin', 'superuser'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Droits insuffisants pour cette opération'
    });
  }

  next();
};

// Mock du service client
const mockClientService = {
  async createClient(clientData) {
    // Créer d'abord un nœud si nécessaire
    let node;
    if (clientData.name) {
      node = await Node.create({
        name: clientData.name,
        type: 'client',
        parent_id: null,
        path: `/${clientData.name}`, // Ajouter le path requis
        data_status: 'new'
      });
    }

    // Créer le client
    const client = await Client.create({
      node_id: node ? node.id : null,
      client_code: clientData.client_code,
      city: clientData.city,
      country: clientData.country,
      client_group: clientData.client_group,
      address: clientData.address
    });

    // Retourner le client avec le nom du nœud
    return {
      ...client.toJSON(),
      name: node ? node.name : null
    };
  },

  async getAllClients(options = {}) {
    const nodes = await Node.findAll({
      where: { type: 'client' },
      include: [{
        model: Client
        // Supprimé: attributes: { exclude: ['node_id'] } car node_id est la clé primaire
      }]
    });

    return {
      clients: nodes.map(node => ({
        ...node.toJSON(),
        ...(node.client ? node.client.toJSON() : {}),
        name: node.name
      })),
      pagination: {
        total: nodes.length,
        offset: 0,
        limit: 10
      }
    };
  },

  async getClientById(clientId) {
    const node = await Node.findOne({
      where: { id: clientId, type: 'client' },
      include: [{
        model: Client
        // Supprimé: attributes: { exclude: ['node_id'] } car node_id est la clé primaire
      }]
    });

    if (!node) {
      throw new Error('Client non trouvé');
    }

    return {
      ...node.toJSON(),
      ...(node.client ? node.client.toJSON() : {}),
      name: node.name
    };
  },

  async updateClient(clientId, updateData) {
    const node = await Node.findOne({
      where: { id: clientId, type: 'client' },
      include: [{
        model: Client
        // Supprimé: attributes: { exclude: ['node_id'] } car node_id est la clé primaire
      }]
    });

    if (!node) {
      throw new Error('Client non trouvé');
    }

    // Mettre à jour le nœud si le nom change
    if (updateData.name) {
      await node.update({
        name: updateData.name,
        path: `/${updateData.name}`
      });
    }

    // Mettre à jour le client
    if (node.client) {
      await node.client.update({
        client_code: updateData.client_code !== undefined ? updateData.client_code : node.client.client_code,
        city: updateData.city !== undefined ? updateData.city : node.client.city,
        country: updateData.country !== undefined ? updateData.country : node.client.country,
        client_group: updateData.client_group !== undefined ? updateData.client_group : node.client.client_group,
        address: updateData.address !== undefined ? updateData.address : node.client.address
      });
    }

    // Recharger avec les nouvelles données
    await node.reload({
      include: [{
        model: Client
        // Supprimé: attributes: { exclude: ['node_id'] } car node_id est la clé primaire
      }]
    });

    return {
      ...node.toJSON(),
      ...(node.client ? node.client.toJSON() : {}),
      name: node.name
    };
  },

  async deleteClient(clientId) {
    const node = await Node.findOne({
      where: { id: clientId, type: 'client' },
      include: [{
        model: Client
      }]
    });
    
    if (!node) {
      throw new Error('Client non trouvé');
    }

    // Supprimer d'abord le client puis le nœud
    if (node.client) {
      await node.client.destroy();
    }
    await node.destroy();

    return { success: true };
  }
};

// Routes simplifiées pour les tests
app.post('/api/clients', authenticate, requireWriteAccess, async (req, res) => {
  try {
    const clientData = req.body;

    // Validation basique
    if (!clientData.name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du client est requis'
      });
    }

    if (!clientData.country) {
      return res.status(400).json({
        success: false,
        message: 'Le pays est requis'
      });
    }

    // Validation du pays (liste simplifiée pour les tests)
    const validCountries = ['FRANCE', 'GERMANY', 'ITALY', 'SPAIN', 'USA', 'CANADA'];
    if (!validCountries.includes(clientData.country)) {
      return res.status(400).json({
        success: false,
        message: 'Pays invalide',
        error: `Le pays "${clientData.country}" n'est pas valide`
      });
    }

    // Vérifier les doublons par client_code
    if (clientData.client_code) {
      const existingClient = await Client.findOne({
        where: { client_code: clientData.client_code }
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Un client avec ce code existe déjà'
        });
      }
    }

    const newClient = await mockClientService.createClient(clientData);

    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Client créé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

app.get('/api/clients', async (req, res) => {
  try {
    const result = await mockClientService.getAllClients();
    res.json({
      success: true,
      data: result.clients,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

app.get('/api/clients/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await mockClientService.getClientById(clientId);
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    if (error.message === 'Client non trouvé') {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

app.put('/api/clients/:clientId', authenticate, requireWriteAccess, async (req, res) => {
  try {
    const { clientId } = req.params;
    const updateData = req.body;

    // Validation du pays si fourni
    if (updateData.country) {
      const validCountries = ['FRANCE', 'GERMANY', 'ITALY', 'SPAIN', 'USA', 'CANADA'];
      if (!validCountries.includes(updateData.country)) {
        return res.status(400).json({
          success: false,
          message: 'Pays invalide',
          error: `Le pays "${updateData.country}" n'est pas valide`
        });
      }
    }

    // Vérifier les doublons par client_code si modifié
    if (updateData.client_code) {
      const existingClient = await Client.findOne({
        where: { 
          client_code: updateData.client_code,
          node_id: { [Sequelize.Op.ne]: clientId } // Exclure le client actuel
        }
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Un autre client avec ce code existe déjà'
        });
      }
    }

    const updatedClient = await mockClientService.updateClient(clientId, updateData);

    res.json({
      success: true,
      data: updatedClient,
      message: 'Client mis à jour avec succès'
    });
  } catch (error) {
    if (error.message === 'Client non trouvé') {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: error.message
    });
  }
});

app.delete('/api/clients/:clientId', authenticate, requireWriteAccess, async (req, res) => {
  try {
    const { clientId } = req.params;
    await mockClientService.deleteClient(clientId);

    res.json({
      success: true,
      message: 'Client supprimé avec succès'
    });
  } catch (error) {
    if (error.message === 'Client non trouvé') {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

describe('Client Tests', () => {
  let adminUser, regularUser, adminToken, userToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Créer des utilisateurs de test
    adminUser = await User.create({
      username: 'admin',
      password_hash: 'password123',
      role: 'admin'
    });

    regularUser = await User.create({
      username: 'user',
      password_hash: 'password123',
      role: 'user'
    });

    // Générer des tokens
    adminToken = generateTestToken(adminUser);
    userToken = generateTestToken(regularUser);
  });

  beforeEach(async () => {
    await Client.destroy({ where: {} });
    await Node.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/clients', () => {
    test('should create a new client successfully', async () => {
      const clientData = {
        name: 'Test Company',
        client_code: 'TC001',
        city: 'Paris',
        country: 'FRANCE',
        client_group: 'Premium',
        address: '123 Test Street'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', 'Test Company');
      expect(response.body.data).toHaveProperty('client_code', 'TC001');
      expect(response.body.data).toHaveProperty('country', 'FRANCE');
      expect(response.body.data).toHaveProperty('city', 'Paris');
      expect(response.body).toHaveProperty('message', 'Client créé avec succès');
    });

    test('should fail with missing client name', async () => {
      const clientData = {
        client_code: 'TC002',
        city: 'Lyon',
        country: 'FRANCE'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Le nom du client est requis');
    });

    test('should fail with missing country', async () => {
      const clientData = {
        name: 'Test Company 2',
        client_code: 'TC003',
        city: 'Marseille'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Le pays est requis');
    });

    test('should fail with duplicate client_code', async () => {
      const clientData = {
        name: 'First Company',
        client_code: 'DUPLICATE001',
        city: 'Nice',
        country: 'FRANCE'
      };

      // Créer le premier client
      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(201);

      // Tenter de créer un doublon
      const duplicateData = {
        name: 'Second Company',
        client_code: 'DUPLICATE001', // Même code
        city: 'Toulouse',
        country: 'SPAIN'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Un client avec ce code existe déjà');
    });

    test('should create client without optional fields', async () => {
      const clientData = {
        name: 'Minimal Company',
        country: 'GERMANY'
        // Pas de client_code, city, client_group, address
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Minimal Company');
      expect(response.body.data).toHaveProperty('country', 'GERMANY');
      expect(response.body.data.client_code).toBeUndefined();
      expect(response.body.data.city).toBeUndefined();
    });

    test('should handle invalid country enum', async () => {
      const clientData = {
        name: 'Invalid Country Company',
        country: 'INVALID_COUNTRY'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Pays invalide');
      expect(response.body.error).toContain('INVALID_COUNTRY');
    });

    test('should validate client_code uniqueness constraint', async () => {
      // Créer le premier client
      const firstClient = {
        name: 'First Client',
        client_code: 'UNIQUE123',
        country: 'ITALY'
      };

      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(firstClient)
        .expect(201);

      // Vérifier que le client est créé
      const clientsResponse = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(clientsResponse.body.data).toHaveLength(1);
      expect(clientsResponse.body.data[0]).toHaveProperty('client_code', 'UNIQUE123');
    });

    test('should create client with all valid fields', async () => {
      const completeClientData = {
        name: 'Complete Test Company',
        client_code: 'CTC001',
        city: 'Berlin',
        country: 'GERMANY',
        client_group: 'Enterprise',
        address: '456 Complete Avenue'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(completeClientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      const client = response.body.data;
      expect(client).toHaveProperty('name', 'Complete Test Company');
      expect(client).toHaveProperty('client_code', 'CTC001');
      expect(client).toHaveProperty('city', 'Berlin');
      expect(client).toHaveProperty('country', 'GERMANY');
      expect(client).toHaveProperty('client_group', 'Enterprise');
      expect(client).toHaveProperty('address', '456 Complete Avenue');
      expect(client).toHaveProperty('node_id');
    });
  });

  describe('GET /api/clients', () => {
    test('should retrieve all clients', async () => {
      // Créer quelques clients de test
      const clients = [
        { name: 'Client A', country: 'FRANCE', client_code: 'CA001' },
        { name: 'Client B', country: 'GERMANY', client_code: 'CB001' }
      ];

      for (const client of clients) {
        await request(app)
          .post('/api/clients')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(client)
          .expect(201);
      }

      const response = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveLength(2);
      expect(response.body).toHaveProperty('pagination');
    });

    test('should return empty list when no clients exist', async () => {
      const response = await request(app)
        .get('/api/clients')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/clients/:clientId', () => {
    test('should retrieve a specific client', async () => {
      // Créer un client
      const clientData = {
        name: 'Test Client',
        country: 'FRANCE',
        client_code: 'TC001'
      };

      const createResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(201);

      const clientId = createResponse.body.data.node_id;

      const response = await request(app)
        .get(`/api/clients/${clientId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Test Client');
      expect(response.body.data).toHaveProperty('client_code', 'TC001');
    });

    test('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Client non trouvé');
    });
  });

  describe('PUT /api/clients/:clientId - Authorization Tests', () => {
    test('should require authentication for client update', async () => {
      const response = await request(app)
        .put('/api/clients/1')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Token manquant');
    });

    test('should require admin/superuser role for client update', async () => {
      const response = await request(app)
        .put('/api/clients/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Name' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants pour cette opération');
    });

    test('should allow admin to update client', async () => {
      // Créer un client d'abord
      const clientData = {
        name: 'Original Client',
        country: 'FRANCE',
        client_code: 'OC001'
      };

      const createResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(201);

      const clientId = createResponse.body.data.node_id;

      // Mettre à jour le client
      const updateData = {
        name: 'Updated Client',
        city: 'Paris'
      };

      const response = await request(app)
        .put(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'Updated Client');
      expect(response.body.data).toHaveProperty('city', 'Paris');
      expect(response.body.data).toHaveProperty('client_code', 'OC001'); // Doit rester inchangé
    });
  });

  describe('PUT /api/clients/:clientId - Field Updates', () => {
    let testClientId;

    beforeEach(async () => {
      // Créer un client de test avant chaque test
      const clientData = {
        name: 'Test Client',
        country: 'FRANCE',
        client_code: 'TC001',
        city: 'Lyon',
        client_group: 'Standard',
        address: '123 Test Street'
      };

      const createResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(201);

      testClientId = createResponse.body.data.node_id;
    });

    test('should update client name', async () => {
      const updateData = { name: 'New Client Name' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('name', 'New Client Name');
      expect(response.body.data).toHaveProperty('client_code', 'TC001'); // Autres champs inchangés
    });

    test('should update client country', async () => {
      const updateData = { country: 'GERMANY' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('country', 'GERMANY');
      expect(response.body.data).toHaveProperty('name', 'Test Client'); // Autres champs inchangés
    });

    test('should update client city', async () => {
      const updateData = { city: 'Marseille' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('city', 'Marseille');
    });

    test('should update client_code', async () => {
      const updateData = { client_code: 'NEW001' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('client_code', 'NEW001');
    });

    test('should update client_group', async () => {
      const updateData = { client_group: 'Premium' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('client_group', 'Premium');
    });

    test('should update address', async () => {
      const updateData = { address: '456 New Address' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('address', '456 New Address');
    });

    test('should update multiple fields at once', async () => {
      const updateData = {
        name: 'Multi Update Client',
        city: 'Nice',
        client_group: 'Enterprise',
        address: '789 Multi Street'
      };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data).toHaveProperty('name', 'Multi Update Client');
      expect(response.body.data).toHaveProperty('city', 'Nice');
      expect(response.body.data).toHaveProperty('client_group', 'Enterprise');
      expect(response.body.data).toHaveProperty('address', '789 Multi Street');
      expect(response.body.data).toHaveProperty('country', 'FRANCE'); // Inchangé
    });

    test('should validate country on update', async () => {
      const updateData = { country: 'INVALID_COUNTRY' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Pays invalide');
    });

    test('should prevent duplicate client_code on update', async () => {
      // Créer un deuxième client
      const secondClientData = {
        name: 'Second Client',
        country: 'GERMANY',
        client_code: 'SC001'
      };

      await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(secondClientData)
        .expect(201);

      // Tenter de mettre à jour le premier client avec le code du second
      const updateData = { client_code: 'SC001' };

      const response = await request(app)
        .put(`/api/clients/${testClientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Un autre client avec ce code existe déjà');
    });

    test('should handle non-existent client update', async () => {
      const response = await request(app)
        .put('/api/clients/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Client non trouvé');
    });
  });

  describe('DELETE /api/clients/:clientId - Authorization Tests', () => {
    test('should require authentication for client deletion', async () => {
      const response = await request(app)
        .delete('/api/clients/1')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Token manquant');
    });

    test('should require admin/superuser role for client deletion', async () => {
      const response = await request(app)
        .delete('/api/clients/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants pour cette opération');
    });
  });

  describe('DELETE /api/clients/:clientId - Functionality', () => {
    test('should delete existing client', async () => {
      // Créer un client
      const clientData = {
        name: 'Client to Delete',
        country: 'FRANCE',
        client_code: 'CTD001'
      };

      const createResponse = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(clientData)
        .expect(201);

      const clientId = createResponse.body.data.node_id;

      // Vérifier que le client existe
      await request(app)
        .get(`/api/clients/${clientId}`)
        .expect(200);

      // Supprimer le client
      const response = await request(app)
        .delete(`/api/clients/${clientId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Client supprimé avec succès');

      // Vérifier que le client n'existe plus
      await request(app)
        .get(`/api/clients/${clientId}`)
        .expect(404);
    });

    test('should handle non-existent client deletion', async () => {
      const response = await request(app)
        .delete('/api/clients/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Client non trouvé');
    });

    test('should verify client is removed from list after deletion', async () => {
      // Créer deux clients
      const clients = [
        { name: 'Client 1', country: 'FRANCE', client_code: 'C001' },
        { name: 'Client 2', country: 'GERMANY', client_code: 'C002' }
      ];

      const createdClients = [];
      for (const client of clients) {
        const response = await request(app)
          .post('/api/clients')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(client)
          .expect(201);
        createdClients.push(response.body.data);
      }

      // Vérifier qu'on a 2 clients
      let listResponse = await request(app)
        .get('/api/clients')
        .expect(200);
      expect(listResponse.body.data).toHaveLength(2);

      // Supprimer un client
      await request(app)
        .delete(`/api/clients/${createdClients[0].node_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Vérifier qu'on a maintenant 1 client
      listResponse = await request(app)
        .get('/api/clients')
        .expect(200);
      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0]).toHaveProperty('name', 'Client 2');
    });
  });

  describe('POST /api/clients - Authorization Tests', () => {
    test('should require authentication for client creation', async () => {
      const clientData = {
        name: 'Test Client',
        country: 'FRANCE'
      };

      const response = await request(app)
        .post('/api/clients')
        .send(clientData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Token manquant');
    });

    test('should require admin/superuser role for client creation', async () => {
      const clientData = {
        name: 'Test Client',
        country: 'FRANCE'
      };

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${userToken}`)
        .send(clientData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Droits insuffisants pour cette opération');
    });
  });
});
