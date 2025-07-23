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
  className = '',
  size = 'md'
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Synchroniser avec la valeur initiale quand elle change
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

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

  const handleSearchClick = () => {
    onSearch(searchTerm);
  };

  return (
    <Form onSubmit={handleSubmit} className={`search-input-form ${className}`}>
      <InputGroup size={size} className="search-input-group">
        <Button 
          variant="outline-secondary" 
          className="search-button"
          onClick={handleSearchClick}
          type="button"
        >
          <FontAwesomeIcon icon={faSearch} />
        </Button>
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
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default SearchInput;
