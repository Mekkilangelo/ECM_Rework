require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Port configuration
const PORT = process.env.PORT || 5001;

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

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync models with the database
    await sequelize.sync({ alter: true }); // This will create the tables if they don't exist
    logger.info('Tables synchronized successfully.');    

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
