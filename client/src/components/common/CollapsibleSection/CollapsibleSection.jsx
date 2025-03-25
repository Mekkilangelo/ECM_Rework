// src/components/common/CollapsibleSection.jsx
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
  onToggle = null
}) => {
  // État local pour suivre si la section est étendue
  const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);

  // Déterminer l'ID de stockage si rememberState est true
  const storageKey = sectionId ? `collapsible-section-${sectionId}` : null;

  // Initialisation avec l'état mémorisé si disponible
  useEffect(() => {
    if (rememberState && storageKey) {
      const savedState = localStorage.getItem(storageKey);
      if (savedState !== null) {
        setIsExpanded(savedState === 'true');
      }
    }
  }, [rememberState, storageKey]);

  // Gestion du basculement d'état
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    // Sauvegarder l'état si nécessaire
    if (rememberState && storageKey) {
      localStorage.setItem(storageKey, newState);
    }
    
    // Appel de la fonction de callback si fournie
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <Card className={`mb-3 ${className}`}>
      <Card.Header 
        className={`d-flex justify-content-between align-items-center ${headerClassName}`}
        style={{ cursor: 'pointer' }}
        onClick={toggleExpanded}
      >
        <h5 className="mb-0">{title}</h5>
        <Button 
          variant="link" 
          className="p-0 text-decoration-none" 
          onClick={(e) => {
            e.stopPropagation(); // Empêche le double déclenchement par l'événement du Card.Header
            toggleExpanded();
          }}
          aria-label={isExpanded ? 'Réduire la section' : 'Étendre la section'}
        >
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
            className="text-primary" 
          />
        </Button>
      </Card.Header>
      {isExpanded && (
        <Card.Body className={bodyClassName}>
          {children}
        </Card.Body>
      )}
    </Card>
  );
};

export default CollapsibleSection;
