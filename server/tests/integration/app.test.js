const express = require('express');
const cors = require('cors');
const path = require('path');

// Créer une version simplifiée de l'app pour les tests
const app = express();

// Configurer l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// Middlewares basiques
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware d'ID de requête simplifié pour les tests
app.use((req, res, next) => {
  req.requestId = 'test-request-id';
  req.ip = '127.0.0.1';
  req.get = (header) => {
    if (header === 'User-Agent') return 'test-user-agent';
    return null;
  };
  next();
});

// Mock des services avant de charger les routes
jest.mock('../../services', () => require('./mocks/services'));
jest.mock('../../services/loggingService', () => require('./mocks/services').loggingService);

// Routes pour les tests
const authRoutes = require('../../routes/auth');
const userRoutes = require('../../routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Middleware de gestion d'erreur simple
app.use((error, req, res, next) => {
  console.error('Test error:', error.message);
  
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Données invalides';
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Cette valeur existe déjà';
  } else if (error.message.includes('invalid "undefined" value')) {
    statusCode = 400;
    message = 'Données manquantes';
  }
  
  res.status(statusCode).json({
    success: false,
    message: message
  });
});

module.exports = app;

// Test simple pour éviter l'erreur Jest
describe('App Configuration', () => {
  test('should export express app', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });
});
