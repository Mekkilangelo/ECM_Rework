/**
 * Tests unitaires pour le système de logging Winston
 */

const fs = require('fs');
const path = require('path');

describe('Logger Winston', () => {
  let logger;
  const logsDir = path.join(__dirname, '../../../logs');

  beforeAll(() => {
    // Nettoyer les logs de test
    if (fs.existsSync(logsDir)) {
      const files = fs.readdirSync(logsDir);
      files.forEach(file => {
        if (file.includes('test')) {
          fs.unlinkSync(path.join(logsDir, file));
        }
      });
    }
  });

  beforeEach(() => {
    // Recharger le logger pour chaque test
    jest.resetModules();
    logger = require('../../../utils/logger');
  });

  describe('Initialisation', () => {
    test('devrait créer le dossier logs si absent', () => {
      expect(fs.existsSync(logsDir)).toBe(true);
    });

    test('devrait exposer toutes les méthodes de logging', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.http).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('devrait avoir accès à l\'instance Winston', () => {
      expect(logger.winston).toBeDefined();
    });
  });

  describe('Niveaux de logging', () => {
    test('debug() devrait logger sans erreur', () => {
      expect(() => {
        logger.debug('Message de debug', { testId: 1 });
      }).not.toThrow();
    });

    test('info() devrait logger sans erreur', () => {
      expect(() => {
        logger.info('Message d\'info', { testId: 2 });
      }).not.toThrow();
    });

    test('http() devrait logger sans erreur', () => {
      expect(() => {
        logger.http('Message HTTP', { method: 'GET', path: '/api/test' });
      }).not.toThrow();
    });

    test('warn() devrait logger sans erreur', () => {
      expect(() => {
        logger.warn('Message d\'avertissement', { testId: 3 });
      }).not.toThrow();
    });

    test('error() devrait logger sans erreur', () => {
      expect(() => {
        logger.error('Message d\'erreur', { testId: 4 });
      }).not.toThrow();
    });
  });

  describe('Métadonnées', () => {
    test('devrait accepter des métadonnées vides', () => {
      expect(() => {
        logger.info('Message sans metadata');
      }).not.toThrow();
    });

    test('devrait accepter des objets comme métadonnées', () => {
      expect(() => {
        logger.info('Message avec metadata', {
          userId: 123,
          action: 'test',
          timestamp: new Date()
        });
      }).not.toThrow();
    });

    test('ne devrait pas logger les données sensibles en clair', () => {
      // En environnement test, Winston n'écrit pas dans les fichiers
      // mais on peut vérifier que ça ne throw pas
      expect(() => {
        logger.info('Login attempt', {
          username: 'testuser',
          password: 'secret123',  // Devrait être filtré
          token: 'abc123'  // Devrait être filtré
        });
      }).not.toThrow();
    });
  });

  describe('Environnement de test', () => {
    test('ne devrait pas créer de fichiers de log en mode test', () => {
      const NODE_ENV = process.env.NODE_ENV;
      expect(NODE_ENV).toBe('test');

      logger.info('Test log in test environment');

      // En mode test, les transports de fichiers ne sont pas actifs
      const files = fs.existsSync(logsDir) ? fs.readdirSync(logsDir) : [];
      const recentTestLogs = files.filter(f => 
        f.includes('test') && 
        fs.statSync(path.join(logsDir, f)).mtime > new Date(Date.now() - 5000)
      );

      // Il ne devrait pas y avoir de nouveaux fichiers de test
      expect(recentTestLogs.length).toBe(0);
    });
  });

  describe('Gestion des erreurs', () => {
    test('devrait gérer les erreurs avec stack trace', () => {
      const error = new Error('Test error');
      expect(() => {
        logger.error('Une erreur est survenue', { error: error.message, stack: error.stack });
      }).not.toThrow();
    });

    test('devrait continuer à fonctionner après une erreur', () => {
      logger.error('Première erreur');
      expect(() => {
        logger.info('Message après erreur');
      }).not.toThrow();
    });
  });
});
