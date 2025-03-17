// server/server.js
require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

// Port configuration
const PORT = process.env.PORT || 5001;

// Test database connection before starting server
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
