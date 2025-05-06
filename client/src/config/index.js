/**
 * Configuration du client
 * Centralise les paramètres de configuration côté client
 */

// Configuration des délais d'authentification
const authConfig = {
  // Temps avant rafraîchissement du token (en minutes)
  // Doit être légèrement inférieur au JWT_INACTIVITY_EXPIRE du serveur
  refreshBeforeExpire: process.env.REACT_APP_JWT_REFRESH_BEFORE_EXPIRE 
    ? parseInt(process.env.REACT_APP_JWT_REFRESH_BEFORE_EXPIRE, 10) 
    : 9,
    
  // Intervalle de vérification de l'activité (en millisecondes)
  // Par défaut 1 minute
  activityCheckInterval: process.env.REACT_APP_ACTIVITY_CHECK_INTERVAL 
    ? parseInt(process.env.REACT_APP_ACTIVITY_CHECK_INTERVAL, 10) 
    : 60 * 1000
};

// API URL
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export { authConfig, apiUrl };