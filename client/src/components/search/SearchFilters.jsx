import React, { useState } from 'react';
import { Row, Col, Form, Tabs, Tab, Card, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faFileAlt, faCogs, faFlask, faIndustry, 
  faCalendarAlt, faFilter, faTag, faMapMarkerAlt, faBoxes, faArrowsAlt
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './SearchFilters.css';

const SearchFilters = ({
  entityTypes,
  advancedFilters,
  availableFilters,
  handleEntityTypeChange,
  handleFilterChange,
  handleDateChange
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('clients');
  
  // Configuration des icônes et couleurs par type d'entité
  const entityConfig = {
    clients: { icon: faUser, color: 'primary' },
    orders: { icon: faFileAlt, color: 'warning' },
    parts: { icon: faCogs, color: 'success' },
    tests: { icon: faFlask, color: 'info' },
    steels: { icon: faIndustry, color: 'secondary' }
  };

  // Style personnalisé pour les composants Select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      border: '1px solid #dee2e6',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #ced4da',
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#dc3545' : state.isFocused ? 'rgba(220, 53, 69, 0.1)' : 'white',
      color: state.isSelected ? 'white' : '#212529',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#dc3545',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#dc3545',
      '&:hover': {
        backgroundColor: '#dc3545',
        color: 'white',
      },
    }),
  };

  // Fonction pour gérer le changement de valeur avec react-select
  const handleSelectChange = (field, options) => {
    const values = options ? options.map(option => option.value) : [];
    handleFilterChange({ target: { name: field, value: values } });
  };

  // Créer les options pour react-select à partir d'un tableau de valeurs
  const createSelectOptions = (values) => {
    return values.map(value => ({ value, label: value }));
  };

  // Fonction pour obtenir les options sélectionnées
  const getSelectedOptions = (field, options) => {
    const values = advancedFilters[field] || [];
    return options.filter(option => values.includes(option.value));
  };

  // Rendu du contenu des onglets par type d'entité
  const renderTabContent = (type) => {
    switch(type) {
      case 'clients':
        return (
          <Row className="mt-3">
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  {t('search.filters.clientName')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="clientName"
                  value={advancedFilters.clientName || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.clientNamePlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.clientCode')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="clientCode"
                  value={advancedFilters.clientCode || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.clientCodePlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                  {t('search.filters.clientLocation')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="clientLocation"
                  value={advancedFilters.clientLocation || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.clientLocationPlaceholder')}
                />
              </Form.Group>
            </Col>
          </Row>
        );

      case 'orders':
        return (
          <Row className="mt-3">
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.orderReference')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="orderReference"
                  value={advancedFilters.orderReference || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.orderReferencePlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  {t('search.filters.orderDateFrom')}
                </Form.Label>
                <DatePicker
                  selected={advancedFilters.orderDateFrom ? new Date(advancedFilters.orderDateFrom) : null}
                  onChange={(date) => handleDateChange('orderDateFrom', date)}
                  className="form-control"
                  placeholderText={t('search.filters.orderDateFromPlaceholder')}
                  dateFormat="dd/MM/yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  {t('search.filters.orderDateTo')}
                </Form.Label>
                <DatePicker
                  selected={advancedFilters.orderDateTo ? new Date(advancedFilters.orderDateTo) : null}
                  onChange={(date) => handleDateChange('orderDateTo', date)}
                  className="form-control"
                  placeholderText={t('search.filters.orderDateToPlaceholder')}
                  dateFormat="dd/MM/yyyy"
                />
              </Form.Group>
            </Col>
          </Row>
        );

      case 'parts':
        return (
          <Row className="mt-3">
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.partDesignation')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="partDesignation"
                  value={advancedFilters.partDesignation || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.partDesignationPlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.partDesignationType')}
                </Form.Label>
                <Select
                  isMulti
                  name="partDesignations"
                  options={createSelectOptions(availableFilters.partDesignations)}
                  value={getSelectedOptions('partDesignations', createSelectOptions(availableFilters.partDesignations))}
                  onChange={(selectedOptions) => handleSelectChange('partDesignations', selectedOptions)}
                  placeholder={t('search.filters.partDesignationTypePlaceholder')}
                  styles={customSelectStyles}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faIndustry} className="me-2" />
                  {t('search.filters.partSteel')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="partSteel"
                  value={advancedFilters.partSteel || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.partSteelPlaceholder')}
                />
              </Form.Group>
            </Col>
          </Row>
        );

      case 'tests':
        return (
          <Row className="mt-3">
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.testCode')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="testCode"
                  value={advancedFilters.testCode || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.testCodePlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faFilter} className="me-2" />
                  {t('search.filters.testStatus')}
                </Form.Label>
                <Select
                  isMulti
                  name="testStatuses"
                  options={createSelectOptions(availableFilters.testStatuses)}
                  value={getSelectedOptions('testStatuses', createSelectOptions(availableFilters.testStatuses))}
                  onChange={(selectedOptions) => handleSelectChange('testStatuses', selectedOptions)}
                  placeholder={t('search.filters.testStatusPlaceholder')}
                  styles={customSelectStyles}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                  {t('search.filters.testLocation')}
                </Form.Label>
                <Select
                  isMulti
                  name="testLocations"
                  options={createSelectOptions(availableFilters.testLocations)}
                  value={getSelectedOptions('testLocations', createSelectOptions(availableFilters.testLocations))}
                  onChange={(selectedOptions) => handleSelectChange('testLocations', selectedOptions)}
                  placeholder={t('search.filters.testLocationPlaceholder')}
                  styles={customSelectStyles}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  {t('search.filters.testDateFrom')}
                </Form.Label>
                <DatePicker
                  selected={advancedFilters.testDateFrom ? new Date(advancedFilters.testDateFrom) : null}
                  onChange={(date) => handleDateChange('testDateFrom', date)}
                  className="form-control"
                  placeholderText={t('search.filters.testDateFromPlaceholder')}
                  dateFormat="dd/MM/yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  {t('search.filters.testDateTo')}
                </Form.Label>
                <DatePicker
                  selected={advancedFilters.testDateTo ? new Date(advancedFilters.testDateTo) : null}
                  onChange={(date) => handleDateChange('testDateTo', date)}
                  className="form-control"
                  placeholderText={t('search.filters.testDateToPlaceholder')}
                  dateFormat="dd/MM/yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faBoxes} className="me-2" />
                  {t('search.filters.mountingType')}
                </Form.Label>
                <Select
                  isMulti
                  name="mountingTypes"
                  options={createSelectOptions(availableFilters.mountingTypes)}
                  value={getSelectedOptions('mountingTypes', createSelectOptions(availableFilters.mountingTypes))}
                  onChange={(selectedOptions) => handleSelectChange('mountingTypes', selectedOptions)}
                  placeholder={t('search.filters.mountingTypePlaceholder')}
                  styles={customSelectStyles}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faArrowsAlt} className="me-2" />
                  {t('search.filters.positionType')}
                </Form.Label>
                <Select
                  isMulti
                  name="positionTypes"
                  options={createSelectOptions(availableFilters.positionTypes)}
                  value={getSelectedOptions('positionTypes', createSelectOptions(availableFilters.positionTypes))}
                  onChange={(selectedOptions) => handleSelectChange('positionTypes', selectedOptions)}
                  placeholder={t('search.filters.positionTypePlaceholder')}
                  styles={customSelectStyles}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faFilter} className="me-2" />
                  {t('search.filters.processType')}
                </Form.Label>
                <Select
                  isMulti
                  name="processTypes"
                  options={createSelectOptions(availableFilters.processTypes)}
                  value={getSelectedOptions('processTypes', createSelectOptions(availableFilters.processTypes))}
                  onChange={(selectedOptions) => handleSelectChange('processTypes', selectedOptions)}
                  placeholder={t('search.filters.processTypePlaceholder')}
                  styles={customSelectStyles}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </Form.Group>
            </Col>
          </Row>
        );

      case 'steels':
        return (
          <Row className="mt-3">
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.steelGrade')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="steelGrade"
                  value={advancedFilters.steelGrade || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.steelGradePlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.steelStandard')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="steelStandard"
                  value={advancedFilters.steelStandard || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.steelStandardPlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.steelFamily')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="steelFamily"
                  value={advancedFilters.steelFamily || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.steelFamilyPlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <FontAwesomeIcon icon={faTag} className="me-2" />
                  {t('search.filters.steelElement')}
                </Form.Label>
                <Form.Control
                  type="text"
                  name="steelElement"
                  value={advancedFilters.steelElement || ''}
                  onChange={handleFilterChange}
                  placeholder={t('search.filters.steelElementPlaceholder')}
                />
              </Form.Group>
            </Col>
          </Row>
        );

      default:
        return null;
    }
  };

  return (
    <div className="advanced-filters-container">
      <Row className="mb-4">
        <Col>
          <Card className="entity-selector-card border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="entity-types-grid">
                {Object.keys(entityConfig).map(type => (
                  <div 
                    key={type}
                    className={`entity-type-item ${entityTypes.includes(type) ? 'active' : ''}`}
                    onClick={() => handleEntityTypeChange(type)}
                  >
                    <div className={`entity-icon bg-${entityConfig[type].color}`}>
                      <FontAwesomeIcon icon={entityConfig[type].icon} />
                    </div>
                    <div className="entity-label">
                      {t(`search.entityTypes.${type}`)}
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="entity-filter-tabs">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="entity-tabs mb-3"
        >
          {Object.keys(entityConfig).filter(type => entityTypes.includes(type)).map(type => (
            <Tab
              key={type}
              eventKey={type}
              title={
                <span className="d-flex align-items-center">
                  <FontAwesomeIcon 
                    icon={entityConfig[type].icon} 
                    className={`me-2 text-${entityConfig[type].color}`} 
                  />
                  {t(`search.entityTypes.${type}`)}
                </span>
              }
            >
              {renderTabContent(type)}
            </Tab>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default SearchFilters;