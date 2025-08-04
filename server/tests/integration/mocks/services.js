/**
 * Mocks des services pour les tests d'intégration
 */

const loggingService = {
  logUserLogin: jest.fn(),
  logUserAction: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

module.exports = {
  loggingService
};
