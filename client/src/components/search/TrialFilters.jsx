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
      trial: ['loadNumber', 'status', 'location', 'mountingType', 'positionType', 'processType', 'trialDateFrom', 'trialDateTo'],
      client: ['clientNames', 'clientCountry', 'clientCity', 'clientGroup'],
      part: ['partDesignation', 'partReference', 'partClientDesignation'],
      steel: ['steelGrades', 'steelFamily', 'steelStandard', 'includeEquivalents'],
      furnace: ['furnaceType', 'furnaceSize', 'heatingCell', 'coolingMedia', 'quenchCell'],
      recipe: ['recipeNumber']
    };

    return categoryFilters[category]?.filter(key => {
      const value = localFilters[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      return value && value !== '';
    }).length || 0;
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
    clientCountries: filterOptions.clientCountries || [],
    clientCities: filterOptions.clientCities || [],
    clientGroups: filterOptions.clientGroups || [],
    loadNumbers: filterOptions.loadNumbers || [],
    steelGrades: filterOptions.steelGrades || [],
    recipeNumbers: filterOptions.recipeNumbers || []
  };

  return (
    <div className="trial-filters">
      <Accordion alwaysOpen>
        {/* Filtres sur l'essai */}
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <FontAwesomeIcon icon={faFlask} className="mr-2 text-info" />
            <strong>{t('trialFilters.trialInfo', 'Informations Essai')}</strong>
            {countActiveFilters('trial') > 0 && (
              <Badge variant="danger" pill className="ml-2">{countActiveFilters('trial')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faBoxes} className="mr-1" />
                    {t('trialFilters.loadNumber', 'Numéro de Charge')}
                  </Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.loadNumbers)}
                    value={localFilters.loadNumber ? { value: localFilters.loadNumber, label: localFilters.loadNumber } : null}
                    onChange={(option) => handleChange('loadNumber', option?.value || '')}
                    placeholder={t('trialFilters.loadNumberPlaceholder', 'Sélectionner...')}
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
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faFilter} className="mr-1" />
                    {t('trialFilters.status', 'Statut')}
                  </Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.statuses)}
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
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" />
                    {t('trialFilters.location', 'Localisation')}
                  </Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.locations)}
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
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faBoxes} className="mr-1" />
                    {t('trialFilters.mountingType', 'Type de Montage')}
                  </Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.mountingTypes)}
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
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faArrowsAlt} className="mr-1" />
                    {t('trialFilters.positionType', 'Type de Position')}
                  </Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.positionTypes)}
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

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faFilter} className="mr-1" />
                    {t('trialFilters.processType', 'Type de Processus')}
                  </Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.processTypes)}
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

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
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

              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
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
            <FontAwesomeIcon icon={faUser} className="mr-2 text-primary" />
            <strong>{t('trialFilters.clientInfo', 'Client')}</strong>
            {countActiveFilters('client') > 0 && (
              <Badge variant="danger" pill className="ml-2">{countActiveFilters('client')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.clientName', 'Nom Client')}</Form.Label>
                  <Select
                    isMulti
                    options={createOptions(safeFilterOptions.clientNames)}
                    value={Array.isArray(localFilters.clientNames) ? localFilters.clientNames.map(v => ({ value: v, label: v })) : []}
                    onChange={(options) => handleChange('clientNames', options ? options.map(o => o.value) : [])}
                    placeholder={t('trialFilters.clientNamePlaceholder', 'Sélectionner un ou plusieurs clients...')}
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
                  <Form.Label className="small font-weight-bold">{t('trialFilters.clientCountry', 'Pays')}</Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.clientCountries)}
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

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.clientCity', 'Ville')}</Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.clientCities)}
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

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.clientGroup', 'Groupe')}</Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.clientGroups)}
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
            <FontAwesomeIcon icon={faCogs} className="mr-2 text-success" />
            <strong>{t('trialFilters.partInfo', 'Pièce')}</strong>
            {countActiveFilters('part') > 0 && (
              <Badge variant="danger" pill className="ml-2">{countActiveFilters('part')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.partDesignation', 'Désignation')}</Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.designations)}
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

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.partReference', 'Référence')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('trialFilters.partReferencePlaceholder', 'Ex: REF-123')}
                    value={localFilters.partReference || ''}
                    onChange={(e) => handleChange('partReference', e.target.value)}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.partClientDesignation', 'Désignation Client')}</Form.Label>
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
            <FontAwesomeIcon icon={faIndustry} className="mr-2 text-secondary" />
            <strong>{t('trialFilters.steelInfo', 'Acier')}</strong>
            {countActiveFilters('steel') > 0 && (
              <Badge variant="danger" pill className="ml-2">{countActiveFilters('steel')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.steelGrade', 'Nuance')}</Form.Label>
                  <Select
                    isMulti
                    options={createOptions(safeFilterOptions.steelGrades)}
                    value={Array.isArray(localFilters.steelGrades) ? localFilters.steelGrades.map(v => ({ value: v, label: v })) : []}
                    onChange={(options) => handleChange('steelGrades', options ? options.map(o => o.value) : [])}
                    placeholder={t('trialFilters.steelGradePlaceholder', 'Sélectionner une ou plusieurs nuances...')}
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
                  <Form.Label className="small font-weight-bold">&nbsp;</Form.Label>
                  <Form.Check
                    type="switch"
                    id="includeEquivalents"
                    label={t('trialFilters.includeEquivalents', 'Inclure les équivalents')}
                    checked={localFilters.includeEquivalents || false}
                    onChange={(e) => handleChange('includeEquivalents', e.target.checked)}
                    className="mt-2"
                  />
                  <Form.Text className="text-muted small">
                    {t('trialFilters.includeEquivalentsHelp', 'Rechercher aussi par les aciers équivalents')}
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.steelFamily', 'Famille')}</Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.steelFamilies)}
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
                  <Form.Label className="small font-weight-bold">{t('trialFilters.steelStandard', 'Norme')}</Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.steelStandards)}
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
            <FontAwesomeIcon icon={faFire} className="mr-2 text-warning" />
            <strong>{t('trialFilters.furnaceInfo', 'Four')}</strong>
            {countActiveFilters('furnace') > 0 && (
              <Badge variant="danger" pill className="ml-2">{countActiveFilters('furnace')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.furnaceType', 'Type de Four')}</Form.Label>
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
                  <Form.Label className="small font-weight-bold">{t('trialFilters.coolingMedia', 'Milieu de Refroidissement')}</Form.Label>
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
            <FontAwesomeIcon icon={faFlask} className="mr-2 text-danger" />
            <strong>{t('trialFilters.recipeInfo', 'Recette')}</strong>
            {countActiveFilters('recipe') > 0 && (
              <Badge variant="danger" pill className="ml-2">{countActiveFilters('recipe')}</Badge>
            )}
          </Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small font-weight-bold">{t('trialFilters.recipeNumber', 'Numéro de Recette')}</Form.Label>
                  <Select
                    options={createOptions(safeFilterOptions.recipeNumbers)}
                    value={localFilters.recipeNumber ? { value: localFilters.recipeNumber, label: localFilters.recipeNumber } : null}
                    onChange={(option) => handleChange('recipeNumber', option?.value || '')}
                    placeholder={t('trialFilters.recipeNumberPlaceholder', 'Sélectionner...')}
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
      </Accordion>

      {/* Boutons d'action */}
      <div className="filter-actions mt-4 d-flex justify-content-end">
        <Button
          variant="outline-secondary"
          onClick={handleLocalReset}
          className="mr-2"
        >
          <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />
          {t('trialFilters.reset', 'Réinitialiser')}
        </Button>
        <Button
          variant="danger"
          onClick={onApply}
        >
          <FontAwesomeIcon icon={faCheck} className="mr-2" />
          {t('trialFilters.apply', 'Appliquer les Filtres')}
        </Button>
      </div>
    </div>
  );
};

export default TrialFilters;
