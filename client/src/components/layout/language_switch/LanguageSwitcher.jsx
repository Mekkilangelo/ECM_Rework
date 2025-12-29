import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fonction pour changer la langue
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng); // i18next stocke automatiquement dans localStorage
    setIsOpen(false); // Ferme le dropdown après sélection
  };
  
  // Gestion du clic en dehors pour fermer le dropdown
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <li className="nav-item dropdown no-arrow mx-1" ref={dropdownRef}>
      <a 
        className="nav-link dropdown-toggle"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        style={{ position: 'relative' }}
      >
        <FontAwesomeIcon icon={faGlobe} />
        <span className="ml-1 d-none d-lg-inline small">
          {i18n.language === 'fr' ? 'FR' : 'EN'}
        </span>
      </a>
      
      {isOpen && (
        <div 
          className="dropdown-menu dropdown-menu-right shadow animated--grow-in show"
          style={{
            position: 'absolute',
            transform: 'none',
            top: '100%',
            left: 'auto',
            willChange: 'transform'
          }}
        >
          <button 
            className={`dropdown-item ${i18n.language === 'fr' ? 'active' : ''}`} 
            onClick={() => changeLanguage('fr')}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <span style={{ marginRight: '8px' }}>🇫🇷</span> Français
          </button>
          <button 
            className={`dropdown-item ${i18n.language === 'en' ? 'active' : ''}`} 
            onClick={() => changeLanguage('en')}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <span style={{ marginRight: '8px' }}>🇬🇧</span> English
          </button>
        </div>
      )}
    </li>
  );
};

export default LanguageSwitcher;