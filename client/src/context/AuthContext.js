import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import { setInitialLoadComplete } from '../services/api';

// Création du contexte
export const AuthContext = createContext();

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
        
        // Si aucun token n'est présent, terminer le chargement immédiatement
        if (!token) {
          setLoading(false);
          // Indiquer que le chargement initial est terminé
          setInitialLoadComplete();
          return;
        }
        
        const storedUser = authService.getUser();
        
        // Démarrer le suivi d'activité uniquement si un token est présent
        authService.setupActivityTracking();
        
        // Essayer de rafraîchir le token silencieusement
        try {
          await authService.refreshToken(true);
          setUser(storedUser);
          setIsAuthenticated(true);
        } catch (refreshError) {
          console.log('Le token a expiré ou est invalide');
          // Nettoyage silencieux des données d'authentification
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
        // Déconnexion silencieuse en cas d'erreur
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
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      loading,
      login, 
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};