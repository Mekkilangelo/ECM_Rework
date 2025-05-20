// server/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./middleware/error-handler');
const db = require('./models');
const { testConnection } = require('./config/database');
const { PORT } = require('./config/config');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const orderRoutes = require('./routes/orders');
const partRoutes = require('./routes/parts');
const testRoutes = require('./routes/tests');
const steelRoutes = require('./routes/steels');
const fileRoutes = require('./routes/files');
const furnaceRoutes = require('./routes/furnaces'); 
const userRoutes = require('./routes/users'); 
const enumRoutes = require('./routes/enums');
const hierarchyRoutes = require('./routes/hierarchy');
const chatbotRoutes = require('./routes/chatbot');
const archiveRoutes = require('./routes/archives');
const searchRoutes = require('./routes/search'); // Routes de recherche
const systemRoutes = require('./routes/system'); // Routes de gestion système

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

testConnection();

// Auth routes - si différent de userRoutes
app.use('/api/auth', authRoutes);

// Data routes - décommentés et ajoutés
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/steels', steelRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/furnaces', furnaceRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/enums', enumRoutes);
app.use('/api/nodes', hierarchyRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/archives', archiveRoutes);
app.use('/api/search', searchRoutes); // Routes de recherche
app.use('/api/system', systemRoutes); // Routes de gestion système

// Root route
app.get('/api', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de gestion hiérarchique' });
});

// Route de diagnostic pour vérifier la santé du serveur
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    clientPath: process.resourcesPath ? path.join(process.resourcesPath, 'client/build') : path.join(__dirname, '../client/build'),
    serverPath: __dirname
  });
});

// Basic test route to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Déterminer le chemin client correct
  let clientBuildPath;
  
  try {
    // Si nous sommes dans Electron via le process principal
    if (process.env.ELECTRON_RUN_AS_NODE === '1' && process.resourcesPath) {
      clientBuildPath = path.join(process.resourcesPath, 'client/build');
    } 
    // Si le chemin relatif traditionnel existe
    else if (fs.existsSync(path.resolve(__dirname, '../client/build'))) {
      clientBuildPath = path.resolve(__dirname, '../client/build');
    }
    // Dernier recours: utiliser un chemin dans le même dossier que le serveur
    else {
      clientBuildPath = path.join(__dirname, 'client/build');
    }
    
    console.log('Serving static files from:', clientBuildPath);
    console.log('Directory exists:', fs.existsSync(clientBuildPath));
    
    if (fs.existsSync(clientBuildPath)) {
      // Lister les fichiers pour le débogage
      console.log('Client directory contains:');
      fs.readdirSync(clientBuildPath).forEach(file => {
        console.log(`- ${file}`);
      });
    }
    
    // Servir les fichiers statiques
    app.use(express.static(clientBuildPath));
    
    // Route wildcard pour SPA
    app.get('*', (req, res, next) => {
      if (!req.path.startsWith('/api')) {
        console.log(`Serving index.html for path: ${req.path}`);
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      } else {
        next();
      }
    });
  } catch (error) {
    console.error('Error setting up static file serving:', error);
  }
}

// 404 handler for undefined routes - doit être APRÈS toutes les routes définies
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;