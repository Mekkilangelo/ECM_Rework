// tests/unit/controllers/clientController.unit.test.js
const clientController = require('../../../controllers/clientController');

describe('Client Controller - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      user: { id: 1, role: 'admin' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();

    // Mock du service
    jest.mock('../../../services', () => ({
      clientService: {
        createClient: jest.fn(),
        getAllClients: jest.fn(),
        updateClient: jest.fn(),
        deleteClient: jest.fn()
      }
    }));
  });

  describe('createClient', () => {
    test('should return 400 when name is missing', async () => {
      mockReq.body = { country: 'FRANCE' };

      await clientController.createClient(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('nom')
        })
      );
    });

    test('should return 400 when country is missing', async () => {
      mockReq.body = { name: 'Test Client' };

      await clientController.createClient(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should call service and return 201 on success', async () => {
      const { clientService } = require('../../../services');
      const mockClient = { id: 1, name: 'Test Client', country: 'FRANCE' };
      
      clientService.createClient.mockResolvedValue(mockClient);
      mockReq.body = { name: 'Test Client', country: 'FRANCE' };

      await clientController.createClient(mockReq, mockRes, mockNext);

      expect(clientService.createClient).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockClient
        })
      );
    });
  });
});

// tests/unit/middleware/auth.unit.test.js
const { authenticate, requireWriteAccess } = require('../../../middleware/auth');

describe('Auth Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    test('should return 401 when no authorization header', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when no Bearer token', async () => {
      mockReq.headers.authorization = 'Basic dGVzdA==';

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireWriteAccess', () => {
    test('should call next() for admin user', () => {
      mockReq.user = { role: 'admin' };

      requireWriteAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should call next() for superuser', () => {
      mockReq.user = { role: 'superuser' };

      requireWriteAccess(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 403 for regular user', () => {
      mockReq.user = { role: 'user' };

      requireWriteAccess(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

// tests/unit/services/clientService.unit.test.js  
const clientService = require('../../../services/clientService');

// Mock des modèles
jest.mock('../../../models', () => ({
  Node: {
    create: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Client: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}));

describe('Client Service - Unit Tests', () => {
  const { Node, Client } = require('../../../models');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createClient', () => {
    test('should create node and client', async () => {
      const mockNode = { id: 1, name: 'Test Client' };
      const mockClient = { 
        node_id: 1, 
        client_code: 'TC001',
        country: 'FRANCE',
        toJSON: () => ({ node_id: 1, client_code: 'TC001', country: 'FRANCE' })
      };

      Node.create.mockResolvedValue(mockNode);
      Client.create.mockResolvedValue(mockClient);

      const result = await clientService.createClient({
        name: 'Test Client',
        client_code: 'TC001',
        country: 'FRANCE'
      });

      expect(Node.create).toHaveBeenCalledWith({
        name: 'Test Client',
        type: 'client',
        parent_id: null,
        path: '/Test Client',
        data_status: 'new'
      });

      expect(Client.create).toHaveBeenCalledWith({
        node_id: 1,
        client_code: 'TC001',
        country: 'FRANCE',
        city: undefined,
        client_group: undefined,
        address: undefined
      });

      expect(result).toEqual({
        node_id: 1,
        client_code: 'TC001', 
        country: 'FRANCE',
        name: 'Test Client'
      });
    });
  });
});
