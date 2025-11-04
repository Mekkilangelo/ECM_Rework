/**
 * Configuration des middlewares Express
 */
const express = require('express');
const cors = require('cors');
const logger = require('../utils/logger');

// Middlewares personnalisés
const requestIdMiddleware = require('../middleware/request-id');
const responseLogger = require('../middleware/response-logger');
const { logRequest, logAuthError } = require('../middleware/logging');

/**
 * Configurer tous les middlewares de l'application
 */
function setupMiddleware(app) {
  // Configuration du proxy (pour capturer l'IP correctement)
  app.set('trust proxy', true);

  // CORS - Restreindre aux origines autorisées
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

  app.use(cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        logger.warn('⚠️ Origine CORS refusée', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

  // Parsing du body
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middlewares de logging
  app.use(requestIdMiddleware);
  app.use(responseLogger);
  app.use(logRequest);
  app.use(logAuthError);

  // Log simple de toutes les requêtes
  app.use((req, res, next) => {
    logger.http(`${req.method} ${req.originalUrl}`, { 
      requestId: req.id,
      ip: req.ip 
    });
    next();
  });

  logger.info('✅ Middlewares configurés');
}

module.exports = { setupMiddleware };
