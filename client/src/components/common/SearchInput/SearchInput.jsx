import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './SearchInput.css';

const SearchInput = ({ 
  onSearch, 
  onClear, 
  placeholder, 
  initialValue = '', 
  debounceMs = 300,
  className = '',
  size = 'md'
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Débounce de la recherche pour éviter trop d'appels API
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceMs);

    setDebounceTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [searchTerm, debounceMs, onSearch]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    if (onClear) {
      onClear();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <Form onSubmit={handleSubmit} className={`search-input-form ${className}`}>
      <InputGroup size={size} className="search-input-group">
        <InputGroup.Text className="search-icon">
          <FontAwesomeIcon icon={faSearch} />
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder={placeholder || t('common.search')}
          value={searchTerm}
          onChange={handleInputChange}
          className="search-input"
        />
        {searchTerm && (
          <Button 
            variant="outline-secondary" 
            className="clear-button"
            onClick={handleClear}
            type="button"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        )}
      </InputGroup>
    </Form>
  );
};

SearchInput.propTypes = {
  onSearch: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  placeholder: PropTypes.string,
  initialValue: PropTypes.string,
  debounceMs: PropTypes.number,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default SearchInput;
