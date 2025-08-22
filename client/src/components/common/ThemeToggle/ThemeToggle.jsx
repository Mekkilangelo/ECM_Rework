import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoon, 
  faSun,  // Étoile qui peut représenter le soleil
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../../context/ThemeContext';
import '../../../styles/darkTheme.css';

/**
 * Composant bouton pour basculer entre le mode clair et sombre
 */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark-theme'));
  
  // Surveiller les changements de classe sur l'élément html
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark-theme'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Synchroniser l'état local avec l'état du thème du contexte
  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
    </button>
  );
};

export default ThemeToggle;