import { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner, InputGroup, Card, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes, faSliders, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import SearchResultsByType from '../components/search/SearchResultsByType';
import SearchFilters from '../components/search/SearchFilters';
import ActiveFilters from '../components/search/ActiveFilters';
import useSearch from '../hooks/useSearch';
import '../styles/search.css';

const SearchPage = () => {
  const { t } = useTranslation();
  
  // Utilisation du hook personnalisé
  const {
    searchParams,
    advancedFilters,
    searchResults,
    loading,
    error,
    performSearch,
    handleQueryChange,
    handleEntityTypeChange,
    handleFilterChange,
    handleDateChange,
    clearFilter,
    resetFilters,
    hasActiveFilters,
    getActiveFilters,
    calculateTotalItems
  } = useSearch();

  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const [availableFilters] = useState({
    partDesignations: ['InGear', 'OutGear', 'Ring', 'Shaft', 'Gear', 'Other'],
    trialStatuses: ['OK', 'NOK', 'Pending'],
    trialLocations: ['ECM', 'Client site'],
    mountingTypes: ['Support_Rack', 'Hanging', 'Fixture', 'Tray', 'Conveyor_Belt'],
    positionTypes: ['Horizontal', 'Vertical', 'Rotary', 'Stationary', 'Oscillating'],
    processTypes: ['Annealing', 'Quenching', 'Tempering', 'Carburizing', 'Nitriding']
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchParams.query);
  };

  const handleClearQuery = () => {
    handleQueryChange({ target: { value: '' } });
    if (hasActiveFilters()) {
      performSearch('');
    }
  };

  return (
    <Layout>
      <Container fluid className="mt-4 mb-4">
        <Card className="shadow border-0 rounded-lg mb-4">
          <Card.Body className="p-4">
            <h1 className="h3 mb-4 text-primary">{t('search.title')}</h1>
            
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4 nav-tabs-modern"
            >
              <Tab eventKey="basic" title={<><FontAwesomeIcon icon={faSearch} className="me-2" />{t('search.basicSearch')}</>}>
                <Form onSubmit={handleSearchSubmit}>
                  <Row className="align-items-center">
                    <Col md={8}>
                      <InputGroup className="shadow-sm rounded search-input-group">
                        <Form.Control
                          type="search"
                          placeholder={t('search.placeholder')}
                          value={searchParams.query}
                          onChange={handleQueryChange}
                          autoFocus
                          className="border-0 shadow-none py-2"
                        />
                        {searchParams.query && (
                          <InputGroup.Text 
                            className="border-0 bg-transparent cursor-pointer clear-search-btn"
                            onClick={handleClearQuery}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </InputGroup.Text>
                        )}
                        <Button type="submit" variant="danger" className="search-button">
                          <FontAwesomeIcon icon={faSearch} className="me-2" />
                          {t('search.button')}
                        </Button>
                      </InputGroup>
                    </Col>
                    <Col md={4} className="d-flex justify-content-end">
                      <Button 
                        variant={showFilters ? "primary" : "outline-secondary"} 
                        onClick={() => setShowFilters(!showFilters)}
                        className="d-flex align-items-center filter-toggle-btn"
                      >
                        <FontAwesomeIcon icon={faFilter} className="me-2" />
                        {showFilters ? t('search.hideFilters') : t('search.showFilters')}
                      </Button>
                    </Col>
                  </Row>
                  
                  {showFilters && (
                    <div className="mt-4 p-4 bg-light rounded filter-container">
                      <p className="mb-3 fw-bold">{t('search.filterByType')}:</p>
                      <div className="d-flex flex-wrap">
                        {['clients', 'orders', 'parts', 'trials', 'steels'].map(type => (
                          <Form.Check
                            key={type}
                            type="checkbox"
                            id={`filter-${type}`}
                            label={t(`search.entityTypes.${type}`)}
                            checked={searchParams.entityTypes.includes(type)}
                            onChange={() => handleEntityTypeChange(type)}
                            className="me-4 mb-3 entity-type-checkbox"
                          />
                        ))}
                      </div>

                      {/* ActiveFilters s'affiche maintenant uniquement ici pour la recherche basique quand showFilters est activé */}
                      {hasActiveFilters() && (
                        <ActiveFilters 
                          activeFilters={getActiveFilters()} 
                          clearFilter={clearFilter}
                          resetFilters={() => {
                            resetFilters();
                            performSearch(searchParams.query);
                          }}
                        />
                      )}
                    </div>
                  )}
                </Form>
              </Tab>
              
              <Tab eventKey="advanced" title={<><FontAwesomeIcon icon={faSliders} className="me-2" />{t('search.advancedSearch')}</>}>
                <div className="p-4 bg-light rounded filter-container">
                  <Row className="mb-4">
                    <Col md={12} className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 text-primary">{t('search.advancedFilters')}</h5>
                      <div>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={resetFilters}
                          className="me-2"
                        >
                          {t('search.resetFilters')}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => performSearch(searchParams.query)}
                          className="d-flex align-items-center"
                        >
                          <FontAwesomeIcon icon={faSearch} className="me-2" />
                          {t('search.applyFilters')}
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  
                  <SearchFilters
                    entityTypes={searchParams.entityTypes}
                    advancedFilters={advancedFilters}
                    availableFilters={availableFilters}
                    handleEntityTypeChange={handleEntityTypeChange}
                    handleFilterChange={handleFilterChange}
                    handleDateChange={handleDateChange}
                  />
                  
                  <Row className="mt-4">
                    <Col className="d-flex justify-content-end">
                      <Button
                        variant="danger"
                        onClick={() => performSearch(searchParams.query)}
                        className="px-4 py-2 d-flex align-items-center"
                      >
                        <FontAwesomeIcon icon={faSearch} className="me-2" />
                        {t('search.applyFilters')}
                        <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                      </Button>
                    </Col>
                  </Row>
                </div>
              </Tab>
            </Tabs>
            
            {/* Les filtres actifs s'affichent ici seulement quand on est dans l'onglet avancé ou quand showFilters est désactivé */}
            {hasActiveFilters() && ((activeTab === 'advanced') || (activeTab === 'basic' && !showFilters)) && (
              <ActiveFilters 
                activeFilters={getActiveFilters()} 
                clearFilter={clearFilter}
                resetFilters={() => {
                  resetFilters();
                  performSearch(searchParams.query);
                }}
              />
            )}
            
            {(searchParams.query || hasActiveFilters()) && !loading && !error && (
              <div className="text-muted mt-3">
                {calculateTotalItems() > 0 ? (
                  <p>
                    {t('search.resultsCount', { 
                      count: calculateTotalItems(), 
                      query: searchParams.query || t('search.withActiveFilters')  
                    })}
                  </p>
                ) : (
                  <p>{t('search.noResults', { 
                    query: searchParams.query || t('search.withActiveFilters') 
                  })}</p>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
        
        {loading && (
          <div className="text-center mt-5 search-loading">
            <Spinner animation="border" variant="danger" />
            <p className="mt-2">{t('search.loading')}</p>
          </div>
        )}
        
        {error && (
          <Alert variant="danger" className="mt-3 shadow-sm border-0">
            <Alert.Heading>{t('search.errorTitle')}</Alert.Heading>
            <p>{error}</p>
          </Alert>
        )}
        
        {!loading && !error && (searchParams.query || hasActiveFilters()) && (
          <SearchResultsByType 
            results={searchResults} 
            entityTypes={searchParams.entityTypes} 
          />
        )}
      </Container>
    </Layout>
  );
};

export default SearchPage;