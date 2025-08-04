const config = require('./config/config');
const app = require('./app');
const logger = require('./utils/logger');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { UPLOAD_BASE_DIR, TEMP_DIR } = require('./utils/fileStorage');

// Gestion conditionnelle d'Electron
let electronApp = null;
try {
  const electron = require('electron');
  electronApp = electron.app;
  console.log('Electron module loaded successfully');
} catch (error) {
  console.log('Running outside of Electron, electron module not available');
}

// Port configuration
const PORT = process.env.PORT || 5001;

// Dans server.js, avant les autres routes
if (process.env.NODE_ENV === 'production') {
  // Déterminer le chemin vers les fichiers client
  let clientPath;
  
  try {
    if (process.env.ELECTRON_RUN_AS_NODE === '1' && process.resourcesPath) {
      // Si nous sommes dans Electron
      clientPath = path.join(process.resourcesPath, 'client/build');
    } else {
      // Fallback
      clientPath = path.resolve(__dirname, '../client/build');
    }
    
    console.log('Serving static files from:', clientPath);
    console.log('Directory exists:', fs.existsSync(clientPath));
    
    if (fs.existsSync(clientPath)) {
      // Lister les fichiers pour le débogage
      console.log('Client directory contains:');
      fs.readdirSync(clientPath).forEach(file => {
        console.log(`- ${file}`);
      });
    }
    
    // Servir les fichiers statiques
    app.use(express.static(clientPath));
    
    // IMPORTANT: Cette ligne a été déplacée à la fin des routes après la déclaration des routes API
    // pour éviter qu'elle ne capture toutes les requêtes avant les routes API
  } catch (error) {
    console.error('Error setting up static file serving:', error);
  }
}

// Ajouter ce middleware avant les autres routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Ajouter des logs pour voir les chemins exacts
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Uploads directory path:', uploadsPath);
console.log('Directory exists:', fs.existsSync(uploadsPath));

// Liste le contenu du dossier uploads pour le débogage
if (fs.existsSync(uploadsPath)) {
  console.log('Contenu du dossier uploads:');
  const listFiles = (dir, indent = '') => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const isDir = fs.statSync(itemPath).isDirectory();
      console.log(`${indent}${isDir ? '📁' : '📄'} ${item}`);
      if (isDir) {
        listFiles(itemPath, indent + '  ');
      }
    }
  };
  listFiles(uploadsPath);
}

// Servir les fichiers statiques
app.use('/uploads', (req, res, next) => {
  console.log(`Static file request: ${req.path}`);
  express.static(uploadsPath)(req, res, next);
});

// Après avoir chargé les configurations
console.log('=== DIRECTORY CONFIGURATION ===');
console.log(`UPLOAD_BASE_DIR: ${UPLOAD_BASE_DIR}`);
console.log(`Directory exists: ${fs.existsSync(UPLOAD_BASE_DIR)}`);
console.log(`TEMP_DIR: ${TEMP_DIR}`);
console.log(`Directory exists: ${fs.existsSync(TEMP_DIR)}`);

// Créer les répertoires s'ils n'existent pas
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  console.log(`Creating upload directory: ${UPLOAD_BASE_DIR}`);
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

