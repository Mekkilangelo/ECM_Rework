/**
 * Tests unitaires pour les middlewares d'authentification
 * Tests isolés sans HTTP, base de données ou services externes
 */

const jwt = require('jsonwebtoken');

// Mock JWT
jest.mock('jsonwebtoken');

// Mock de la configuration
jest.mock('../../../config/config', () => ({
  JWT: {
    SECRET: 'test-jwt-secret',
    EXPIRE: '24h',
    INACTIVITY_EXPIRE: '2m'
  },
  jwtSecret: 'test-jwt-secret'
}));

// Mock des modèles
jest.mock('../../../models', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

// Mock de la fonction parseJwtTime
jest.mock('../../../config/auth', () => ({
  parseJwtTime: jest.fn().mockReturnValue(120000) // 2 minutes en ms
}));

const config = require('../../../config/config');
const { authenticate, requireEditRights } = require('../../../middleware/auth');
const { User } = require('../../../models');

describe('Auth Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: null
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    test('should return 401 when no authorization header', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès non autorisé, token manquant'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 401 when authorization header is empty', async () => {
      mockReq.headers.authorization = '';

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès non autorisé, token manquant'
      });
    });

    test('should return 401 when authorization header does not start with Bearer', async () => {
      mockReq.headers.authorization = 'InvalidToken abc123';

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès non autorisé, token manquant'
      });
    });

    test('should return 401 when no token after Bearer', async () => {
      mockReq.headers.authorization = 'Bearer ';

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès non autorisé, token manquant'
      });
    });

    test('should return 401 when JWT verification fails', async () => {
      const token = 'invalid-jwt-token';
      mockReq.headers.authorization = `Bearer ${token}`;
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(token, config.JWT.SECRET);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur d\'authentification',
        errorType: 'auth_error'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should set req.user and call next on valid token', async () => {
      const token = 'valid-jwt-token';
      const decodedUser = { 
        id: 1, 
        username: 'testuser', 
        role: 'user',
        lastActivity: Date.now() - 30000 // 30 seconds ago
      };
      const dbUser = {
        id: 1,
        username: 'testuser',
        role: 'user'
      };
      
      mockReq.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedUser);
      User.findByPk.mockResolvedValue(dbUser);

      await authenticate(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(token, config.JWT.SECRET);
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(mockReq.user).toEqual({
        id: 1,
        username: 'testuser',
        role: 'user'
      });
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle JWT expired error specifically', async () => {
      const token = 'expired-jwt-token';
      mockReq.headers.authorization = `Bearer ${token}`;
      
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session expirée',
        errorType: 'token_expired'
      });
    });

    test('should handle malformed JWT error', async () => {
      const token = 'malformed-jwt-token';
      mockReq.headers.authorization = `Bearer ${token}`;
      
      const malformedError = new Error('jwt malformed');
      malformedError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw malformedError;
      });

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalide',
        errorType: 'token_invalid'
      });
    });

    test('should handle case-insensitive Bearer token', async () => {
      const token = 'valid-jwt-token';
      const decodedUser = { 
        id: 1, 
        username: 'testuser',
        lastActivity: Date.now() - 30000
      };
      const dbUser = {
        id: 1,
        username: 'testuser',
        role: 'user'
      };
      
      mockReq.headers.authorization = `bearer ${token}`;
      
      await authenticate(mockReq, mockRes, mockNext);

      // Should reject lowercase bearer (case sensitive check)
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès non autorisé, token manquant'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should extract token correctly with extra spaces', async () => {
      const token = 'valid-jwt-token';
      const decodedUser = { 
        id: 1, 
        username: 'testuser',
        lastActivity: Date.now() - 30000
      };
      const dbUser = {
        id: 1,
        username: 'testuser',
        role: 'user'
      };
      
      mockReq.headers.authorization = `Bearer    ${token}   `;

      await authenticate(mockReq, mockRes, mockNext);

      // Should reject malformed authorization header with extra spaces
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès non autorisé, token manquant'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireEditRights middleware', () => {
    test('should return 403 when user is not set', async () => {
      mockReq.user = null;

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès refusé. Mode lecture seule actif.'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 when user has no role', async () => {
      mockReq.user = { id: 1, username: 'testuser' };

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès refusé. Mode lecture seule actif.'
      });
    });

    test('should return 403 when user role is "user"', async () => {
      mockReq.user = { 
        id: 1, 
        username: 'testuser', 
        role: 'user' 
      };

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès refusé. Mode lecture seule actif.'
      });
    });

    test('should call next when user role is "admin"', async () => {
      mockReq.user = { 
        id: 1, 
        username: 'adminuser', 
        role: 'admin' 
      };

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should call next when user role is "superuser"', async () => {
      mockReq.user = { 
        id: 1, 
        username: 'superuser', 
        role: 'superuser' 
      };

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle role case sensitivity', async () => {
      mockReq.user = { 
        id: 1, 
        username: 'adminuser', 
        role: 'ADMIN' 
      };

      await requireEditRights(mockReq, mockRes, mockNext);

      // Should reject uppercase role (case sensitive check)
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle empty role string', async () => {
      mockReq.user = { 
        id: 1, 
        username: 'testuser', 
        role: '' 
      };

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès refusé. Mode lecture seule actif.'
      });
    });

    test('should handle null role', async () => {
      mockReq.user = { 
        id: 1, 
        username: 'testuser', 
        role: null 
      };

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    test('should handle undefined user object properties', async () => {
      mockReq.user = { id: 1 }; // No username or role

      await requireEditRights(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('middleware integration behavior', () => {
    test('authenticate should prepare user for requireEditRights', async () => {
      const token = 'valid-admin-token';
      const decoded = { id: 1, username: 'admin', lastActivity: Date.now() };
      const adminUser = { 
        id: 1, 
        username: 'admin', 
        role: 'admin' 
      };

      // First authenticate
      mockReq.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);
      User.findByPk.mockResolvedValue(adminUser);
      
      await authenticate(mockReq, mockRes, mockNext);
      
      // Verify user is set
      expect(mockReq.user).toEqual({
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      });
      expect(mockNext).toHaveBeenCalledWith();

      // Reset next mock
      mockNext.mockClear();

      // Then check edit rights
      await requireEditRights(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('authenticate failure should prevent edit rights check', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockReq, mockRes, mockNext);

      // Should fail authentication
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockReq.user).toBeNull();
    });
  });
});
