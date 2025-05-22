import api, { setIntentionalLogout } from './api';
import { authConfig } from '../config';

/**
 * Service d'authentification
 * Gère les appels API liés à l'authentification
 */
const authService = {
  // Timer pour détecter l'inactivité
  activityTimer: null,
  // Durée avant rafraîchissement du token (minutes en ms)
  refreshInterval: authConfig.refreshBeforeExpire * 60 * 1000,
  // Intervalle de vérification de l'activité
  activityCheckInterval: authConfig.activityCheckInterval,
  // Flag pour indiquer si c'est un rafraîchissement silencieux
  silentRefresh: false,
  // Timestamp de la dernière activité utilisateur 
  lastActivity: Date.now(),
  // Timestamp du dernier rafraîchissement de token
  lastTokenRefresh: Date.now(),
  // Intervalle minimal entre deux rafraîchissements (ms)
  minRefreshInterval: 60 * 1000, // Augmenté à 60 secondes pour éviter les appels trop fréquents
  // Flag pour éviter les appels parallèles
  isRefreshing: false,
  
  /**
   * Connexion utilisateur
   * @param {string} username - Nom d'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Données d'authentification (token et informations utilisateur)
   * @throws {Error} En cas d'échec de l'authentification
   */  
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      console.log('Réponse complète du serveur:', response);
      
      // Dans la nouvelle structure API, le token peut être dans response.data.data.token
      let token = null;
      let userData = null;
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true && response.data.data) {
        // Structure: { success: true, message: '...', data: { token: '...', user: {...} } }
        token = response.data.data.token;
        userData = response.data.data.user;
        console.log('Token trouvé dans response.data.data.token');
      } else if (response.data && response.data.token) {
        // Structure: { token: '...', user: {...} } ou { success: true, token: '...', user: {...} }
        token = response.data.token;
        userData = response.data.user;
        console.log('Token trouvé dans response.data.token');
      }
      
      // Stocker le token dans le localStorage avec vérification
      if (token) {
        // Vérifier que le token a une structure JWT valide
        if (typeof token === 'string' && token.split('.').length === 3) {
          console.log('Token JWT valide reçu, structure correcte');
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData || {}));
          // Démarrer le suivi d'activité
          authService.setupActivityTracking();
          
          // Retourner les données au format attendu
          return {
            token,
            user: userData
          };
        } else {
          console.error('Token JWT invalide reçu du serveur:', 
            typeof token === 'string' ? `${token.substring(0, 10)}...` : typeof token);
          throw new Error('Token JWT malformé reçu du serveur');
        }
      } else {
        console.error('Aucun token reçu dans la réponse du serveur:', response.data);
        throw new Error('Aucun token reçu');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  },
  
  /**
   * Déconnexion utilisateur
   */
  logout: () => {
    // Marquer la déconnexion comme intentionnelle avant de supprimer le token
    setIntentionalLogout(true);
    
    // Nettoyer les ressources
    authService.cleanup();
    
    // Supprimer le token et les données utilisateur
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de login avec un message de succès
    // On utilise un timeout pour s'assurer que les écouteurs d'événements sont nettoyés
    setTimeout(() => {
      window.location.href = '/login?success=logout';
    }, 10);
  },
  
  /**
   * Supprime les écouteurs d'événements d'activité
   */
  removeActivityListeners: () => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, authService.resetActivityTimer);
    });
  },
  
  /**
   * Configuration du suivi d'activité
   */
  setupActivityTracking: () => {
    // Liste des événements à surveiller
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Nettoyer tout timer existant
    if (authService.activityTimer) {
      clearTimeout(authService.activityTimer);
      authService.activityTimer = null;
    }
    
    // D'abord supprimer les écouteurs existants pour éviter les doublons
    authService.removeActivityListeners();
    
    // Ajouter les écouteurs d'événements pour chaque type d'événement
    events.forEach(event => {
      document.addEventListener(event, authService.resetActivityTimer, { passive: true });
    });
    
    // Initialiser le timer et les timestamps
    authService.lastActivity = Date.now();
    authService.lastTokenRefresh = Date.now();
    authService.resetActivityTimer();
    
    // Démarrer le processus de vérification périodique
    authService.startPeriodicCheck();
  },
  
  /**
   * Réinitialise le timer d'activité
   */
  resetActivityTimer: () => {
    // Mettre à jour le timestamp de la dernière activité
    authService.lastActivity = Date.now();
    
    if (authService.activityTimer) {
      clearTimeout(authService.activityTimer);
    }
    
    // Programmation du rafraîchissement du token
    authService.activityTimer = setTimeout(() => {
      // Vérifier simplement si un rafraîchissement est nécessaire
      // Le rafraîchissement effectif est géré par startPeriodicCheck
      authService.checkAndRefreshToken();
    }, authService.refreshInterval);
  },
  
  /**
   * Démarre une vérification périodique de l'activité et du token
   * Cette fonction est plus robuste que le simple timer d'activité
   */
  startPeriodicCheck: () => {
    // Annuler tout intervalle existant
    if (authService.periodicCheckInterval) {
      clearInterval(authService.periodicCheckInterval);
    }
    
    // Créer un nouvel intervalle pour vérifier régulièrement l'activité
    // Utiliser un intervalle d'au moins 60 secondes pour éviter les appels excessifs
    const checkInterval = Math.max(authService.activityCheckInterval, 60000);
    
    authService.periodicCheckInterval = setInterval(() => {
      // Si l'utilisateur n'est pas connecté, arrêter les vérifications
      if (!authService.isLoggedIn()) {
        clearInterval(authService.periodicCheckInterval);
        authService.periodicCheckInterval = null;
        return;
      }
      
      // Éviter les vérifications multiples si un rafraîchissement est déjà en cours
      if (!authService.isRefreshing) {
        authService.checkAndRefreshToken();
      }
    }, checkInterval); // Utiliser l'intervalle minimum de 60 secondes
    
    console.log(`Vérification périodique démarrée avec intervalle de ${checkInterval/1000} secondes`);
  },
  
  /**
   * Vérifie si un rafraîchissement du token est nécessaire et l'effectue
   */
  checkAndRefreshToken: async () => {
    // Si un rafraîchissement est déjà en cours, ne pas en démarrer un autre
    if (authService.isRefreshing) {
      return;
    }
    
    try {
      authService.isRefreshing = true;
      const now = Date.now();
      // Calculer le temps d'inactivité
      const inactiveTime = now - authService.lastActivity;
      
      // Si aucun token n'est présent, ne rien faire
      if (!authService.getToken()) {
        authService.isRefreshing = false;
        return;
      }
        // Définir le seuil d'inactivité selon la configuration
      // refreshBeforeExpire minutes en millisecondes (par défaut 9 minutes)
      const inactivityThreshold = authService.refreshInterval;
      
      // Logs de débogage améliorés
      console.log(`État actuel de l'activité:
      - Temps d'inactivité: ${Math.round(inactiveTime/1000)}s
      - Seuil de rafraîchissement: ${Math.round(inactivityThreshold/1000)}s (${authConfig.refreshBeforeExpire} minutes)
      - Intervalle entre vérifications: ${Math.round(authService.activityCheckInterval/1000)}s`);
      
      // Si l'utilisateur est inactif depuis plus longtemps que le seuil configuré
      if (inactiveTime > inactivityThreshold) {
        console.log(`Inactivité détectée: ${Math.round(inactiveTime/1000)}s - Tentative de rafraîchissement...`);
        
        // Au lieu de déconnecter immédiatement, essayer de rafraîchir le token
        try {
          await authService.refreshToken(true);
          authService.lastTokenRefresh = Date.now();
          console.log('Rafraîchissement réussi après inactivité');
          authService.isRefreshing = false;
          return;
        } catch (refreshError) {
          console.log('Échec du rafraîchissement après inactivité - Déconnexion');
          // Si le rafraîchissement échoue, déconnecter l'utilisateur
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Nettoyer les timers
          authService.cleanup();
            // Rediriger vers la page de login avec un message d'erreur
          // Vérifier qu'on n'est pas déjà sur la page de login et forcer la redirection
          if (window.location.pathname !== '/login') {
            console.log('Redirection vers login après échec de rafraîchissement...');
            setTimeout(() => {
              window.location.replace('/login?error=session_expired');
            }, 100);
          }
          
          authService.isRefreshing = false;
          return;
        }
      }
      
      // Vérifier si le dernier rafraîchissement est trop récent
      const timeSinceLastRefresh = now - authService.lastTokenRefresh;
      if (timeSinceLastRefresh < authService.minRefreshInterval) {
        // Trop récent, on ne rafraîchit pas
        authService.isRefreshing = false;
        return;
      }
        // Rafraîchir préventivement le token si on atteint 75% du seuil d'inactivité
      // Pour 9 minutes, cela signifie environ 6.75 minutes
      const preventiveThreshold = inactivityThreshold * 0.75;
      if (inactiveTime > preventiveThreshold) {
        console.log(`Rafraîchissement préventif:
        - Inactivité actuelle: ${Math.round(inactiveTime/1000)}s
        - Seuil préventif (75%): ${Math.round(preventiveThreshold/1000)}s
        - Seuil total: ${Math.round(inactivityThreshold/1000)}s`);
        
        await authService.refreshToken(true); // Rafraîchissement silencieux
        authService.lastActivity = Date.now(); // Réinitialiser le compteur d'activité aussi
        authService.lastTokenRefresh = Date.now();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification/rafraîchissement du token:', error);
        // En cas d'erreur 401 (non autorisé), cela signifie que le serveur a rejeté le token
      if (error.response && error.response.status === 401) {
        console.log('Session expirée côté serveur - Déconnexion forcée');
        
        // Nettoyage complet
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        authService.cleanup();
        
        // Rediriger vers login - Utiliser une redirection forcée
        console.log('Redirection vers login en cours...');
        setTimeout(() => {
          window.location.replace('/login?error=session_expired');
        }, 100);
      }
    } finally {
      authService.isRefreshing = false;
    }
  },
  
  /**
   * Rafraîchissement du token JWT basé sur l'activité
   * @param {boolean} silent - Si true, ne pas rediriger en cas d'échec
   * @returns {Promise} - Promesse avec le nouveau token
   */  refreshToken: async (silent = false) => {
    try {
      authService.silentRefresh = silent;
      
      const token = authService.getToken();
      if (!token) throw new Error('Aucun token à rafraîchir');
      
      // Vérifier que le token est bien formé
      if (token.split('.').length !== 3) {
        console.error('Tentative de rafraîchir un token malformé');
        throw new Error('Token malformé');
      }
      
      // Ajouter explicitement le header pour cette requête (sans dépendre de l'intercepteur)
      const response = await api.post('/auth/refresh-token', {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Mettre à jour le timestamp du dernier rafraîchissement
        authService.lastTokenRefresh = Date.now();
        
        return response.data;
      }
    } catch (error) {
      // Si le rafraîchissement échoue avec une erreur 401, cela signifie que la session a expiré
      if (error.response && error.response.status === 401) {
        console.log('La session a expiré en raison de l\'inactivité');
      }
      
      if (!silent) {
        // Seulement nettoyer les données d'authentification si ce n'est pas un rafraîchissement silencieux
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Nettoyer les timers
        authService.cleanup();
          // Rediriger vers la page de login (si ce n'est pas un rafraîchissement silencieux)
        if (window.location.pathname !== '/login') {
          console.log('Redirection vers login après erreur non silencieuse...');
          setTimeout(() => {
            window.location.replace('/login?error=session_expired');
          }, 100);
        }
      } else {
        // Même pour un rafraîchissement silencieux, rediriger si l'erreur est 401
        // Cette partie est ajoutée pour assurer la redirection en cas d'expiration
        if (error.response && error.response.status === 401) {
          // Nettoyer les données d'authentification
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Nettoyer les timers
          authService.cleanup();
            // Forcer la redirection vers login
          if (window.location.pathname !== '/login') {
            console.log('Redirection vers login après erreur 401 silencieuse...');
            setTimeout(() => {
              window.location.replace('/login?error=session_expired');
            }, 100);
          }
        }
      }
      throw error;
    } finally {
      authService.silentRefresh = false;
    }
  },
  
  /**
   * Nettoyage des ressources lors de la déconnexion
   */
  cleanup: () => {
    // Nettoyer les timers
    if (authService.activityTimer) {
      clearTimeout(authService.activityTimer);
      authService.activityTimer = null;
    }
    
    if (authService.periodicCheckInterval) {
      clearInterval(authService.periodicCheckInterval);
      authService.periodicCheckInterval = null;
    }
    
    // Supprimer les écouteurs d'événements
    authService.removeActivityListeners();
  },
  
  /**
   * Récupération des informations de l'utilisateur connecté
   * @returns {Promise} - Promesse avec les données utilisateur
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
   * Récupération du token stocké
   * @returns {string|null} - Token JWT ou null
   */  getToken: () => {
    try {
      const token = localStorage.getItem('token');
      // Vérifier que token existe et n'est pas la chaîne "undefined"
      if (token && token !== "undefined" && token.trim() !== "") {
        // Vérifier que le token a bien la structure JWT (xxx.yyy.zzz)
        if (token.split('.').length === 3) {
          return token;
        } else {
          console.error('Token mal formaté trouvé dans localStorage');
          // Ne pas supprimer immédiatement pour éviter les boucles infinies
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  },
  
  /**
   * Vérification si un utilisateur est connecté
   * @returns {boolean} - Vrai si connecté
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },
    /**
   * Récupération de l'utilisateur stocké
   * @returns {Object|null} - Objet utilisateur ou null
   */
  getUser: () => {
    const user = localStorage.getItem('user');
    // Vérifier que user existe et n'est pas la chaîne "undefined"
    if (user && user !== "undefined") {
      try {
        return JSON.parse(user);
      } catch (error) {
        console.error("Erreur de parsing JSON pour l'utilisateur:", error);
        return null;
      }
    }
    return null;
  }
};

export default authService;