/**
 * Tests de sécurité pour la configuration JWT
 */

// Importer crypto pour les tests
const crypto = require('crypto');

describe('JWT Security Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Sauvegarder l'environnement original
    originalEnv = { ...process.env };
    // Nettoyer le cache des modules AVANT de modifier l'environnement
    jest.resetModules();
  });

  afterEach(() => {
    // Restaurer l'environnement
    process.env = originalEnv;
    // Nettoyer le cache des modules après le test
    jest.resetModules();
  });

  describe('JWT_SECRET Validation', () => {
    test('devrait rejeter une configuration sans JWT_SECRET', () => {
      // Sauvegarder et supprimer complètement JWT_SECRET
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Nettoyer le cache pour forcer un nouveau chargement
      jest.resetModules();

      expect(() => {
        require('../../../config/config');
      }).toThrow('JWT_SECRET must be defined in environment variables for security reasons');

      // Restaurer le secret pour ne pas affecter les autres tests
      process.env.JWT_SECRET = savedSecret;
    });

    test('devrait rejeter un JWT_SECRET trop court (< 32 caractères)', () => {
      process.env.JWT_SECRET = 'short_secret_12345';  // 19 caractères
      
      expect(() => {
        require('../../../config/config');
      }).toThrow('JWT_SECRET must be at least 32 characters long');
    });

    test('devrait accepter un JWT_SECRET de 32 caractères', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      
      expect(() => {
        const config = require('../../../config/config');
        expect(config.JWT.SECRET).toBe('a'.repeat(32));
      }).not.toThrow();
    });

    test('devrait accepter un JWT_SECRET de 64 caractères (recommandé)', () => {
      process.env.JWT_SECRET = 'a'.repeat(64);
      
      expect(() => {
        const config = require('../../../config/config');
        expect(config.JWT.SECRET).toBe('a'.repeat(64));
        expect(config.JWT.SECRET.length).toBe(64);
      }).not.toThrow();
    });

    test('devrait accepter un JWT_SECRET cryptographiquement fort', () => {
      const crypto = require('crypto');
      const strongSecret = crypto.randomBytes(64).toString('hex');
      process.env.JWT_SECRET = strongSecret;
      
      expect(() => {
        const config = require('../../../config/config');
        expect(config.JWT.SECRET).toBe(strongSecret);
        expect(config.JWT.SECRET.length).toBeGreaterThanOrEqual(32);
      }).not.toThrow();
    });
  });

  describe('JWT Expiration Configuration', () => {
    test('devrait utiliser la valeur par défaut si JWT_EXPIRE non défini', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      delete process.env.JWT_EXPIRE;
      
      const config = require('../../../config/config');
      expect(config.JWT.EXPIRE).toBe('24h');
    });

    test('devrait accepter une configuration personnalisée pour JWT_EXPIRE', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_EXPIRE = '2h';
      
      const config = require('../../../config/config');
      expect(config.JWT.EXPIRE).toBe('2h');
    });

    test('devrait utiliser 10m par défaut pour JWT_INACTIVITY_EXPIRE', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      delete process.env.JWT_INACTIVITY_EXPIRE;
      
      const config = require('../../../config/config');
      expect(config.JWT.INACTIVITY_EXPIRE).toBe('10m');
    });

    test('devrait accepter une configuration personnalisée pour JWT_INACTIVITY_EXPIRE', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.JWT_INACTIVITY_EXPIRE = '30m';
      
      const config = require('../../../config/config');
      expect(config.JWT.INACTIVITY_EXPIRE).toBe('30m');
    });
  });

  describe('Security Best Practices', () => {
    test('ne devrait pas exposer de valeur par défaut pour JWT_SECRET', () => {
      // Sauvegarder et supprimer complètement JWT_SECRET
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Nettoyer le cache pour forcer un nouveau chargement
      jest.resetModules();

      let errorThrown = false;
      let errorMessage = '';

      try {
        require('../../../config/config');
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      // Restaurer le secret pour ne pas affecter les autres tests
      process.env.JWT_SECRET = savedSecret;

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain('JWT_SECRET must be defined');
    });

    test('devrait encourager des secrets longs et complexes', () => {
      process.env.JWT_SECRET = 'a'.repeat(32);
      
      const config = require('../../../config/config');
      
      // Vérifier que le système accepte et préserve le secret
      expect(config.JWT.SECRET.length).toBeGreaterThanOrEqual(32);
    });

    test('devrait supporter différents formats de secrets', () => {
      const secrets = [
        'a'.repeat(32),  // Caractères simples
        crypto.randomBytes(32).toString('hex'),  // Hex
        crypto.randomBytes(32).toString('base64'),  // Base64
        '#gZSex!Bj9Q#:pON~Xg5}NKKa57B=K' + 'extra_chars_to_reach_32',  // Caractères spéciaux
      ];

      secrets.forEach((secret, index) => {
        jest.resetModules();
        process.env.JWT_SECRET = secret;
        
        expect(() => {
          const config = require('../../../config/config');
          expect(config.JWT.SECRET).toBe(secret);
        }).not.toThrow(`Secret ${index} should be accepted`);
      });
    });
  });

  describe('Production Readiness', () => {
    test('devrait fonctionner en environnement production', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
      
      expect(() => {
        const config = require('../../../config/config');
        expect(config.NODE_ENV).toBe('production');
        expect(config.JWT.SECRET.length).toBeGreaterThanOrEqual(32);
      }).not.toThrow();
    });

    test('devrait empêcher le démarrage en production sans secret fort', () => {
      process.env.NODE_ENV = 'production';

      // Sauvegarder et supprimer complètement JWT_SECRET
      const savedSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Nettoyer le cache pour forcer un nouveau chargement
      jest.resetModules();

      expect(() => {
        require('../../../config/config');
      }).toThrow();

      // Restaurer l'environnement
      process.env.JWT_SECRET = savedSecret;
    });
  });
});
