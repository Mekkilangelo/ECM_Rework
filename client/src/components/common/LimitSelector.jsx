import React, { useEffect, useState } from 'react';
import { Form, Badge, Dropdown, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/**
 * Composant réutilisable moderne pour la sélection du nombre d'éléments par page
 * 
 * @param {number} itemsPerPage - Nombre actuel d'éléments par page
 * @param {function} onLimitChange - Fonction appelée lors du changement de limite
 * @param {number} totalItems - Nombre total d'éléments (optionnel)
 * @param {Array} options - Options de limite à afficher (optionnel)
 * @param {string} variant - Variante de couleur ('primary', 'secondary', 'danger', etc.) (optionnel)
 * @param {string} size - Taille du composant ('sm', 'md', 'lg') (optionnel)
 * @param {Object} style - Styles CSS additionnels (optionnel)
 * @param {function} refreshTotal - Fonction pour rafraîchir le total (optionnel)
 */
const LimitSelector = ({ 
  itemsPerPage, 
  onLimitChange, 
  totalItems = null, 
  options = [10, 25, 50, 100],
  variant = 'danger',
  size = 'sm',
  style = {},
  refreshTotal = null
}) => {
  const { t } = useTranslation();
  const [displayTotal, setDisplayTotal] = useState(totalItems);

  // Mettre à jour le total affiché lorsque totalItems change
  useEffect(() => {
    setDisplayTotal(totalItems);
  }, [totalItems]);

  // Force un rafraîchissement du total si une fonction refreshTotal est fournie
  useEffect(() => {
    if (refreshTotal) {
      const interval = setInterval(() => {
        refreshTotal();
      }, 5000); // Rafraîchir toutes les 5 secondes
      
      return () => clearInterval(interval);
    }
  }, [refreshTotal]);

  const handleSelect = (value) => {
    const newLimit = parseInt(value, 10);
    onLimitChange(newLimit);
  };

  return (
    <div className="d-flex flex-column" style={{ ...style }}>
      <div className="d-flex align-items-center">
        <span className="me-4 text-secondary small">
          {t('pagination.itemsPerPage', 'Éléments par page')}:
        </span>
        
        <Dropdown as={ButtonGroup} onSelect={handleSelect} size={size}>
          <Dropdown.Toggle 
            variant={`outline-${variant}`} 
            id="dropdown-limit" 
            size={size} 
            className="d-flex align-items-center shadow-sm ml-2"
          >
            {itemsPerPage} <FontAwesomeIcon className="ms-2" size="xs" />
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow-sm">
            {options.map(option => (
              <Dropdown.Item key={option} eventKey={option} active={option === itemsPerPage}>
                {option}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {displayTotal !== null && (
        <Badge 
          bg={variant}
          text="white" 
          className="mt-2 shadow-sm d-flex align-items-center py-2 px-3 align-self-start" 
          pill
          style={{ fontWeight: '500', fontSize: '0.85em' }}
        >
          <span className="me-1">{t('pagination.total', 'Total')}:</span>
          <span className="fw-bold ms-1">{displayTotal}</span>
        </Badge>
      )}
    </div>
  );
};

LimitSelector.propTypes = {
  itemsPerPage: PropTypes.number.isRequired,
  onLimitChange: PropTypes.func.isRequired,
  totalItems: PropTypes.number,
  options: PropTypes.arrayOf(PropTypes.number),
  variant: PropTypes.string,
  size: PropTypes.string,
  style: PropTypes.object,
  refreshTotal: PropTypes.func
};

export default LimitSelector;