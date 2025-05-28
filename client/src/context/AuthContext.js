import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import { setInitialLoadComplete } from '../services/api';

// Création du contexte
export const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = authService.getToken();
        
        // Si aucun token n'est présent ou malformé, terminer le chargement immédiatement
        if (!token) {
          console.log('Aucun token valide trouvé au démarrage');
          setLoading(false);
          // Indiquer que le chargement initial est terminé
          setInitialLoadComplete();
          return;
        }
        
        const storedUser = authService.getUser();
        
        // Vérifier que l'utilisateur a été correctement récupéré
        if (!storedUser) {
          console.log('Données utilisateur invalides, nettoyage');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
          setInitialLoadComplete();
          return;
        }
        
        // Démarrer le suivi d'activité uniquement si un token est présent
        authService.setupActivityTracking();
        
        try {
          // Récupérer les informations utilisateur depuis l'API
          await authService.refreshToken();
          setUser(storedUser);
          setIsAuthenticated(true);
        } catch (refreshError) {
          console.error('Erreur de rafraîchissement du token au démarrage:', refreshError.message);
          
          // Nettoyage des données d'authentification
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        // Indiquer que le chargement initial est terminé
        setInitialLoadComplete();
      }
    };

    checkAuthStatus();
  }, []);

  // Fonction de connexion
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    
    // Démarrer le suivi d'activité lors de la connexion
    authService.setupActivityTracking();
  };

  // Fonction de déconnexion
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
