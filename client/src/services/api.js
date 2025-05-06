import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Création d'une instance Axios avec l'URL de base
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 secondes de timeout
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false // Cross-origin cookies si nécessaire
});

// Flag pour éviter les redirictions multiples et déterminer si la déconnexion est intentionnelle
let isRedirecting = false;
let isIntentionalLogout = false;
let isInitialLoad = true;
let isRefreshing = false;
let failedQueue = [];

// Fonctions exportées pour modifier les flags
export const setIntentionalLogout = (value) => {
  isIntentionalLogout = value;
};

// Fonction pour indiquer que le chargement initial est terminé
export const setInitialLoadComplete = () => {
  isInitialLoad = false;
};

// Fonction pour traiter la file d'attente des requêtes échouées
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur pour ajouter automatiquement le token aux requêtes
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse (ex: 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si nous avons une erreur 401 (non autorisé) et que nous n'avons pas déjà essayé de rafraîchir le token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Si nous sommes en train de rafraîchir le token, mettre la requête en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }
      
      // Ne pas essayer de rafraîchir lors du chargement initial
      if (isInitialLoad) {
        console.log('Token expiré détecté au démarrage, nettoyage silencieux');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        isInitialLoad = false;
        return Promise.reject(error);
      }
      
      // Si c'est la première fois, essayer de rafraîchir le token
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        console.log("Tentative de rafraîchissement du token après erreur 401");
        // Essayer de rafraîchir le token
        const result = await authService.refreshToken(true);
        if (result && result.token) {
          const newToken = result.token;
          console.log("Token rafraîchi avec succès");
          
          // Traiter toutes les requêtes en attente avec le nouveau token
          processQueue(null, newToken);
          
          // Mettre à jour le header de la requête originale et la renvoyer
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          isRefreshing = false;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Échec du rafraîchissement:", refreshError);
        // En cas d'échec du rafraîchissement
        processQueue(refreshError, null);
        
        // Nettoyage et redirection uniquement si on n'est pas déjà en train de rediriger
        if (!isRedirecting && !isIntentionalLogout) {
          isRedirecting = true;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          if (window.location.pathname !== '/login') {
            window.location.href = `/login?error=session_expired`;
          }
          
          setTimeout(() => {
            isRedirecting = false;
          }, 3000);
        }
        
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }
    
    // Pour les autres erreurs 401 (échec après tentative de rafraîchissement ou autre route)
    if (error.response && error.response.status === 401 && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirection vers la page de login seulement si on n'y est pas déjà
      if (window.location.pathname !== '/login') {
        // Si la déconnexion est intentionnelle, afficher un message de succès
        // sinon afficher un message d'erreur pour session expirée
        if (isIntentionalLogout) {
          window.location.href = `/login?success=logout`;
        } else {
          window.location.href = `/login?error=session_expired`;
        }
        
        // Réinitialiser le flag de déconnexion intentionnelle
        isIntentionalLogout = false;
      }
      
      // Réinitialiser le flag après un délai
      setTimeout(() => {
        isRedirecting = false;
      }, 3000);
    }
    
    return Promise.reject(error);
  }
);

export default api;