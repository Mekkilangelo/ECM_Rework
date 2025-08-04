const { mockClientService } = require('../mocks/services');
const clientController = require('../../controllers/clientController');

// EXEMPLE de Test Unitaire - Controller isolé
describe('Client Controller Unit Tests', () => {
  
  test('createClient should validate required fields', async () => {
    const req = {
      body: { 
        // Pas de nom - doit échouer
        country: 'FRANCE'
      },
      user: { id: 1, role: 'admin' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    const next = jest.fn();

    await clientController.createClient(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Le nom du client est requis'
    });
  });

  test('createClient should call service with correct data', async () => {
    const mockCreate = jest.spyOn(mockClientService, 'createClient')
      .mockResolvedValue({ id: 1, name: 'Test Client' });
    
    const req = {
      body: { 
        name: 'Test Client',
        country: 'FRANCE'
      },
      user: { id: 1, role: 'admin' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await clientController.createClient(req, res, jest.fn());

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'Test Client',
      country: 'FRANCE'
    });
    
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// EXEMPLE de Test Unitaire - Service isolé  
describe('Client Service Unit Tests', () => {
  
  test('createClient should create node and client', async () => {
    const mockNode = { id: 1, name: 'Test Client' };
    const mockClient = { node_id: 1, country: 'FRANCE' };
    
    // Mock des modèles
    const mockNodeCreate = jest.fn().mockResolvedValue(mockNode);
    const mockClientCreate = jest.fn().mockResolvedValue(mockClient);
    
    // Test isolé du service
    const result = await clientService.createClient({
      name: 'Test Client',
      country: 'FRANCE'
    });

    expect(mockNodeCreate).toHaveBeenCalledWith({
      name: 'Test Client',
      type: 'client',
      parent_id: null,
      path: '/Test Client',
      data_status: 'new'
    });
    
    expect(result).toEqual({
      ...mockClient,
      name: 'Test Client'
    });
  });
});

// EXEMPLE de Test Unitaire - Middleware
describe('Auth Middleware Unit Tests', () => {
  
  test('authenticate should return 401 without token', async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token manquant'
    });
    expect(next).not.toHaveBeenCalled();
  });
  
  test('requireWriteAccess should allow admin users', () => {
    const req = { user: { role: 'admin' } };
    const res = {};
    const next = jest.fn();

    requireWriteAccess(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
