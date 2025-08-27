/**
 * Configuration du client
 * Centralise les paramètres de configuration côté client
 */

// Définition de la durée d'inactivité principale (en secondes)
const SESSION_INACTIVITY_TIMEOUT_SECONDS = process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS 
  ? parseInt(process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS, 10)
  : 1200; // 20 minutes par défaut

// Configuration des délais d'authentification
const authConfig = {
  // Durée d'inactivité maximale avant expiration de session (en ms)
  sessionInactivityTimeout: SESSION_INACTIVITY_TIMEOUT_SECONDS * 1000,
  
  // Intervalle de vérification de l'activité du token (en ms)
  // Par défaut 1/8 de la durée d'inactivité totale
  activityCheckInterval: process.env.REACT_APP_ACTIVITY_CHECK_INTERVAL 
    ? parseInt(process.env.REACT_APP_ACTIVITY_CHECK_INTERVAL, 10) 
    : Math.max(15 * 1000, Math.floor(SESSION_INACTIVITY_TIMEOUT_SECONDS * 1000 / 8)),
  
  // Intervalle pour les heartbeats au serveur (en ms)
  // Par défaut 1/4 de la durée d'inactivité totale
  heartbeatInterval: process.env.REACT_APP_HEARTBEAT_INTERVAL
    ? parseInt(process.env.REACT_APP_HEARTBEAT_INTERVAL, 10)
    : Math.max(30 * 1000, Math.floor(SESSION_INACTIVITY_TIMEOUT_SECONDS * 1000 / 4)),
  
  // Seuil d'inactivité à partir duquel on n'envoie plus de heartbeat (%)
  heartbeatInactivityThreshold: 0.75, // 75% du temps d'inactivité total
  
  // Seuil d'inactivité à partir duquel on n'effectue plus de rafraîchissement de token (%)
  refreshInactivityThreshold: 0.8, // 80% du temps d'inactivité total
  
  // Durée avant expiration pour déclencher un rafraîchissement préventif (ms)
  // Par défaut 1/4 de la durée d'inactivité totale
  refreshThreshold: Math.max(30 * 1000, Math.floor(SESSION_INACTIVITY_TIMEOUT_SECONDS * 1000 / 4))
};

// API URL
const apiUrl = process.env.REACT_APP_API_URL;
if (!apiUrl) {
  throw new Error('REACT_APP_API_URL is not defined!');
}

export { authConfig, apiUrl, SESSION_INACTIVITY_TIMEOUT_SECONDS };
