import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form, Card, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWind, faOilCan } from '@fortawesome/free-solid-svg-icons';
import GasQuenchSection from './modules/GasQuenchSection';
import OilQuenchSection from './modules/OilQuenchSection';

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
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
})=> {
  const { t } = useTranslation();
  const [quenchType, setQuenchType] = useState('gas'); // 'gas' ou 'oil'
  
  // Mettre à jour le type de trempe dans les données du formulaire
  useEffect(() => {
    handleChange({
      target: {
        name: 'quenchData.quenchType',
        value: quenchType
      }
    });
  }, [quenchType]);
  
  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (key) => {
    setQuenchType(key);
  };
  
  // Fonction pour rendre les titres d'onglets avec mise en gras pour l'onglet actif
  const renderTabTitle = (title, icon, eventKey) => (
    <span className={quenchType === eventKey ? 'font-weight-bold' : ''}>
      <FontAwesomeIcon icon={icon} className="mr-2" /> {title}
    </span>
  );
  
  return (
    <div className="quench-data-container">
      <Tabs
        activeKey={quenchType}
        onSelect={handleTabChange}
        className="mb-4 mt-2"
        id="quench-type-tabs"
      >
        <Tab
          eventKey="gas"
          title={renderTabTitle(t('trials.before.recipeData.quenchData.gas.title'), faWind, "gas")}
        >
          <div className="fade-in tab-content-container">            <GasQuenchSection
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
              viewMode={viewMode}
              readOnlyFieldStyle={readOnlyFieldStyle}
            />
          </div>
        </Tab>
        <Tab
          eventKey="oil"
          title={renderTabTitle(t('trials.before.recipeData.quenchData.oil.title'), faOilCan, "oil")}
        >
          <div className="fade-in tab-content-container">            <OilQuenchSection
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
              viewMode={viewMode}
              readOnlyFieldStyle={readOnlyFieldStyle}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default QuenchDataSection;
