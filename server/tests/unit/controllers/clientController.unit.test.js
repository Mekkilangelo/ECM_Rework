/**
 * Tests unitaires pour le contrôleur des clients
 * Tests isolés sans HTTP, base de données ou middleware
 */

// Mock des dépendances
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../services', () => ({
  clientService: {
    getAllClients: jest.fn(),
    getClientById: jest.fn(),
    createClient: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn()
  }
}));

jest.mock('../../../utils/apiResponse', () => ({
  success: jest.fn(),
  error: jest.fn(),
  paginated: jest.fn()
}));

const clientController = require('../../../controllers/clientController');
const { clientService } = require('../../../services');
const logger = require('../../../utils/logger');
const apiResponse = require('../../../utils/apiResponse');

describe('Client Controller - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, username: 'testuser', role: 'admin' }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getClients', () => {
    test('should call clientService.getAllClients with default parameters', async () => {
      const mockResult = {
        clients: [],
        pagination: { total: 0, page: 1 }
      };
      
      clientService.getAllClients.mockResolvedValue(mockResult);

      await clientController.getClients(mockReq, mockRes, mockNext);

      expect(clientService.getAllClients).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined
      });
    });

    test('should call clientService with custom query parameters', async () => {
      mockReq.query = {
        limit: '20',
        offset: '10',
        search: 'test client',
        sortBy: 'name',
        sortOrder: 'ASC'
      };

      const mockResult = {
        clients: [],
        pagination: { total: 0, page: 1 }
      };
      
      clientService.getAllClients.mockResolvedValue(mockResult);

      await clientController.getClients(mockReq, mockRes, mockNext);

      expect(clientService.getAllClients).toHaveBeenCalledWith({
        limit: '20',
        offset: '10',
        search: 'test client',
        sortBy: 'name',
        sortOrder: 'ASC'
      });
    });

    test('should call apiResponse.paginated with correct data', async () => {
      const mockResult = {
        clients: [{ id: 1, name: 'Test Client' }],
        pagination: { total: 1, page: 1 }
      };
      
      clientService.getAllClients.mockResolvedValue(mockResult);

      await clientController.getClients(mockReq, mockRes, mockNext);

      expect(apiResponse.paginated).toHaveBeenCalledWith(
        mockRes,
        mockResult.clients,
        mockResult.pagination,
        'Clients récupérés avec succès'
      );
    });

    test('should log the request parameters', async () => {
      mockReq.query = { limit: '5', offset: '0' };
      
      const mockResult = { clients: [], pagination: {} };
      clientService.getAllClients.mockResolvedValue(mockResult);

      await clientController.getClients(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Récupération des clients',
        {
          limit: '5',
          offset: '0',
          search: undefined,
          sortBy: undefined,
          sortOrder: undefined
        }
      );
    });

    test('should call next on service error', async () => {
      const error = new Error('Service error');
      clientService.getAllClients.mockRejectedValue(error);

      await clientController.getClients(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Erreur lors de la récupération des clients: Service error',
        error
      );
    });
  });

  describe('createClient', () => {
    const validClientData = {
      name: 'Test Client',
      acronym: 'TC',
      description: 'Test Description'
    };

    test('should call clientService.createClient with request body', async () => {
      mockReq.body = validClientData;
      const mockCreatedClient = { id: 1, ...validClientData };
      
      clientService.createClient.mockResolvedValue(mockCreatedClient);

      await clientController.createClient(mockReq, mockRes, mockNext);

      expect(clientService.createClient).toHaveBeenCalledWith(validClientData);
    });

    test('should call apiResponse.success on successful creation', async () => {
      mockReq.body = validClientData;
      const mockCreatedClient = { id: 1, ...validClientData };
      
      clientService.createClient.mockResolvedValue(mockCreatedClient);

      await clientController.createClient(mockReq, mockRes, mockNext);

      expect(apiResponse.success).toHaveBeenCalledWith(
        mockRes,
        mockCreatedClient,
        'Client créé avec succès',
        201
      );
    });

    test('should log client creation', async () => {
      mockReq.body = validClientData;
      const mockCreatedClient = { id: 1, ...validClientData };
      
      clientService.createClient.mockResolvedValue(mockCreatedClient);

      await clientController.createClient(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Création d\'un nouveau client',
        {
          name: 'Test Client',
          country: undefined
        }
      );
    });

    test('should call next on service error', async () => {
      const error = new Error('Validation error');
      mockReq.body = validClientData;
      clientService.createClient.mockRejectedValue(error);

      await clientController.createClient(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Erreur lors de la création du client: Validation error',
        error
      );
    });
  });

  describe('updateClient', () => {
    const updateData = {
      name: 'Updated Client',
      description: 'Updated Description'
    };

    test('should call clientService.updateClient with correct parameters', async () => {
      mockReq.params.clientId = '1';
      mockReq.body = updateData;
      const mockUpdatedClient = { id: 1, ...updateData };
      
      clientService.updateClient.mockResolvedValue(mockUpdatedClient);

      await clientController.updateClient(mockReq, mockRes, mockNext);

      expect(clientService.updateClient).toHaveBeenCalledWith('1', updateData);
    });

    test('should call apiResponse.success on successful update', async () => {
      mockReq.params.clientId = '1';
      mockReq.body = updateData;
      const mockUpdatedClient = { id: 1, ...updateData };
      
      clientService.updateClient.mockResolvedValue(mockUpdatedClient);

      await clientController.updateClient(mockReq, mockRes, mockNext);

      expect(apiResponse.success).toHaveBeenCalledWith(
        mockRes,
        mockUpdatedClient,
        'Client mis à jour avec succès'
      );
    });

    test('should log client update', async () => {
      mockReq.params.clientId = '1';
      mockReq.body = updateData;
      
      clientService.updateClient.mockResolvedValue({ id: 1, ...updateData });

      await clientController.updateClient(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Mise à jour du client #1'
      );
    });

    test('should call next on service error', async () => {
      const error = new Error('Not found');
      mockReq.params.clientId = '999';
      mockReq.body = updateData;
      clientService.updateClient.mockRejectedValue(error);

      await clientController.updateClient(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Erreur lors de la mise à jour du client #999: Not found',
        error
      );
    });
  });

  describe('deleteClient', () => {
    test('should call clientService.deleteClient with correct clientId', async () => {
      mockReq.params.clientId = '1';
      
      clientService.deleteClient.mockResolvedValue();

      await clientController.deleteClient(mockReq, mockRes, mockNext);

      expect(clientService.deleteClient).toHaveBeenCalledWith('1');
    });

    test('should call apiResponse.success on successful deletion', async () => {
      mockReq.params.clientId = '1';
      
      clientService.deleteClient.mockResolvedValue();

      await clientController.deleteClient(mockReq, mockRes, mockNext);

      expect(apiResponse.success).toHaveBeenCalledWith(
        mockRes,
        { deletedId: '1' },
        'Client supprimé avec succès'
      );
    });

    test('should log client deletion', async () => {
      mockReq.params.clientId = '1';
      
      clientService.deleteClient.mockResolvedValue();

      await clientController.deleteClient(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Suppression du client #1'
      );
    });

    test('should call next on service error', async () => {
      const error = new Error('Cannot delete');
      mockReq.params.clientId = '1';
      clientService.deleteClient.mockRejectedValue(error);

      await clientController.deleteClient(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Erreur lors de la suppression du client #1: Cannot delete',
        error
      );
    });
  });

  describe('getClientById', () => {
    test('should call clientService.getClientById with correct clientId', async () => {
      mockReq.params.clientId = '1';
      const mockClient = { id: 1, name: 'Test Client' };
      
      clientService.getClientById.mockResolvedValue(mockClient);

      await clientController.getClientById(mockReq, mockRes, mockNext);

      expect(clientService.getClientById).toHaveBeenCalledWith('1');
    });

    test('should call apiResponse.success with client data', async () => {
      mockReq.params.clientId = '1';
      const mockClient = { id: 1, name: 'Test Client' };
      
      clientService.getClientById.mockResolvedValue(mockClient);

      await clientController.getClientById(mockReq, mockRes, mockNext);

      expect(apiResponse.success).toHaveBeenCalledWith(
        mockRes,
        mockClient,
        'Client récupéré avec succès'
      );
    });

    test('should log client retrieval', async () => {
      mockReq.params.clientId = '1';
      const mockClient = { id: 1, name: 'Test Client' };
      
      clientService.getClientById.mockResolvedValue(mockClient);

      await clientController.getClientById(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Récupération du client #1'
      );
    });

    test('should call next on service error', async () => {
      const error = new Error('Client not found');
      mockReq.params.clientId = '999';
      clientService.getClientById.mockRejectedValue(error);

      await clientController.getClientById(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Erreur lors de la récupération du client #999: Client not found',
        error
      );
    });
  });
});