if (!fs.existsSync(TEMP_DIR)) {
  console.log(`Creating temp directory: ${TEMP_DIR}`);
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Liste le contenu des dossiers pour le débogage
if (fs.existsSync(UPLOAD_BASE_DIR)) {
  console.log('Upload directory content:');
  fs.readdirSync(UPLOAD_BASE_DIR).forEach(item => {
    console.log(`- ${item}`);
  });
}

if (fs.existsSync(TEMP_DIR)) {
  console.log('Temp directory content:');
  fs.readdirSync(TEMP_DIR).forEach(item => {
    console.log(`- ${item}`);
  });
}

// Remplacer les placeholders dans les chemins
function resolvePath(pathString) {
  if (typeof pathString !== 'string') return pathString;
  
  if (pathString.includes('%APPDATA%')) {
    // Si on est dans Electron
    if (electronApp) {
      const userDataPath = electronApp.getPath('userData');
      return pathString.replace('%APPDATA%\\ECM Monitoring', userDataPath);
    } else if (process.env.APPDATA) {
      // Sinon, utiliser APPDATA standard
      return pathString.replace('%APPDATA%', process.env.APPDATA);
    }
  }
  return pathString;
}

// Utiliser cette fonction pour tous vos chemins si nécessaire
const uploadPath = process.env.UPLOAD_PATH ? resolvePath(process.env.UPLOAD_PATH) : UPLOAD_BASE_DIR;
console.log(`Resolved upload path: ${uploadPath}`);

// Dans server.js, avant de démarrer le serveur
// Route de diagnostic
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    clientPath: path.join(process.resourcesPath || '', 'client/build'),
    serverPath: __dirname
  });
});

// Test database connection before starting server
async function startServer() {
  let sequelize;
  
  try {
    // Import models only when we're ready to start the server
    const models = require('./models');
    sequelize = models.sequelize;
    
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
  } catch (modelError) {
    logger.error('Error loading models or connecting to database:', modelError.message);
    // Try to continue with basic sequelize connection
    try {
      const { Sequelize } = require('sequelize');
      sequelize = new Sequelize(
        process.env.DB_NAME || 'synergy',
        process.env.DB_USER || 'root', 
        process.env.DB_PASSWORD || 'root',
        {
          host: process.env.DB_HOST || 'database',
          dialect: 'mysql',
          logging: false
        }
      );
      await sequelize.authenticate();
      logger.info('Fallback database connection established successfully.');
    } catch (fallbackError) {
      logger.error('Fallback database connection failed:', fallbackError.message);
      process.exit(1);
    }
  }

  try {
    // Disable foreign key checks during sync to avoid reference errors
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    try {
      // Force creation of all tables
      await sequelize.sync({ force: false, alter: true });
      logger.info('Tables synchronized successfully');
    } catch (syncError) {
      // If alter fails, try force creation
      logger.warn('Alter sync failed, trying force creation:', syncError.message);
      await sequelize.sync({ force: true });
      logger.info('Tables synchronized with force: true');
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Nettoyage automatique des fichiers temporaires au démarrage
    try {
      logger.info('Starting automatic cleanup of temporary files...');
      const { cleanupOrphanedTempFiles } = require('./scripts/cleanup-temp-files');
      await cleanupOrphanedTempFiles();
      logger.info('Temporary files cleanup completed');
      
      // Programmer un nettoyage automatique toutes les 6 heures
      setInterval(async () => {
        try {
          logger.info('Running scheduled cleanup of temporary files...');
          await cleanupOrphanedTempFiles();
          logger.info('Scheduled cleanup completed');
        } catch (error) {
          logger.error('Error during scheduled cleanup:', error);
        }
      }, 6 * 60 * 60 * 1000); // 6 heures
      
    } catch (error) {
      logger.warn('Cleanup script not found, skipping automatic cleanup');
    }

    // **IMPORTANT** - Ajouter cette partie après l'initialisation de la BD
    // et avant le démarrage du serveur pour s'assurer que c'est la dernière route définie
    if (process.env.NODE_ENV === 'production') {
      let clientPath;
      if (process.env.ELECTRON_RUN_AS_NODE === '1' && process.resourcesPath) {
        clientPath = path.join(process.resourcesPath, 'client/build');
      } else {
        clientPath = path.resolve(__dirname, '../client/build');
      }

      // Cette route doit être déclarée à la fin pour capturer toutes les requêtes non-API
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
          console.log(`Serving React app for path: ${req.path}`);
          res.sendFile(path.join(clientPath, 'index.html'));
        }
      });
    }

    // Start the server
    app.listen(PORT, () => {
      const url = `http://localhost:${PORT}`;
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Accédez à votre serveur à l'adresse : ${url} pour voir un "Hello World" !`);
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

startServer();
