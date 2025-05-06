import React, { createContext, useState, useEffect } from 'react';

// Création du contexte
export const ThemeContext = createContext();

// Composant fournisseur du thème
export const ThemeProvider = ({ children }) => {
  // État pour suivre si le thème est sombre ou clair
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Au chargement, vérifier si l'utilisateur a déjà défini une préférence
  useEffect(() => {
    const savedTheme = localStorage.getItem('dark-theme');
    
    // Si une préférence existe, l'utiliser
    if (savedTheme !== null) {
      setIsDarkTheme(savedTheme === 'true');
    } else {
      // Sinon, vérifier les préférences du système
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(prefersDark);
    }
  }, []);

  // Quand l'état du thème change, mettre à jour la classe sur l'élément html
  useEffect(() => {
    // Sauvegarder la préférence
    localStorage.setItem('dark-theme', isDarkTheme);
    
    // Ajouter ou supprimer la classe dark-theme sur l'élément html
    if (isDarkTheme) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  // Fonction pour basculer le thème
  const toggleTheme = () => {
    setIsDarkTheme(prevTheme => !prevTheme);
  };

  // Valeurs exposées via le contexte
  const value = {
    isDarkTheme,
    toggleTheme
  };

  // Fournir le contexte à l'arbre des composants
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte du thème
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  return context;
};