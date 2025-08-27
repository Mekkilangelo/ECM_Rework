import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined!');
}

// Création d'une instance Axios avec l'URL de base
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 secondes de timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Flag pour gérer la déconnexion et éviter les redirections multiples
let isRedirecting = false;
let isIntentionalLogout = false;
let isInitialLoad = true; // Flag pour le chargement initial

// Fonction pour définir la déconnexion comme intentionnelle
export const setIntentionalLogout = (value) => {
  isIntentionalLogout = value;
};

// Fonction pour indiquer que le chargement initial est terminé
export const setInitialLoadComplete = () => {
  isInitialLoad = false;
};

// Intercepteur pour ajouter automatiquement le token aux requêtes
api.interceptors.request.use(
  (config) => {
    try {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du token à la requête:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Ne pas traiter les erreurs pendant le chargement initial ou si logout intentionnel
    if (isInitialLoad || isIntentionalLogout) {
      return Promise.reject(error);
    }
    
    // Si erreur 401 et pas de retry déjà effectué
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tenter de rafraîchir le token
        const result = await authService.refreshToken();
        if (result?.token) {
          originalRequest.headers['Authorization'] = `Bearer ${result.token}`;
          return api(originalRequest);
        }
        
        // Si le rafraîchissement n'a pas retourné de token mais n'a pas lancé d'erreur
        // (cas de session naturellement expirée)
        if (!isRedirecting) {
          isRedirecting = true;
          authService.handleSessionExpired();
          setTimeout(() => {
            isRedirecting = false;
          }, 3000);
        }
        return Promise.reject(error);
      } catch (refreshError) {
        // Si le rafraîchissement échoue et qu'on n'est pas déjà en train de rediriger
        if (!isRedirecting) {
          isRedirecting = true;
          authService.handleSessionExpired();
          setTimeout(() => {
            isRedirecting = false;
          }, 3000);
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Pour les autres erreurs 401
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      authService.handleSessionExpired();
      setTimeout(() => {
        isRedirecting = false;
      }, 3000);
    }
    
    return Promise.reject(error);
  }
);

export default api;
