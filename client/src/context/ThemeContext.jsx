import React, { createContext, useState, useContext, useEffect } from 'react';

// Création du contexte
export const ThemeContext = createContext();

// Hook personnalisé pour utiliser le contexte de thème
export const useTheme = () => useContext(ThemeContext);

// Provider du contexte de thème
export const ThemeProvider = ({ children }) => {
  // Récupérer la préférence utilisateur du localStorage
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    // Si une préférence est enregistrée, l'utiliser
    if (savedTheme) {
      return savedTheme;
    }
    // Sinon, détecter la préférence du système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    // Par défaut, utiliser le thème clair
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Mettre à jour le DOM quand le thème change
  useEffect(() => {
    // Mettre à jour la classe sur l'élément root pour activer les styles CSS
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    
    // Sauvegarder la préférence dans localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};