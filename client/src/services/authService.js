import api, { setIntentionalLogout } from './api';
import { jwtDecode } from 'jwt-decode';
import { authConfig } from '../config';
import logger from '../utils/logger';

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
      logger.auth.error('login', error, { username });
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
        
        if (inactiveTime >= authService.inactivityTimeout) {
          authService.handleSessionExpired();
          return;
        }
        
        // Vérifier l'expiration du token
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
          // Si le token est expiré, rediriger vers login
        if (decoded.exp <= currentTime) {
          authService.handleSessionExpired();
          return;
        }
        
        // Si le token est proche de l'expiration ET utilisateur actif, le rafraîchir
        const timeUntilExpiry = decoded.exp - currentTime;
        
        // Ne rafraîchir que si l'utilisateur est suffisamment actif (moins de 70% du temps d'inactivité configuré)
        if (timeUntilExpiry < authService.refreshThreshold / 1000 && 
            inactiveTime < authService.inactivityTimeout * 0.7) {
          authService.refreshToken();
        }
      } catch (error) {
        logger.auth.error('token verification', error);
        authService.handleSessionExpired();
      }
    }, authService.tokenCheckInterval);// Variables pour suivre l'activité de l'utilisateur
    authService.lastUserActivity = Date.now();
    
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

          // Vérifier si l'utilisateur est actif
          // On n'envoie un heartbeat que si l'utilisateur est actif ET que l'inactivité est en-dessous
          // du seuil configuré
          const inactivityThreshold = authService.inactivityTimeout * authService.heartbeatInactivityThreshold;
          if (inactiveTime < inactivityThreshold) {
            // Utilisateur actif - envoyer un heartbeat pour maintenir la session
            await api.get('/auth/me');
          }
        }
      } catch (error) {
        logger.warn('auth', 'Heartbeat error', { message: error.message });        // En cas d'erreur 401, la session est expirée
        if (error.response && error.response.status === 401) {
          // Nettoyer les écouteurs d'événements avant la redirection
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
      authService.activityEvents.forEach(event => {
        window.removeEventListener(event, authService.updateUserActivity);
      });
    }
  },
  /**
   * Gère l'expiration de session
   */
  handleSessionExpired: () => {
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
      
      if (inactiveTime > maxInactivityForRefresh) {
        // Si l'utilisateur est inactif depuis trop longtemps, ne pas rafraîchir le token
        // pour permettre l'expiration normale de la session
        return null;
      }
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
      
      logger.warn('auth', 'Invalid response format during token refresh', response.data);
      return null;
    } catch (error) {
      logger.auth.error('token refresh', error);
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
      logger.auth.error('getToken', error);
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
      logger.auth.error('getUser', error);
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
  },

  /**
   * Changement de mot de passe
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<Object>} Réponse de l'API
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return response.data;
    } catch (error) {
      logger.auth.error('changePassword', error);
      throw error;
    }
  }
};

export default authService;
