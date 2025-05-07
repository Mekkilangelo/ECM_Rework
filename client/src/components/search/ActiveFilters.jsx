import React from 'react';
import { Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import './ActiveFilters.css';

const ActiveFilters = ({ activeFilters, clearFilter, resetFilters }) => {
  const { t } = useTranslation();

  if (!activeFilters || Object.keys(activeFilters).length === 0) {
    return null;
  }

  const formatDateValue = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderFilterBadges = () => {
    const filterBadges = [];
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return; // Ignorer les filtres vides
      }
      
      let label;
      let displayValue = value;
      
      // Format pour les dates
      if (key.toLowerCase().includes('date') && value) {
        displayValue = formatDateValue(value);
      }
      
      // Format pour les tableaux
      if (Array.isArray(value)) {
        displayValue = value.join(', ');
      }
      
      switch(key) {
        case 'clientGroup': label = `${t('search.filters.clientGroup')}: ${displayValue}`; break;
        case 'country': label = `${t('search.filters.country')}: ${displayValue}`; break;
        case 'city': label = `${t('search.filters.city')}: ${displayValue}`; break;
        case 'clientName': label = `${t('search.filters.clientName')}: ${displayValue}`; break;
        case 'clientCode': label = `${t('search.filters.clientCode')}: ${displayValue}`; break;
        case 'clientLocation': label = `${t('search.filters.clientLocation')}: ${displayValue}`; break;
        
        case 'orderDate': label = `${t('search.filters.orderDate')}: ${displayValue}`; break;
        case 'orderDateFrom': label = `${t('search.filters.orderDateFrom')}: ${displayValue}`; break;
        case 'orderDateTo': label = `${t('search.filters.orderDateTo')}: ${displayValue}`; break;
        case 'orderReference': label = `${t('search.filters.orderReference')}: ${displayValue}`; break;
        case 'commercial': label = `${t('search.filters.commercial')}: ${displayValue}`; break;
        
        case 'partDesignation': label = `${t('search.filters.partDesignation')}: ${displayValue}`; break;
        case 'partDesignations': label = `${t('search.filters.partDesignationType')}: ${displayValue}`; break;
        case 'partSteel': label = `${t('search.filters.partSteel')}: ${displayValue}`; break;
        case 'steelType': label = `${t('search.filters.steelType')}: ${displayValue}`; break;
        case 'minQuantity': label = `${t('search.filters.minQuantity')}: ${displayValue}`; break;
        case 'maxQuantity': label = `${t('search.filters.maxQuantity')}: ${displayValue}`; break;
        
        case 'testCode': label = `${t('search.filters.testCode')}: ${displayValue}`; break;
        case 'testStatus': label = `${t('search.filters.testStatus')}: ${displayValue}`; break;
        case 'testStatuses': label = `${t('search.filters.testStatus')}: ${displayValue}`; break;
        case 'testLocation': label = `${t('search.filters.testLocation')}: ${displayValue}`; break;
        case 'testLocations': label = `${t('search.filters.testLocation')}: ${displayValue}`; break;
        case 'mountingType': label = `${t('search.filters.mountingType')}: ${displayValue}`; break;
        case 'mountingTypes': label = `${t('search.filters.mountingType')}: ${displayValue}`; break;
        case 'processType': label = `${t('search.filters.processType')}: ${displayValue}`; break;
        case 'processTypes': label = `${t('search.filters.processType')}: ${displayValue}`; break;
        case 'positionType': label = `${t('search.filters.positionType')}: ${displayValue}`; break;
        case 'positionTypes': label = `${t('search.filters.positionType')}: ${displayValue}`; break;
        case 'testDateFrom': label = `${t('search.filters.testDateFrom')}: ${displayValue}`; break;
        case 'testDateTo': label = `${t('search.filters.testDateTo')}: ${displayValue}`; break;
        
        case 'steelGrade': label = `${t('search.filters.steelGrade')}: ${displayValue}`; break;
        case 'steelElement': label = `${t('search.filters.steelElement')}: ${displayValue}`; break;
        case 'steelFamily': label = `${t('search.filters.steelFamily')}: ${displayValue}`; break;
        case 'steelStandard': label = `${t('search.filters.steelStandard')}: ${displayValue}`; break;
        
        default: label = `${key}: ${displayValue}`;
      }
      
      filterBadges.push(
        <div key={key} className="active-filter-item">
          {label}
          <span 
            className="filter-remove" 
            onClick={() => clearFilter(key)}
            title={t('search.removeFilter')}
          >
            <FontAwesomeIcon icon={faTimes} />
          </span>
        </div>
      );
    });
    
    return filterBadges;
  };

  return (
    <div className="active-filters">
      <div className="active-filters-header">
        <span className="active-filters-title">
          <FontAwesomeIcon icon={faFilter} className="me-2" />
          {t('search.activeFilters')}
        </span>
        {Object.keys(activeFilters).length > 0 && (
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={resetFilters}
            className="reset-filters-btn"
          >
            <FontAwesomeIcon icon={faTimes} className="me-1" />
            {t('search.clearAllFilters')}
          </Button>
        )}
      </div>
      <div className="active-filters-content">
        {renderFilterBadges()}
      </div>
    </div>
  );
};

export default ActiveFilters;