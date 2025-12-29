import React from 'react';
import { Form, InputGroup, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import './RangeInput.css';

/**
 * Composant de saisie de fourchette (min/max) avec sélecteur d'unité
 */
const RangeInputWithUnit = ({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  unit,
  onUnitChange,
  unitOptions = [],
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  step = '0.01',
  className = ''
}) => {
  // Détection du thème sombre
  const isDarkTheme = document.documentElement.classList.contains('dark-theme');

  // Couleurs adaptées au thème
  const themeColors = {
    controlBg: isDarkTheme ? '#333333' : 'white',
    controlBorder: isDarkTheme ? '#555555' : '#dee2e6',
    controlBorderFocus: '#dc3545',
    menuBg: isDarkTheme ? '#333333' : 'white',
    optionBg: isDarkTheme ? '#333333' : 'white',
    optionText: isDarkTheme ? '#e0e0e0' : '#212529',
    optionHoverBg: isDarkTheme ? 'rgba(220, 53, 69, 0.2)' : '#f8d7da',
    inputText: isDarkTheme ? '#e0e0e0' : '#212529',
  };

  // Styles personnalisés pour react-select - Compatible dark mode
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: themeColors.controlBg,
      borderColor: state.isFocused ? themeColors.controlBorderFocus : themeColors.controlBorder,
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#dc3545',
      },
      minHeight: '32px',
      height: '32px',
      fontSize: '0.8rem'
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '32px',
      padding: '0 6px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      color: themeColors.inputText
    }),
    singleValue: (provided) => ({
      ...provided,
      color: themeColors.inputText
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '32px',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: themeColors.menuBg,
      zIndex: 9999,
      fontSize: '0.85rem'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#dc3545' : state.isFocused ? themeColors.optionHoverBg : themeColors.optionBg,
      color: state.isSelected ? 'white' : themeColors.optionText,
      '&:active': {
        backgroundColor: '#dc3545',
      }
    })
  };

  return (
    <Form.Group className={`range-input-group ${className}`}>
      {label && <Form.Label className="small font-weight-bold" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>{label}</Form.Label>}
      
      <Row className="g-1">
        {/* Min/Max Inputs */}
        <Col xs={onUnitChange ? 8 : 12}>
          <div className="range-input-container">
            <InputGroup size="sm">
              <InputGroup.Text className="range-input-label">Min</InputGroup.Text>
              <Form.Control
                type="number"
                placeholder={minPlaceholder}
                value={minValue || ''}
                onChange={(e) => onMinChange(e.target.value)}
                step={step}
                className="range-input-field"
              />
            </InputGroup>
            
            <div className="range-separator">—</div>
            
            <InputGroup size="sm">
              <InputGroup.Text className="range-input-label">Max</InputGroup.Text>
              <Form.Control
                type="number"
                placeholder={maxPlaceholder}
                value={maxValue || ''}
                onChange={(e) => onMaxChange(e.target.value)}
                step={step}
                className="range-input-field"
              />
            </InputGroup>
          </div>
        </Col>

        {/* Unit Selector - Utiliser react-select pour cohérence */}
        {onUnitChange && (
          <Col xs={4}>
            <Select
              value={unit ? unitOptions.find(opt => opt.value === unit) : null}
              onChange={(option) => onUnitChange(option?.value || '')}
              options={unitOptions}
              placeholder="..."
              isClearable={false}
              isSearchable={false}
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              noOptionsMessage={() => 'Chargement...'}
            />
          </Col>
        )}
      </Row>
    </Form.Group>
  );
};

export default RangeInputWithUnit;
