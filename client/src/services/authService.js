import api, { setIntentionalLogout } from './api';
import { jwtDecode } from 'jwt-decode';
import { authConfig, SESSION_INACTIVITY_TIMEOUT_SECONDS } from '../config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Afficher les paramètres de configuration au démarrage pour vérification
if (process.env.NODE_ENV === 'development') {
  console.log('====== CONFIGURATION DU SERVICE D\'AUTHENTIFICATION ======');
  console.log(`📋 VALEURS DU FICHIER .ENV:`);
  console.log(`  • REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS = ${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'NON DÉFINIE'}`);
  console.log(`  • REACT_APP_ACTIVITY_CHECK_INTERVAL = ${process.env.REACT_APP_ACTIVITY_CHECK_INTERVAL || 'NON DÉFINIE'}`);
  console.log(`  • REACT_APP_HEARTBEAT_INTERVAL = ${process.env.REACT_APP_HEARTBEAT_INTERVAL || 'NON DÉFINIE'}`);
  console.log(`\n📊 VALEURS CONFIGURÉES:`);
  console.log(`  • Délai d'inactivité: ${SESSION_INACTIVITY_TIMEOUT_SECONDS} secondes (${SESSION_INACTIVITY_TIMEOUT_SECONDS/60} minutes)`);
  console.log(`  • Délai d'inactivité total: ${authConfig.sessionInactivityTimeout/1000} secondes`);
  console.log(`  • Intervalle de vérification du token: ${authConfig.activityCheckInterval/1000} secondes`);
  console.log(`  • Intervalle de heartbeat: ${authConfig.heartbeatInterval/1000} secondes`);
  console.log(`  • Seuil de rafraîchissement proactif: ${authConfig.refreshThreshold/1000} secondes avant expiration`);
  console.log('=======================================================');
}

/**
 * Service d'authentification optimisé
 * 
 * Principales améliorations:
 * - Utilisation de jwt-decode pour vérifier l'expiration du token côté client
 * - Système de rafraîchissement plus simple et fiable
 * - Meilleure gestion des redirections et de l'activité utilisateur
 * - Moins de logs pour une meilleure performance
 */
