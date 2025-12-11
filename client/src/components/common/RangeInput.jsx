import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import './RangeInput.css';

/**
 * Composant de saisie de fourchette (min/max)
 * UX-friendly pour filtrer par plage de valeurs - Version compacte optimisée
 */
const RangeInput = ({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  unit = '',
  step = '0.01',
  className = '',
  compact = false
}) => {
  return (
    <Form.Group className={`range-input-group ${className} ${compact ? 'compact' : ''}`}>
      {label && <Form.Label className="small font-weight-bold" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>{label}</Form.Label>}
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
          {unit && <InputGroup.Text className="range-input-unit">{unit}</InputGroup.Text>}
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
          {unit && <InputGroup.Text className="range-input-unit">{unit}</InputGroup.Text>}
        </InputGroup>
      </div>
    </Form.Group>
  );
};

export default RangeInput;
