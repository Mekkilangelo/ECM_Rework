/**
 * Configuration et montage des routes
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Import des routes
const authRoutes = require('../routes/auth');
const clientRoutes = require('../routes/clients');
const trialRequestRoutes = require('../routes/trial-requests');
const partRoutes = require('../routes/parts');
const trialRoutes = require('../routes/trials');
const steelRoutes = require('../routes/steels');
const fileRoutes = require('../routes/files');
const furnaceRoutes = require('../routes/furnaces');
const userRoutes = require('../routes/users');
const referenceRoutes = require('../routes/references');
const hierarchyRoutes = require('../routes/hierarchy');
const searchRoutes = require('../routes/search');
const systemRoutes = require('../routes/system');
const logRoutes = require('../routes/logs');
const reportRoutes = require('../routes/reports');

/**
 * Monter toutes les routes de l'API
 */
function setupRoutes(app) {
  // Routes API
  app.use('/api/auth', authRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/trial-requests', trialRequestRoutes);
  app.use('/api/parts', partRoutes);
  app.use('/api/trials', trialRoutes);
  app.use('/api/steels', steelRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/furnaces', furnaceRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/references', referenceRoutes);
  app.use('/api/nodes', hierarchyRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/system', systemRoutes);
  app.use('/api/logs', logRoutes);
  app.use('/api/reports', reportRoutes);

  // Route racine de l'API
  app.get('/api', (req, res) => {
    res.json({ 
      message: 'Bienvenue sur l\'API ECM Monitoring',
      version: '1.1.5',
      status: 'operational'
    });
  });

  // Route de santé
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  });

  logger.info('✅ Routes API montées');
}

/**
 * Servir les fichiers statiques en production
 */
function setupStaticFiles(app) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Chemin vers le build du client
  const clientBuildPath = path.resolve(__dirname, '../../client/build');

  if (!fs.existsSync(clientBuildPath)) {
    logger.warn('⚠️ Dossier client/build non trouvé', { path: clientBuildPath });
    return;
  }

  logger.info('📁 Serveur de fichiers statiques', { path: clientBuildPath });

  // Servir les fichiers statiques
  app.use(express.static(clientBuildPath));

  // SPA fallback - doit être en dernier
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

/**
 * Servir les uploads
 */
function setupUploads(app) {
  const uploadsPath = path.join(__dirname, '../uploads');
  
  if (fs.existsSync(uploadsPath)) {
    app.use('/uploads', express.static(uploadsPath));
    logger.info('📂 Dossier uploads accessible', { path: uploadsPath });
  }
}

module.exports = { setupRoutes, setupStaticFiles, setupUploads };
