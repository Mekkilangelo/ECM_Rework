/**
 * Singleton de connexion à la base de données
 * Instance unique partagée dans toute l'application
 * Utilise Lazy Loading pour s'assurer que .env est chargé
 */

// CRITIQUE : Charger dotenv EN PREMIER
require('dotenv').config();

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Obtenir la configuration DB (lazy - au moment de l'utilisation)
 */
function getDBConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'synergia',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      multipleStatements: true,
      decimalNumbers: true
    }
  };
}

/**
 * Instance Singleton de Sequelize
 * Créée une seule fois, réutilisée partout
 */
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }

    // Lazy loading : créer Sequelize seulement au premier accès
    this.sequelize = null;
    this._initialized = false;

    Database.instance = this;
  }

  /**
   * Initialiser la connexion Sequelize (lazy)
   */
  _initialize() {
    if (this._initialized) {
      return;
    }

    const config = getDBConfig();

    this.sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: config.logging,
        pool: config.pool,
        dialectOptions: config.dialectOptions
      }
    );

    this._initialized = true;
  }

  /**
   * Obtenir l'instance Sequelize
   */
  getSequelize() {
    this._initialize(); // Initialiser si pas déjà fait
    return this.sequelize;
  }

  /**
   * Tester la connexion
   */
  async testConnection() {
    this._initialize(); // Initialiser si pas déjà fait
    
    try {
      await this.sequelize.authenticate();
      logger.info('✅ Connexion à la base de données établie avec succès');
      return true;
    } catch (error) {
      // Si la base de données n'existe pas, essayer de la créer
      if (error.message.includes('Unknown database')) {
        logger.warn('⚠️ Base de données inexistante, tentative de création...');
        const created = await this._createDatabaseIfNotExists();
        if (created) {
          // Réessayer la connexion
          await this.sequelize.authenticate();
          logger.info('✅ Connexion à la base de données établie avec succès');
          return true;
        }
      }
      
      logger.error('❌ Impossible de se connecter à la base de données', { error: error.message });
      return false;
    }
  }

  /**
   * Créer la base de données si elle n'existe pas
   * @private
   */
  async _createDatabaseIfNotExists() {
    try {
      const config = getDBConfig();
      
      // Connexion sans spécifier de base de données
      const sequelizeRoot = new Sequelize('', config.username, config.password, {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: false
      });

      // Créer la base de données
      await sequelizeRoot.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      
      logger.info(`✅ Base de données '${config.database}' créée avec succès`);
      
      await sequelizeRoot.close();
      return true;
    } catch (error) {
      logger.error('❌ Erreur lors de la création de la base de données', { error: error.message });
      return false;
    }
  }

  /**
   * Synchroniser les modèles avec la base de données
   */
  async syncModels() {
    this._initialize(); // Initialiser si pas déjà fait
    
    try {
      // Désactiver les contraintes FK temporairement
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      const shouldAlter = process.env.DB_SYNC_ALTER === 'true';
      const shouldForce = process.env.DB_SYNC_FORCE === 'true';
      
      if (shouldForce) {
        // ⚠️ MODE DANGEREUX : Supprime et recrée TOUTES les tables
        await this.sequelize.sync({ force: true });
        logger.warn('🔥 Tables RECRÉÉES avec force: true (DONNÉES SUPPRIMÉES!)');
      } else if (shouldAlter) {
        await this.sequelize.sync({ force: false, alter: true });
        logger.info('📊 Tables synchronisées avec alter: true');
      } else {
        await this.sequelize.sync({ force: false });
        logger.info('📊 Tables synchronisées en mode sécurisé');
      }

      // Réactiver les contraintes FK
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      return true;
    } catch (error) {
      logger.error('❌ Erreur lors de la synchronisation des modèles', { error: error.message });
      throw error;
    }
  }

  /**
   * Fermer la connexion proprement
   */
  async close() {
    if (!this._initialized || !this.sequelize) {
      return; // Pas initialisé, rien à fermer
    }

    try {
      await this.sequelize.close();
      logger.info('🔌 Connexion à la base de données fermée');
    } catch (error) {
      logger.error('❌ Erreur lors de la fermeture de la connexion DB', { error: error.message });
    }
  }
}

// Exporter l'instance unique
const database = new Database();

module.exports = database;