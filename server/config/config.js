/**
 * Configuration globale de l'application
 * Centralise les paramètres de configuration
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

require('dotenv').config();

// Chemin de base pour les ressources
const basePath = path.resolve(__dirname, '..');

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
      // Note: Le logger n'est pas encore disponible ici
      if (process.env.NODE_ENV === 'development') {
        console.log(`Loading environment from: ${envPath}`);
      }
      dotenv.config({ path: envPath });
      break;
    }
  }
} catch (err) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Warning: Unable to load .env file, using defaults', err);
  }
}

// Configuration de l'application
const config = {
  // Environnement
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5001,
  
  // URLs
  API_URL: (() => {
    if (!process.env.API_URL) throw new Error('API_URL is not defined!');
    return process.env.API_URL;
  })(),
  CLIENT_URL: (() => {
    if (!process.env.CLIENT_URL) throw new Error('CLIENT_URL is not defined!');
    return process.env.CLIENT_URL;
  })(),
  
  // Chemins de fichiers
  PATHS: {
    UPLOAD: process.env.UPLOAD_PATH || path.join(basePath, 'uploads'),
    TEMP: process.env.TEMP_PATH || path.join(basePath, 'uploads/temp'),
    ROOT: process.env.ROOT_PATH || path.join(basePath, 'data'),
    PUMP: process.env.PUMP_PATH || path.join(basePath, 'pump-data'),
    BACKUP: process.env.BACKUP_DIR || path.join(basePath, 'backups')
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
  },  // JSON Web Token
  JWT: {
    SECRET: (() => {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET must be defined in environment variables for security reasons');
      }
      if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
      }
      return secret;
    })(),
    EXPIRE: process.env.JWT_EXPIRE || '24h',
    // Durée d'inactivité configurée par la variable d'environnement ou 10 minutes par défaut
    INACTIVITY_EXPIRE: process.env.JWT_INACTIVITY_EXPIRE || '10m'
  },
  
  // Python
  PYTHON: {
    PATH: process.env.PYTHON_PATH || 'python'
  }
};

module.exports = config;