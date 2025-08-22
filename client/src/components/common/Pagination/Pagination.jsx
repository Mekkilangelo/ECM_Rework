import React from 'react';
import { Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

/**
 * Composant réutilisable pour la pagination
 * 
 * @param {number} currentPage - Page actuelle
 * @param {number} totalPages - Nombre total de pages
 * @param {function} onPageChange - Fonction appelée lors du changement de page
 * @param {string} size - Taille des boutons ('sm', 'md', 'lg') (optionnel)
 * @param {string} variant - Variante de couleur pour les boutons (optionnel)
 * @param {Object} style - Styles CSS additionnels (optionnel)
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  size = 'sm',
  variant = 'danger',
  style = {}
}) => {
  const { t } = useTranslation();

  // Ne rien afficher s'il n'y a qu'une seule page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="d-flex align-items-center" style={style}>
      <Button 
        variant={`outline-${variant}`}
        size={size}
        className="d-flex align-items-center py-1 px-2 shadow-sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label={t('pagination.previous', 'Précédent')}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="me-1" />
        {t('pagination.previous', 'Précédent')}
      </Button>
      
      <Badge 
        bg="light" 
        text="dark" 
        className="border shadow-sm px-3 py-2 d-flex align-items-center mx-2"
      >
        <span>{t('pagination.page', 'Page')}</span>
        <strong className="mx-1">{currentPage}</strong>
        <span>{t('pagination.of', 'sur')}</span>
        <strong className="ms-1">{totalPages}</strong>
      </Badge>
      
      <Button 
        variant={`outline-${variant}`}
        size={size}
        className="d-flex align-items-center py-1 px-2 shadow-sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label={t('pagination.next', 'Suivant')}
      >
        {t('pagination.next', 'Suivant')}
        <FontAwesomeIcon icon={faChevronRight} className="ms-1" />
      </Button>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  size: PropTypes.string,
  variant: PropTypes.string,
  style: PropTypes.object
};

export default Pagination;