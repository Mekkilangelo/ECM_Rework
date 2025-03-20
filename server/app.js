// server/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
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
//const fileRoutes = require('./routes/files');
const furnaceRoutes = require('./routes/furnaces'); 
const userRoutes = require('./routes/users'); 
const enumRoutes = require('./routes/enums');
const hierarchyRoutes = require('./routes/hierarchy');

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
//app.use('/api/files', fileRoutes);
app.use('/api/furnaces', furnaceRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/enums', enumRoutes);
app.use('/api/nodes', hierarchyRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de gestion hiérarchique' });
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
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build/index.html'));
  });
}

// 404 handler for undefined routes - doit être APRÈS toutes les routes définies
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;