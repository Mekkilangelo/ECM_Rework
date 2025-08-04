/**
 * Tests unitaires pour le contrôleur d'authentification
 * Tests isolés sans HTTP, base de données ou middleware
 */

// Mock des dépendances
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../models', () => ({
  User: {
    findOne: jest.fn()
  }
}));

jest.mock('../../../config/auth', () => ({
  generateToken: jest.fn(),
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
  refreshToken: jest.fn()
}));

jest.mock('../../../config/config', () => ({
  jwtSecret: 'test-jwt-secret'
}));

jest.mock('../../../services/loggingService', () => ({
  logUserLogin: jest.fn()
}));

jest.mock('../../../utils/apiResponse', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const authController = require('../../../controllers/authController');
const { User } = require('../../../models');
const { verifyPassword, generateToken } = require('../../../config/auth');
const logger = require('../../../utils/logger');
const loggingService = require('../../../services/loggingService');
const apiResponse = require('../../../utils/apiResponse');

describe('Auth Controller - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      ip: '127.0.0.1',
      session: { id: 'session-123' },
      requestId: 'req-123',
      get: jest.fn().mockReturnValue('test-user-agent')
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    const validUser = {
      id: 1,
      username: 'testuser',
      password_hash: 'hashed-password',
      role: 'user'
    };

    test('should call User.findOne with correct username', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(true);
      generateToken.mockReturnValue('jwt-token');

      await authController.login(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' }
      });
    });

    test('should verify password with correct parameters', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(true);
      generateToken.mockReturnValue('jwt-token');

      await authController.login(mockReq, mockRes, mockNext);

      expect(verifyPassword).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    test('should call apiResponse.error when user not found', async () => {
      mockReq.body = { username: 'nonexistent', password: 'password123' };
      User.findOne.mockResolvedValue(null);

      await authController.login(mockReq, mockRes, mockNext);

      expect(apiResponse.error).toHaveBeenCalledWith(
        mockRes, 
        'Identifiants invalides', 
        401
      );
    });

    test('should call apiResponse.error when password is incorrect', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(false);

      await authController.login(mockReq, mockRes, mockNext);

      expect(apiResponse.error).toHaveBeenCalledWith(
        mockRes, 
        'Identifiants invalides', 
        401
      );
    });

    test('should log successful login attempt', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(true);
      generateToken.mockReturnValue('jwt-token');

      await authController.login(mockReq, mockRes, mockNext);

      expect(logger.info).toHaveBeenCalledWith(
        'Tentative de connexion pour l\'utilisateur: testuser'
      );
    });

    test('should log failed login attempt', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(false);

      await authController.login(mockReq, mockRes, mockNext);

      expect(logger.warn).toHaveBeenCalledWith(
        'Échec d\'authentification pour l\'utilisateur: testuser'
      );
    });

    test('should call loggingService.logUserLogin on failure', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(false);

      await authController.login(mockReq, mockRes, mockNext);

      expect(loggingService.logUserLogin).toHaveBeenCalledWith(
        null,
        'testuser',
        false,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'test-user-agent',
          sessionId: 'session-123',
          requestId: 'req-123'
        }
      );
    });

    test('should generate token on successful authentication', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(true);
      generateToken.mockReturnValue('jwt-token');
      apiResponse.success.mockReturnValue();

      await authController.login(mockReq, mockRes, mockNext);

      expect(generateToken).toHaveBeenCalledWith(validUser);
    });

    test('should call next on unexpected error', async () => {
      const error = new Error('Database error');
      mockReq.body = { username: 'testuser', password: 'password123' };
      User.findOne.mockRejectedValue(error);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Erreur lors de la connexion: Database error',
        error
      );
    });

    test('should add security delay on failed authentication', async () => {
      const startTime = Date.now();
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };
      User.findOne.mockResolvedValue(validUser);
      verifyPassword.mockResolvedValue(false);

      await authController.login(mockReq, mockRes, mockNext);

      const endTime = Date.now();
      // Vérifier qu'il y a eu un délai (au moins 1.5 secondes)
      expect(endTime - startTime).toBeGreaterThan(1500);
    });
  });
});
