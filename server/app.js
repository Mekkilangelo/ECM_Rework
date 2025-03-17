// server/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes (commented out for initial testing)
// Auth routes
// app.use('/api/auth', require('./routes/auth'));

// Data routes - uncomment as you implement each one
// app.use('/api/clients', require('./routes/clients'));
// app.use('/api/orders', require('./routes/orders')); 
// app.use('/api/parts', require('./routes/parts'));
// app.use('/api/tests', require('./routes/tests'));
// app.use('/api/steels', require('./routes/steels'));
// app.use('/api/files', require('./routes/files'));
// app.use('/api/enums', require('./routes/enums'));
// app.use('/api/hierarchy', require('./routes/hierarchy'));

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

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
