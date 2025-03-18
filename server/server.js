require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

// Port configuration
const PORT = process.env.PORT || 5001;

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
