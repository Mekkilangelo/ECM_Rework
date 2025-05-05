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

    // Couleur danger de Bootstrap pour le niveau 0 (rouge de base)
    const dangerRed = '#dc3545';
    
    // Variations selon le niveau
    const levelVariations = [
      { // Niveau 0 - Principal
        card: {
          ...baseCardStyle,
          borderColor: dangerRed,
          boxShadow: isExpanded ? '0 2px 4px rgba(220,53,69,0.2)' : 'none'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? dangerRed : '#ffffff',
          borderBottom: isExpanded ? `1px solid ${dangerRed}` : 'none',
          padding: '0.9rem 1.2rem'
        },
        body: {
          padding: '1.2rem',
          backgroundColor: isExpanded ? '#fff8f8' : '#ffffff',
        },
        title: {
          fontSize: '1.1rem',
          fontWeight: '600',
          color: isExpanded ? '#ffffff' : dangerRed
        }
      },
      { // Niveau 1
        card: {
          ...baseCardStyle,
          borderColor: '#e35d6a',
          marginLeft: '0.25rem'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? '#e35d6a' : '#ffffff',
          borderBottom: isExpanded ? '1px solid #e35d6a' : 'none',
          padding: '0.8rem 1.1rem'
        },
        body: {
          padding: '1.1rem',
          backgroundColor: isExpanded ? '#fff9f9' : '#ffffff',
        },
        title: {
          fontSize: '1rem',
          fontWeight: '500',
          color: isExpanded ? '#ffffff' : '#e35d6a'
        }
      },
      { // Niveau 2
        card: {
          ...baseCardStyle,
          borderColor: '#ea858f',
          marginLeft: '0.5rem'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? '#ea858f' : '#ffffff',
          borderBottom: isExpanded ? '1px solid #ea858f' : 'none',
          padding: '0.7rem 1rem'
        },
        body: {
          padding: '1rem',
          backgroundColor: isExpanded ? '#fffafa' : '#ffffff',
        },
        title: {
          fontSize: '0.95rem',
          fontWeight: '500',
          color: isExpanded ? '#ffffff' : '#ea858f'
        }
      },
      { // Niveau 3
        card: {
          ...baseCardStyle,
          borderColor: '#f1adb4',
          marginLeft: '0.75rem'
        },
        header: {
          ...baseHeaderStyle,
          backgroundColor: isExpanded ? '#f1adb4' : '#ffffff',
          borderBottom: isExpanded ? '1px solid #f1adb4' : 'none',
          padding: '0.6rem 0.9rem'
        },
        body: {
          padding: '0.9rem',
          backgroundColor: isExpanded ? '#fffbfb' : '#ffffff',
        },
        title: {
          fontSize: '0.9rem',
          fontWeight: '500',
          color: isExpanded ? '#ffffff' : '#f1adb4'
        }
      }
    ];

    return levelVariations[safeLevel];
  };

  const styles = getStyles();

  // Styles spécifiques pour l'icône
  const iconStyle = {
    color: isExpanded ? '#ffffff' : '#dc3545',
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
