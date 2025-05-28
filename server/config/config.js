/**
 * Configuration globale de l'application
 * Centralise les paramètres de configuration
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

require('dotenv').config();

// Chemin de base pour les ressources
const isElectron = process.env.ELECTRON_RUN_AS_NODE === '1';
const basePath = isElectron ? process.resourcesPath : path.resolve(__dirname, '..');

// Tenter de charger .env, mais continuer même en cas d'échec
try {
  // Chercher le fichier .env à plusieurs endroits possibles
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(basePath, '.env'),
    path.join(basePath, 'server', '.env'),
    path.join(process.cwd(), '.env')
  ];
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      console.log(`Loading environment from: ${envPath}`);
      dotenv.config({ path: envPath });
      break;
    }
  }
} catch (err) {
  console.warn('Warning: Unable to load .env file, using defaults', err);
}

// Configuration de l'application
const config = {
  // Environnement
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  
  // URLs
  API_URL: process.env.API_URL || 'http://localhost:5001/api',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  
  // Chemins de fichiers
  PATHS: {
    UPLOAD: process.env.UPLOAD_PATH || path.join(basePath, 'uploads'),
    TEMP: process.env.TEMP_PATH || path.join(basePath, 'uploads/temp'),
    ROOT: process.env.ROOT_PATH || (isElectron ? path.join(basePath, 'data') : 'C:/Users/mekki/Desktop/CIA/ECM/Monitoring/NEW_BASE'),
    PUMP: process.env.PUMP_PATH || 'C:/Users/mekki/Desktop/DATA(X)/DATA(X)/C2 - TECHNIQUE/AFFAIRES EN COURS',
    BACKUP: process.env.BACKUP_DIR || 'C:/Users/mekki/Desktop/backups'
  },
    // Base de données
  DB: {
    HOST: process.env.DB_HOST || '127.0.0.1',
    NAME: process.env.DB_NAME || 'synergy',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    PORT: process.env.DB_PORT || 3306,
    SYNC_ALTER: process.env.DB_SYNC_ALTER === 'true'
  },
  
  // Options de sécurité et d'accès
  ACCESS: {
    GLOBAL_READ_ONLY: process.env.GLOBAL_READ_ONLY === 'true',
  },
  // JSON Web Token
  JWT: {
    SECRET: process.env.JWT_SECRET || 'default_jwt_secret_for_development_and_testing',
    EXPIRE: process.env.JWT_EXPIRE || '24h',
    // Durée d'inactivité configurée par la variable d'environnement ou 2 minutes par défaut
    INACTIVITY_EXPIRE: process.env.JWT_INACTIVITY_EXPIRE || '2m', 
    // Durée avant expiration pour déclencher un rafraîchissement (1/4 du temps d'inactivité par défaut)
    REFRESH_BEFORE_EXPIRE: parseInt(process.env.JWT_REFRESH_BEFORE_EXPIRE || '30', 10) // En secondes
  },
  
  // Python
  PYTHON: {
    PATH: process.env.PYTHON_PATH || 'python'
  }
};

module.exports = config;