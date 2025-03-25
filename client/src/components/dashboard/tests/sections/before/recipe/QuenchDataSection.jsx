import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWind, faOilCan } from '@fortawesome/free-solid-svg-icons';
import GasQuenchSection from './quench/GasQuenchSection';
import OilQuenchSection from './quench/OilQuenchSection';
import './QuenchDataSection.css';

const QuenchDataSection = ({ 
  formData, 
  handleChange, 
  handleSelectChange, 
  getSelectedOption, 
  temperatureUnitOptions, 
  timeUnitOptions, 
  pressureUnitOptions,
  handleGasQuenchSpeedAdd,
  handleGasQuenchSpeedRemove,
  handleGasQuenchPressureAdd,
  handleGasQuenchPressureRemove,
  handleOilQuenchSpeedAdd,
  handleOilQuenchSpeedRemove,
  loading, 
  selectStyles 
}) => {
  const [quenchType, setQuenchType] = useState('gas'); // 'gas' or 'oil'
  
  // Update quench type in the form data
  useEffect(() => {
    handleChange({
      target: {
        name: 'quenchData.quenchType',
        value: quenchType
      }
    });
  }, [quenchType]);

  const handleToggleChange = (event) => {
    setQuenchType(event.target.checked ? 'oil' : 'gas');
  };

  return (
    <>
      <div className="quench-toggle-container">
        <span className={`toggle-label ${quenchType === 'gas' ? 'active' : ''}`}>
          <FontAwesomeIcon icon={faWind} className="mr-2" />
          Gaz
        </span>
        
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={quenchType === 'oil'}
            onChange={handleToggleChange}
          />
          <span className="toggle-slider"></span>
        </label>
        
        <span className={`toggle-label ${quenchType === 'oil' ? 'active' : ''}`}>
          <FontAwesomeIcon icon={faOilCan} className="mr-2" />
          Huile
        </span>
      </div>
      <div className="quench-content-container">
        {quenchType === 'gas' ? (
          <div className="fade-in">
            <GasQuenchSection
              formData={formData}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              getSelectedOption={getSelectedOption}
              handleGasQuenchSpeedAdd={handleGasQuenchSpeedAdd}
              handleGasQuenchSpeedRemove={handleGasQuenchSpeedRemove}
              handleGasQuenchPressureAdd={handleGasQuenchPressureAdd}
              handleGasQuenchPressureRemove={handleGasQuenchPressureRemove}
              loading={loading}
              selectStyles={selectStyles}
            />
          </div>
        ) : (
          <div className="fade-in">
            <OilQuenchSection
              formData={formData}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              getSelectedOption={getSelectedOption}
              temperatureUnitOptions={temperatureUnitOptions}
              timeUnitOptions={timeUnitOptions}
              handleOilQuenchSpeedAdd={handleOilQuenchSpeedAdd}
              handleOilQuenchSpeedRemove={handleOilQuenchSpeedRemove}
              loading={loading}
              selectStyles={selectStyles}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default QuenchDataSection;
