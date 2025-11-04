/**
 * Configuration de l'application Express
 * Gère les middlewares et routes de manière centralisée
 */
const express = require('express');
const errorHandler = require('./middleware/error-handler');
const { logError } = require('./middleware/logging');

// Modules de configuration
const { setupMiddleware } = require('./startup/middleware');
const { setupRoutes, setupStaticFiles, setupUploads } = require('./startup/routes');

// Initialiser l'application Express
const app = express();

// 1. Configurer les middlewares
setupMiddleware(app);

// 2. Monter les routes API
setupRoutes(app);

// 3. Servir les uploads
setupUploads(app);

// 4. Servir les fichiers statiques en production
setupStaticFiles(app);

// 5. 404 handler - DOIT être après toutes les routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Resource not found',
    path: req.originalUrl
  });
});

// 6. Middleware de logging des erreurs
app.use(logError);

// 7. Gestionnaire d'erreurs global - DOIT être en dernier
app.use(errorHandler);

module.exports = app;