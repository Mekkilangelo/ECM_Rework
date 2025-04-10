import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

/**
 * Composant de section réductible/extensible réutilisable dans toute l'application
 * @param {string} title - Le titre de la section
 * @param {boolean} isExpandedByDefault - Si la section est ouverte par défaut
 * @param {React.ReactNode} children - Le contenu de la section
 * @param {string} className - Classes CSS additionnelles pour le composant Card
 * @param {string} headerClassName - Classes CSS additionnelles pour le Card.Header
 * @param {string} bodyClassName - Classes CSS additionnelles pour le Card.Body
 * @param {object} sectionId - Identifiant unique de la section (pour le stockage mémoire)
 * @param {boolean} rememberState - Si l'état ouvert/fermé doit être mémorisé
 * @param {function} onToggle - Fonction appelée lors du changement d'état (ouvert/fermé)
 * @param {number} level - Niveau d'imbrication (0, 1, 2, 3) pour la stylisation automatique
 */
const CollapsibleSection = ({ 
  title, 
  isExpandedByDefault = false, 
  children, 
  className = '',
  headerClassName = '',
  bodyClassName = '',
  sectionId = null,
  rememberState = false,
  onToggle = null,
  level = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);
  const storageKey = sectionId ? `collapsible-section-${sectionId}` : null;

  useEffect(() => {
    if (rememberState && storageKey) {
      const savedState = localStorage.getItem(storageKey);
      if (savedState !== null) {
        setIsExpanded(savedState === 'true');
      }
    }
  }, [rememberState, storageKey]);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    if (rememberState && storageKey) {
      localStorage.setItem(storageKey, newState);
    }
    
    if (onToggle) {
      onToggle(newState);
    }
  };

  // Limiter le niveau entre 0 et 3
  const safeLevel = Math.min(Math.max(level, 0), 3);
  
  // Définir le style en fonction du niveau et de l'état
  const getStyles = () => {
    // Styles de base communs
    const baseCardStyle = {
      transition: 'all 0.2s ease',
      marginBottom: '0.75rem',
      border: '1px solid',
    };

    const baseHeaderStyle = {
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background-color 0.2s ease'
    };

    // Variations selon le niveau
    const levelVariations = [
      { // Niveau 0 - Principal
        card: {
          ...baseCardStyle,
          borderColor: isExpanded ? '#d1d9e6' : '#e9ecef',
          boxShadow: isExpanded ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? '#f8f9fa' : '#ffffff',
          borderBottom: isExpanded ? '1px solid #ced4da' : 'none',
          padding: '0.9rem 1.2rem'
        },
        body: {
          padding: '1.2rem'
        },
        title: {
          fontSize: '1.1rem',
          fontWeight: '600',
          color: isExpanded ? '#495057' : '#6c757d'
        }
      },
      { // Niveau 1
        card: {
          ...baseCardStyle,
          borderColor: isExpanded ? '#d8dee9' : '#e9ecef',
          marginLeft: '0.25rem'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? '#f5f6f8' : '#fafafa',
          borderBottom: isExpanded ? '1px solid #e4e7ed' : 'none',
          padding: '0.8rem 1.1rem'
        },
        body: {
          padding: '1.1rem'
        },
        title: {
          fontSize: '1rem',
          fontWeight: '500',
          color: isExpanded ? '#495057' : '#6c757d'
        }
      },
      { // Niveau 2
        card: {
          ...baseCardStyle,
          borderColor: isExpanded ? '#dee2e6' : '#efefef',
          marginLeft: '0.5rem'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? '#f2f4f6' : '#f8f8f8',
          borderBottom: isExpanded ? '1px solid #e2e6ea' : 'none',
          padding: '0.7rem 1rem'
        },
        body: {
          padding: '1rem'
        },
        title: {
          fontSize: '0.95rem',
          fontWeight: '500',
          color: isExpanded ? '#495057' : '#6c757d'
        }
      },
      { // Niveau 3
        card: {
          ...baseCardStyle,
          borderColor: isExpanded ? '#e2e6ea' : '#efefef',
          marginLeft: '0.75rem'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? '#f0f2f4' : '#f6f6f6',
          borderBottom: isExpanded ? '1px solid #dde2e6' : 'none',
          padding: '0.6rem 0.9rem'
        },
        body: {
          padding: '0.9rem'
        },
        title: {
          fontSize: '0.9rem',
          fontWeight: '500',
          color: isExpanded ? '#495057' : '#6c757d'
        }
      }
    ];

    return levelVariations[safeLevel];
  };

  const styles = getStyles();

  // Styles spécifiques pour l'icône
  const iconStyle = {
    color: isExpanded ? '#4a89dc' : '#adb5bd',
    transition: 'color 0.2s ease, transform 0.2s ease',
    transform: isExpanded ? 'scale(1.1)' : 'scale(1)'
  };

  return (
    <Card 
      className={`${className}`}
      style={styles.card}
    >
      <div 
        className={`${headerClassName}`}
        style={styles.header}
        onClick={toggleExpanded}
      >
        <div style={styles.title}>
          {title}
        </div>
        <Button 
          variant="link" 
          className="p-0 text-decoration-none" 
          onClick={(e) => {
            e.stopPropagation();
            toggleExpanded();
          }}
          aria-label={isExpanded ? 'Réduire la section' : 'Étendre la section'}
        >
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
            style={iconStyle}
          />
        </Button>
      </div>
      {isExpanded && (
        <Card.Body className={bodyClassName} style={styles.body}>
          {children}
        </Card.Body>
      )}
    </Card>
  );
};

export default CollapsibleSection;