const authService = {
  // Fréquence de vérification du token (ms)
  tokenCheckInterval: authConfig.activityCheckInterval,
  
  // Intervalle d'heartbeat pour maintenir la session active (ms)
  heartbeatInterval: authConfig.heartbeatInterval,
  
  // Instances des intervalles
  tokenChecker: null,
  heartbeat: null,
  
  // Durée avant expiration pour déclencher un rafraîchissement préventif (ms)
  refreshThreshold: authConfig.refreshThreshold,
  
  // Durée maximale d'inactivité pour expiration de session (ms)
  inactivityTimeout: authConfig.sessionInactivityTimeout,
  
  // Seuils d'inactivité en pourcentage
  heartbeatInactivityThreshold: authConfig.heartbeatInactivityThreshold,
  refreshInactivityThreshold: authConfig.refreshInactivityThreshold,
  
  /**
   * Connexion utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Données d'authentification
   */
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Extraction du token selon le format de réponse
      let token, userData;
      
      if (response.data?.success === true && response.data?.data) {
        token = response.data.data.token;
        userData = response.data.data.user;
      } else if (response.data?.token) {
        token = response.data.token;
        userData = response.data.user;
      }
      
      // Vérification et stockage du token
      if (token && typeof token === 'string' && token.split('.').length === 3) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData || {}));
        
        // Démarrer la gestion de session
        authService.startSessionManager();
        
        return { token, user: userData };
      } else {
        throw new Error('Token JWT invalide reçu du serveur');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error.message);
      throw error;
    }
  },
  
  /**
   * Déconnexion utilisateur
   */
  logout: () => {
    setIntentionalLogout(true);
    authService.stopSessionManager();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setTimeout(() => {
      window.location.href = '/login?success=logout';
    }, 10);
  },
  
  /**
   * Démarrer la gestion de session
   * - Vérifie périodiquement la validité du token
   * - Maintient la session active avec un heartbeat
   */
  startSessionManager: () => {
    authService.stopSessionManager(); // Nettoyer les intervalles existants
      // 1. Vérification périodique du token et de son expiration
    authService.tokenChecker = setInterval(() => {
      const token = authService.getToken();
      if (!token) {
        authService.stopSessionManager();
        return;
      }
      
      try {        // Vérifier l'inactivité utilisateur côté client
        const inactiveTime = Date.now() - authService.lastUserActivity;
        const configuredTimeoutSec = Math.round(authService.inactivityTimeout / 1000);
        
        if (inactiveTime >= authService.inactivityTimeout) {
          console.log(
            `[CONFIG] Inactivité maximale atteinte: ${Math.round(inactiveTime/1000)}s / ${configuredTimeoutSec}s` +
            `\n- Délai configuré dans .env: ${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'valeur par défaut'} secondes` +
            `\n- Expiration forcée de la session...`
          );
          authService.handleSessionExpired();
          return;
        }
        
        // Vérifier l'expiration du token
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // Si le token est expiré, rediriger vers login
        if (decoded.exp <= currentTime) {
          console.log('Token expiré détecté, redirection...');
          authService.handleSessionExpired();
          return;
        }        // Si le token est proche de l'expiration ET utilisateur actif, le rafraîchir
        const timeUntilExpiry = decoded.exp - currentTime;
        // Utiliser la variable configuredTimeoutSec déjà déclarée plus haut
        
        // Ne rafraîchir que si l'utilisateur est suffisamment actif (moins de 70% du temps d'inactivité configuré)
        if (timeUntilExpiry < authService.refreshThreshold / 1000 && 
            inactiveTime < authService.inactivityTimeout * 0.7) {
          console.log(
            `[CONFIG] Rafraîchissement proactif` +
            `\n- Expiration dans: ${Math.round(timeUntilExpiry)}s` +
            `\n- Inactivité actuelle: ${Math.round(inactiveTime/1000)}s / ${configuredTimeoutSec}s` +
            `\n- Délai configuré dans .env: ${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'valeur par défaut'} secondes`
          );
          authService.refreshToken();
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        authService.handleSessionExpired();
      }
    }, authService.tokenCheckInterval);// Variables pour suivre l'activité de l'utilisateur
    authService.lastUserActivity = Date.now();
    let inactiveTimeCount = 0;
    
    // Définir les événements d'activité (accessibles globalement dans authService)
    authService.activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Ajouter des écouteurs d'événements pour l'activité utilisateur
    authService.activityEvents.forEach(event => {
      window.addEventListener(event, authService.updateUserActivity);
    });
      // 2. Heartbeat pour maintenir la session active uniquement si l'utilisateur est actif
    authService.heartbeat = setInterval(async () => {
      try {
        if (authService.isLoggedIn()) {
          // Calculer le temps d'inactivité
          const inactiveTime = Date.now() - authService.lastUserActivity;
          
          // Incrémenter le compteur d'inactivité (pour les logs)
          inactiveTimeCount += authService.heartbeatInterval;          // Vérifier si l'utilisateur est actif
          // On n'envoie un heartbeat que si l'utilisateur est actif ET que l'inactivité est en-dessous
          // du seuil configuré
          const inactivityThreshold = authService.inactivityTimeout * authService.heartbeatInactivityThreshold;
          
          if (inactiveTime < inactivityThreshold) {
            // Utilisateur actif - envoyer un heartbeat pour maintenir la session
            const token = authService.getToken();
            const axios = (await import('axios')).default;
            
            // Utiliser un endpoint spécifique pour le heartbeat si disponible
            await axios.get(`${API_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
              // Calcul des indicateurs pour le log
            const inactiveSec = Math.round(inactiveTime/1000);
            const timeoutSec = Math.round(authService.inactivityTimeout/1000);
            const percentInactive = Math.round((inactiveTime / authService.inactivityTimeout) * 100);
            
            console.log(
              `[HEARTBEAT] Maintien de session - SUCCESS ✅` +
              `\n- Inactivité: ${inactiveSec}s / ${timeoutSec}s (${percentInactive}%)` +
              `\n- Délai configuré dans .env: ${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'valeur par défaut'} secondes`
            );
          } else {
            // Utilisateur inactif ou proche du seuil - ne pas envoyer de heartbeat
            const inactiveSec = Math.round(inactiveTime/1000);
            const timeoutSec = Math.round(authService.inactivityTimeout/1000);
            const percentInactive = Math.round((inactiveTime / authService.inactivityTimeout) * 100);
            const thresholdPercent = Math.round(authService.heartbeatInactivityThreshold * 100);
            
            console.log(
              `[HEARTBEAT] Maintien de session - BLOQUÉ ⚠️` +
              `\n- Inactivité: ${inactiveSec}s / ${timeoutSec}s (${percentInactive}%)` +
              `\n- Seuil de blocage: ${thresholdPercent}% du délai total (${Math.round(thresholdPercent * timeoutSec / 100)}s)` +
              `\n- Délai configuré dans .env: ${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'valeur par défaut'} secondes`
            );
          }
        }
      } catch (error) {
        console.warn('Erreur de heartbeat:', error.message);        // En cas d'erreur 401, la session est expirée
        if (error.response && error.response.status === 401) {          // Nettoyer les écouteurs d'événements avant la redirection
          authService.activityEvents.forEach(event => {
            window.removeEventListener(event, authService.updateUserActivity);
          });
          authService.handleSessionExpired();
        }
      }
    }, authService.heartbeatInterval);
  },
    /**
   * Arrêter la gestion de session
   */
  stopSessionManager: () => {
    // Nettoyer les intervalles
    if (authService.tokenChecker) {
      clearInterval(authService.tokenChecker);
      authService.tokenChecker = null;
    }
    
    if (authService.heartbeat) {
      clearInterval(authService.heartbeat);
      authService.heartbeat = null;
    }    // Nettoyer les écouteurs d'événements pour l'activité utilisateur
    if (authService.activityEvents) {
      console.log('Nettoyage des écouteurs d\'événements d\'activité');
      authService.activityEvents.forEach(event => {
        window.removeEventListener(event, authService.updateUserActivity);
      });
    }
  },
    /**
   * Gère l'expiration de session
   */
  handleSessionExpired: () => {
    console.log(
      `[SESSION] ⏱️ Session expirée` +
      `\n- Délai configuré dans .env: ${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'valeur par défaut'} secondes` +
      `\n- Redirection vers la page de connexion...`
    );
    authService.stopSessionManager();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    if (window.location.pathname !== '/login') {
      window.location.replace('/login?error=session_expired');
    }
  },
  // Dernière activité utilisateur connue (pour le rafraîchissement de token)
  lastUserActivity: Date.now(),
  /**
   * Met à jour la dernière activité utilisateur
   * Cette fonction est appelée par les écouteurs d'événements
   */  updateUserActivity: () => {
    const now = Date.now();
    authService.lastUserActivity = now;
    
    // Journaliser l'activité utilisateur (activé seulement en mode développement)
    if (process.env.NODE_ENV === 'development') {
      const lastUpdate = sessionStorage.getItem('last_activity_log');
      // Ne journaliser l'activité qu'une fois toutes les 10 secondes pour éviter de surcharger la console
      if (!lastUpdate || (now - parseInt(lastUpdate, 10)) > 10000) {
        // Calculer les seuils en secondes pour une meilleure lisibilité
        const totalTimeoutSec = Math.round(authService.inactivityTimeout / 1000);
        const heartbeatThresholdSec = Math.round(authService.inactivityTimeout * authService.heartbeatInactivityThreshold / 1000);
        const refreshThresholdSec = Math.round(authService.inactivityTimeout * authService.refreshInactivityThreshold / 1000);
        
        // Récupérer la valeur brute depuis l'environnement pour vérification
        const envTimeoutValue = process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS;
          console.log(
          `[ACTIVITÉ] 👆 Utilisateur actif - Timer d'inactivité réinitialisé` +
          `\n📋 CONFIGURATION:` +
          `\n  • Fichier .env: REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS=${envTimeoutValue || 'non définie'}` +
          `\n  • Expiration totale: ${totalTimeoutSec}s (${Math.round(totalTimeoutSec/60 * 10)/10} min) d'inactivité` +
          `\n  • Heartbeats bloqués après: ${heartbeatThresholdSec}s (${Math.round(heartbeatThresholdSec/60 * 10)/10} min) d'inactivité` +
          `\n  • Rafraîchissement bloqué après: ${refreshThresholdSec}s (${Math.round(refreshThresholdSec/60 * 10)/10} min) d'inactivité`
        );
        sessionStorage.setItem('last_activity_log', now.toString());
      }
    }
  },
  
  /**
   * Rafraîchit le token JWT
   * @returns {Promise<Object>}
   */
  refreshToken: async () => {
    try {
      const token = authService.getToken();
      if (!token) throw new Error('Aucun token à rafraîchir');      // Vérifier si l'utilisateur a été actif récemment
      const inactiveTime = Date.now() - authService.lastUserActivity;
      // Utiliser le seuil d'inactivité configuré pour les refresh
      const maxInactivityForRefresh = authService.inactivityTimeout * authService.refreshInactivityThreshold;
      const configuredTimeoutSec = Math.round(authService.inactivityTimeout / 1000);
      const maxInactivitySec = Math.round(maxInactivityForRefresh / 1000);
      
      if (inactiveTime > maxInactivityForRefresh) {
        const percentInactive = Math.round((inactiveTime / authService.inactivityTimeout) * 100);
        const inactiveSec = Math.round(inactiveTime/1000);        console.log(
          `[TOKEN] ⛔ Rafraîchissement BLOQUÉ - Utilisateur trop inactif` +
          `\n📋 DONNÉES:` +
          `\n  • Inactivité: ${inactiveSec}s / ${configuredTimeoutSec}s (${percentInactive}%)` +
          `\n  • Seuil de blocage: ${maxInactivitySec}s (${authService.refreshInactivityThreshold * 100}% du délai total)` +
          `\n  • Valeur du .env: REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS=${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'non définie'}`
        );
        // Si l'utilisateur est inactif depuis trop longtemps, ne pas rafraîchir le token
        // pour permettre l'expiration normale de la session
        return null;
      }
      
      console.log(
        `[TOKEN] 🔄 Rafraîchissement en cours` +
        `\n📋 DONNÉES:` +
        `\n  • Inactivité: ${Math.round(inactiveTime/1000)}s / ${configuredTimeoutSec}s (${Math.round((inactiveTime/authService.inactivityTimeout)*100)}%)` +
        `\n  • Valeur du .env: REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS=${process.env.REACT_APP_SESSION_INACTIVITY_TIMEOUT_SECONDS || 'non définie'}`
      );
      const response = await api.post('/auth/refresh-token', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Amélioration de la vérification de la réponse
      if (response.data && response.data.success !== false) {
        // Support de différentes structures de réponse
        const newToken = response.data.token || (response.data.data && response.data.data.token);
        const userData = response.data.user || (response.data.data && response.data.data.user);
        
        if (newToken) {
          localStorage.setItem('token', newToken);
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          return { token: newToken, user: userData };
        }
      }
      
      console.warn('Format de réponse invalide lors du rafraîchissement du token:', response.data);
      return null;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      if (error.response?.status === 401) {
        // Si le token est définitivement expiré, on ne considère pas cela comme une erreur critique
        // mais on laisse le système gérer naturellement cette expiration
        return null;
      }
      throw error;
    }
  },
  
  /**
   * Vérifie si l'utilisateur est connecté
   * @returns {boolean}
   */
  isLoggedIn: () => {
    return !!authService.getToken();
  },
  
  /**
   * Configure le suivi d'activité
   * Alias pour startSessionManager (pour compatibilité)
   */
  setupActivityTracking: () => {
    authService.startSessionManager();
  },
  
  /**
   * Récupération du token stocké
   * @returns {string|null}
   */
  getToken: () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined' || token === 'null') return null;
      
      // Vérification basique de la structure (3 parties séparées par des points)
      if (token.split('.').length !== 3) return null;
      
      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  },
  
  /**
   * Récupération des données utilisateur
   * @returns {Object|null}
   */
  getUser: () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return null;
      
      return JSON.parse(userString);
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  },
  
  /**
   * Récupération des informations de l'utilisateur connecté depuis l'API
   * @returns {Promise}
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;
