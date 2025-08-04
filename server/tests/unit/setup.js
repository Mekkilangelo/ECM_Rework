/**
 * Setup global pour les tests unitaires
 * Configuration des mocks et utilitaires communs
 */

// Configuration des timeouts pour les tests
jest.setTimeout(10000);

// Nettoyage global après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Utilitaires globaux pour les tests
global.createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides
});

global.createMockResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn()
  };
  
  // Chaînage des méthodes
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);
  
  return res;
};

global.createMockNext = () => jest.fn();

// Mock des modèles Sequelize pour éviter les dépendances DB
global.createMockSequelizeModel = (name, attributes = {}) => ({
  name,
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
  bulkCreate: jest.fn(),
  ...attributes
});

// Helpers pour créer des données de test
global.createTestUser = (overrides = {}) => ({
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

global.createTestClient = (overrides = {}) => ({
  id: 1,
  name: 'Test Client',
  acronym: 'TC',
  description: 'Test Description',
  address: '123 Test St',
  phone: '555-0123',
  nodeId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Helpers pour les assertions communes
global.expectSuccessResponse = (res, statusCode = 200) => {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true
    })
  );
};

global.expectErrorResponse = (res, statusCode, message) => {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      message: expect.stringContaining(message)
    })
  );
};

// Suppression des warnings de console pendant les tests
console.warn = jest.fn();
console.error = jest.fn();
