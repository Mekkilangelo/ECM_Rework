import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './CollapsibleSection.css';

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

  return (
    <Card
      className={`collapsible-section level-${safeLevel} ${isExpanded ? 'expanded' : ''} ${className}`}
    >
      <div
        className={`collapsible-header ${isExpanded ? 'expanded' : 'collapsed'} ${headerClassName}`}
        onClick={toggleExpanded}
      >
        <div className={`collapsible-title ${isExpanded ? 'expanded' : 'collapsed'}`}>
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
            className={`collapsible-icon ${isExpanded ? 'expanded' : 'collapsed'}`}
          />
        </Button>
      </div>
      {isExpanded && (
        <Card.Body className={`collapsible-body ${bodyClassName}`}>
          {children}
        </Card.Body>
      )}
    </Card>
  );
};

export default CollapsibleSection;
