/**
 * Configuration générale de l'application
 * Définit les constantes et les paramètres de l'application
 */

require('dotenv').config();

module.exports = {
  // Paramètres du serveur
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT pour l'authentification
  JWT_SECRET: process.env.JWT_SECRET || 'your_secret_jwt',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '24h',
  
  // Chemins pour les fichiers
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  
  // Chemins pour les dossiers sources choisis manuellement
  ROOT_PATH: process.env.ROOT_PATH || 'C:/Users/mekki/Desktop/CIA/ECM/Monitoring/NEW_BASE',
  PUMP_PATH: process.env.PUMP_PATH || 'C:/Users/mekki/Desktop/DATA(X)/DATA(X)/C2 - TECHNIQUE/AFFAIRES EN COURS',
  
  // Backup
  BACKUP_DIR: process.env.BACKUP_DIR || 'C:/Users/mekki/Desktop/backups',
  
  // URL de base pour l'API
  API_URL: process.env.API_URL || 'http://localhost:5001/api',
  
  // URL du client (frontend)
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
};