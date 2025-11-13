import { useState } from 'react';
import { Row, Col, Form, Button, Accordion, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faCogs, faIndustry, faFlask, faFire,
  faCalendarAlt, faMapMarkerAlt, faBoxes, faArrowsAlt,
  faFilter, faRotateLeft, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './TrialFilters.css';

const TrialFilters = ({ filters, filterOptions, onChange, onApply, onReset }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(filters);

  // Styles personnalisés pour react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#dc3545' : '#dee2e6',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' : 'none',
      '&:hover': {
        borderColor: '#dc3545'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#dc3545' : state.isFocused ? 'rgba(220, 53, 69, 0.1)' : 'white',
      color: state.isSelected ? 'white' : '#212529'
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 99999
    })
  };

  // Gestion du changement de filtre
  const handleChange = (name, value) => {
    const newFilters = { ...localFilters, [name]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  // Réinitialisation locale
  const handleLocalReset = () => {
    setLocalFilters({});
    onReset();
  };

  // Compter les filtres actifs par catégorie
  const countActiveFilters = (category) => {
    const categoryFilters = {
      trial: ['trialCode', 'loadNumber', 'status', 'location', 'mountingType', 'positionType', 'processType', 'trialDateFrom', 'trialDateTo'],
      client: ['clientName', 'clientCode', 'clientCountry', 'clientCity', 'clientGroup'],
      part: ['partName', 'partDesignation', 'partReference', 'partClientDesignation'],
      steel: ['steelGrade', 'steelFamily', 'steelStandard'],
      furnace: ['furnaceType', 'furnaceSize', 'heatingCell', 'coolingMedia', 'quenchCell'],
      recipe: ['recipeNumber']
    };

    return categoryFilters[category]?.filter(key => localFilters[key] && localFilters[key] !== '').length || 0;
  };

  // Créer les options pour react-select
  const createOptions = (values = []) => {
    return values.map(value => ({ value, label: value }));
  };

  // Valeurs sécurisées avec fallback
  const safeFilterOptions = {
    statuses: filterOptions.statuses || [],
    locations: filterOptions.locations || [],
    mountingTypes: filterOptions.mountingTypes || [],
    positionTypes: filterOptions.positionTypes || [],
    processTypes: filterOptions.processTypes || [],
    designations: filterOptions.designations || [],
    furnaceTypes: filterOptions.furnaceTypes || [],
    coolingMedias: filterOptions.coolingMedias || [],
    steelFamilies: filterOptions.steelFamilies || [],
    steelStandards: filterOptions.steelStandards || [],
    clientNames: filterOptions.clientNames || [],
    clientCodes: filterOptions.clientCodes || [],
    clientCountries: filterOptions.clientCountries || [],
    clientCities: filterOptions.clientCities || [],
    clientGroups: filterOptions.clientGroups || []
  };

  return (
    <div className="trial-filters">
      <Accordion defaultActiveKey={['0']} alwaysOpen>
        {/* Filtres sur l'essai */}
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <FontAwesomeIcon icon={faFlask} className="me-2 text-info" />
            <strong>{t('trialFilters.trialInfo', 'Informations Essai')}</strong>
            {countActiveFilters('trial') > 0 && (
              <Badge bg="danger" pill className="ms-2">{countActiveFilters('trial')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faFilter} className="me-1" />
                    {t('trialFilters.trialCode', 'Code Essai')}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.trialCodePlaceholder', 'Ex: T-2024-001')}
                    value={localFilters.trialCode || ''}
                    onChange={(e) => handleChange('trialCode', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faBoxes} className="me-1" />
                    {t('trialFilters.loadNumber', 'Numéro de Charge')}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.loadNumberPlaceholder', 'Ex: LOAD-123')}
                    value={localFilters.loadNumber || ''}
                    onChange={(e) => handleChange('loadNumber', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faFilter} className="me-1" />
                    {t('trialFilters.status', 'Statut')}
                  </Form.Label>
                  <Select
                    options={createOptions(filterOptions.statuses)}
                    value={localFilters.status ? { value: localFilters.status, label: localFilters.status } : null}
                    onChange={(option) => handleChange('status', option?.value || '')}
                    placeholder={t('trialFilters.statusPlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                    {t('trialFilters.location', 'Localisation')}
                  </Form.Label>
                  <Select
                    options={createOptions(filterOptions.locations)}
                    value={localFilters.location ? { value: localFilters.location, label: localFilters.location } : null}
                    onChange={(option) => handleChange('location', option?.value || '')}
                    placeholder={t('trialFilters.locationPlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faBoxes} className="me-1" />
                    {t('trialFilters.mountingType', 'Type de Montage')}
                  </Form.Label>
                  <Select
                    options={createOptions(filterOptions.mountingTypes)}
                    value={localFilters.mountingType ? { value: localFilters.mountingType, label: localFilters.mountingType } : null}
                    onChange={(option) => handleChange('mountingType', option?.value || '')}
                    placeholder={t('trialFilters.mountingTypePlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faArrowsAlt} className="me-1" />
                    {t('trialFilters.positionType', 'Type de Position')}
                  </Form.Label>
                  <Select
                    options={createOptions(filterOptions.positionTypes)}
                    value={localFilters.positionType ? { value: localFilters.positionType, label: localFilters.positionType } : null}
                    onChange={(option) => handleChange('positionType', option?.value || '')}
                    placeholder={t('trialFilters.positionTypePlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faFilter} className="me-1" />
                    {t('trialFilters.processType', 'Type de Processus')}
                  </Form.Label>
                  <Select
                    options={createOptions(filterOptions.processTypes)}
                    value={localFilters.processType ? { value: localFilters.processType, label: localFilters.processType } : null}
                    onChange={(option) => handleChange('processType', option?.value || '')}
                    placeholder={t('trialFilters.processTypePlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                    {t('trialFilters.dateFrom', 'Date Début')}
                  </Form.Label>
                  <DatePicker
                    selected={localFilters.trialDateFrom ? new Date(localFilters.trialDateFrom) : null}
                    onChange={(date) => handleChange('trialDateFrom', date ? date.toISOString().split('T')[0] : '')}
                    className="form-control"
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t('trialFilters.dateFromPlaceholder', 'Sélectionner...')}
                    isClearable
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                    {t('trialFilters.dateTo', 'Date Fin')}
                  </Form.Label>
                  <DatePicker
                    selected={localFilters.trialDateTo ? new Date(localFilters.trialDateTo) : null}
                    onChange={(date) => handleChange('trialDateTo', date ? date.toISOString().split('T')[0] : '')}
                    className="form-control"
                    dateFormat="dd/MM/yyyy"
                    placeholderText={t('trialFilters.dateToPlaceholder', 'Sélectionner...')}
                    isClearable
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* Filtres Client */}
        <Accordion.Item eventKey="1">
          <Accordion.Header>
            <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
            <strong>{t('trialFilters.clientInfo', 'Client')}</strong>
            {countActiveFilters('client') > 0 && (
              <Badge bg="danger" pill className="ms-2">{countActiveFilters('client')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.clientName', 'Nom Client')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.clientNames)}
                    value={localFilters.clientName ? { value: localFilters.clientName, label: localFilters.clientName } : null}
                    onChange={(option) => handleChange('clientName', option?.value || '')}
                    placeholder={t('trialFilters.clientNamePlaceholder', 'Sélectionner un client...')}
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    noOptionsMessage={() => t('trialFilters.noOptions', 'Aucune option')}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.clientCode', 'Code Client')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.clientCodes)}
                    value={localFilters.clientCode ? { value: localFilters.clientCode, label: localFilters.clientCode } : null}
                    onChange={(option) => handleChange('clientCode', option?.value || '')}
                    placeholder={t('trialFilters.clientCodePlaceholder', 'Sélectionner un code...')}
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    noOptionsMessage={() => t('trialFilters.noOptions', 'Aucune option')}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.clientCountry', 'Pays')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.clientCountries)}
                    value={localFilters.clientCountry ? { value: localFilters.clientCountry, label: localFilters.clientCountry } : null}
                    onChange={(option) => handleChange('clientCountry', option?.value || '')}
                    placeholder={t('trialFilters.clientCountryPlaceholder', 'Sélectionner un pays...')}
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    noOptionsMessage={() => t('trialFilters.noOptions', 'Aucune option')}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.clientCity', 'Ville')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.clientCities)}
                    value={localFilters.clientCity ? { value: localFilters.clientCity, label: localFilters.clientCity } : null}
                    onChange={(option) => handleChange('clientCity', option?.value || '')}
                    placeholder={t('trialFilters.clientCityPlaceholder', 'Sélectionner une ville...')}
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    noOptionsMessage={() => t('trialFilters.noOptions', 'Aucune option')}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.clientGroup', 'Groupe')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.clientGroups)}
                    value={localFilters.clientGroup ? { value: localFilters.clientGroup, label: localFilters.clientGroup } : null}
                    onChange={(option) => handleChange('clientGroup', option?.value || '')}
                    placeholder={t('trialFilters.clientGroupPlaceholder', 'Sélectionner un groupe...')}
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    noOptionsMessage={() => t('trialFilters.noOptions', 'Aucune option')}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* Filtres Pièce */}
        <Accordion.Item eventKey="2">
          <Accordion.Header>
            <FontAwesomeIcon icon={faCogs} className="me-2 text-success" />
            <strong>{t('trialFilters.partInfo', 'Pièce')}</strong>
            {countActiveFilters('part') > 0 && (
              <Badge bg="danger" pill className="ms-2">{countActiveFilters('part')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.partName', 'Nom Pièce')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.partNamePlaceholder', 'Ex: Pignon')}
                    value={localFilters.partName || ''}
                    onChange={(e) => handleChange('partName', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.partDesignation', 'Désignation')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.designations)}
                    value={localFilters.partDesignation ? { value: localFilters.partDesignation, label: localFilters.partDesignation } : null}
                    onChange={(option) => handleChange('partDesignation', option?.value || '')}
                    placeholder={t('trialFilters.partDesignationPlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.partReference', 'Référence')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.partReferencePlaceholder', 'Ex: REF-123')}
                    value={localFilters.partReference || ''}
                    onChange={(e) => handleChange('partReference', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.partClientDesignation', 'Désignation Client')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.partClientDesignationPlaceholder', 'Ex: Gear-A')}
                    value={localFilters.partClientDesignation || ''}
                    onChange={(e) => handleChange('partClientDesignation', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* Filtres Acier */}
        <Accordion.Item eventKey="3">
          <Accordion.Header>
            <FontAwesomeIcon icon={faIndustry} className="me-2 text-secondary" />
            <strong>{t('trialFilters.steelInfo', 'Acier')}</strong>
            {countActiveFilters('steel') > 0 && (
              <Badge bg="danger" pill className="ms-2">{countActiveFilters('steel')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.steelGrade', 'Nuance')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.steelGradePlaceholder', 'Ex: 16MnCr5')}
                    value={localFilters.steelGrade || ''}
                    onChange={(e) => handleChange('steelGrade', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.steelFamily', 'Famille')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.steelFamilies)}
                    value={localFilters.steelFamily ? { value: localFilters.steelFamily, label: localFilters.steelFamily } : null}
                    onChange={(option) => handleChange('steelFamily', option?.value || '')}
                    placeholder={t('trialFilters.steelFamilyPlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.steelStandard', 'Norme')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.steelStandards)}
                    value={localFilters.steelStandard ? { value: localFilters.steelStandard, label: localFilters.steelStandard } : null}
                    onChange={(option) => handleChange('steelStandard', option?.value || '')}
                    placeholder={t('trialFilters.steelStandardPlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* Filtres Four */}
        <Accordion.Item eventKey="4">
          <Accordion.Header>
            <FontAwesomeIcon icon={faFire} className="me-2 text-warning" />
            <strong>{t('trialFilters.furnaceInfo', 'Four')}</strong>
            {countActiveFilters('furnace') > 0 && (
              <Badge bg="danger" pill className="ms-2">{countActiveFilters('furnace')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.furnaceType', 'Type de Four')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.furnaceTypes)}
                    value={localFilters.furnaceType ? { value: localFilters.furnaceType, label: localFilters.furnaceType } : null}
                    onChange={(option) => handleChange('furnaceType', option?.value || '')}
                    placeholder={t('trialFilters.furnaceTypePlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.coolingMedia', 'Milieu de Refroidissement')}</Form.Label>
                  <Select
                    options={createOptions(filterOptions.coolingMedias)}
                    value={localFilters.coolingMedia ? { value: localFilters.coolingMedia, label: localFilters.coolingMedia } : null}
                    onChange={(option) => handleChange('coolingMedia', option?.value || '')}
                    placeholder={t('trialFilters.coolingMediaPlaceholder', 'Sélectionner...')}
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        {/* Filtres Recette */}
        <Accordion.Item eventKey="5">
          <Accordion.Header>
            <FontAwesomeIcon icon={faFlask} className="me-2 text-danger" />
            <strong>{t('trialFilters.recipeInfo', 'Recette')}</strong>
            {countActiveFilters('recipe') > 0 && (
              <Badge bg="danger" pill className="ms-2">{countActiveFilters('recipe')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('trialFilters.recipeNumber', 'Numéro de Recette')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.recipeNumberPlaceholder', 'Ex: REC-2024-001')}
                    value={localFilters.recipeNumber || ''}
                    onChange={(e) => handleChange('recipeNumber', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      {/* Boutons d'action */}
      <div className="filter-actions mt-4 d-flex justify-content-end gap-2">
        <Button
          variant="outline-secondary"
          onClick={handleLocalReset}
        >
          <FontAwesomeIcon icon={faRotateLeft} className="me-2" />
          {t('trialFilters.reset', 'Réinitialiser')}
        </Button>
        <Button
          variant="danger"
          onClick={onApply}
        >
          <FontAwesomeIcon icon={faCheck} className="me-2" />
          {t('trialFilters.apply', 'Appliquer les Filtres')}
        </Button>
      </div>
    </div>
  );
};

export default TrialFilters;
