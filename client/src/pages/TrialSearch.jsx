import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faTimes, faSliders, 
  faChevronDown, faChevronUp, faSortAmountDown 
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import TrialFilters from '../components/search/TrialFilters';
import TrialResultsGrid from '../components/search/TrialResultsGrid';
import trialSearchService from '../services/trialSearchService';
import '../styles/trial-search.css';

const TrialSearch = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // État de la recherche
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [showFilters, setShowFilters] = useState(true);
  
  // État des résultats
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination et tri
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [sortBy, setSortBy] = useState('trial_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Chargement initial des options de filtrage
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Récupérer le paramètre de recherche de l'URL au chargement
  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      setQuery(searchQuery);
      // Lancer automatiquement la recherche après un court délai
      setTimeout(() => {
        performSearch(1);
      }, 100);
    }
  }, [searchParams]);

  const loadFilterOptions = async () => {
    try {
      const response = await trialSearchService.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des options de filtrage:', err);
    }
  };

  // Fonction de recherche
  const performSearch = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        query,
        ...filters,
        page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };

      const response = await trialSearchService.searchTrials(searchParams);
      
      if (response.success) {
        setResults(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError('Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Fonction helper pour lancer une recherche avec une requête spécifique
  const performSearchWithQuery = async (searchQuery) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = {
        query: searchQuery,
        filters,
        page: 1,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };

      const response = await trialSearchService.searchTrials(searchParams);
      
      if (response.success) {
        setResults(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Erreur lors de la recherche');
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError('Une erreur est survenue lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Gestion du changement de recherche textuelle
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  // Gestion de la soumission du formulaire
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(1);
  };

  // Effacer la recherche
  const handleClearQuery = () => {
    setQuery('');
  };

  // Gestion des filtres
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Appliquer les filtres
  const handleApplyFilters = () => {
    performSearch(1);
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({});
    setQuery('');
    setResults([]);
    setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
  };

  // Gestion du tri
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  // Exécuter la recherche quand le tri change
  useEffect(() => {
    if (results.length > 0) {
      performSearch(pagination.page);
    }
  }, [sortBy, sortOrder]);

  // Compter les filtres actifs
  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length;

  // Gestion de la pagination
  const handlePageChange = (newPage) => {
    performSearch(newPage);
  };

  return (
    <Layout>
      <Container fluid className="trial-search-page py-4">
        {/* En-tête */}
        <div className="search-header mb-4">
          <h1 className="page-title">
            <FontAwesomeIcon icon={faSearch} className="mr-3" />
            {t('trialSearch.title', 'Recherche d\'Essais')}
          </h1>
          <p className="page-subtitle text-muted">
            {t('trialSearch.subtitle', 'Recherchez et filtrez les essais')}
          </p>
        </div>

        {/* Barre de recherche principale */}
        <Card className="search-card shadow-sm mb-4">
          <Card.Body>
            <Form onSubmit={handleSearchSubmit}>
              <Row className="align-items-center g-3">
                <Col lg={9}>
                  <InputGroup className="search-input-group">
                    <InputGroup.Text className="bg-white border-right-0">
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder={t('trialSearch.placeholder', 'Rechercher par n° de charge, client, recette ou nuance...')}
                      value={query}
                      onChange={handleQueryChange}
                      className="border-left-0 border-right-0 shadow-none"
                    />
                    {query && (
                      <InputGroup.Text 
                        className="bg-white border-left-0 cursor-pointer"
                        onClick={handleClearQuery}
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-muted" />
                      </InputGroup.Text>
                    )}
                  </InputGroup>
                </Col>
                
                <Col lg={3} className="d-flex">
                  <Button 
                    type="submit" 
                    variant="danger"
                    className="flex-grow-1"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="mr-2" />
                        {t('trialSearch.searching', 'Recherche...')}
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSearch} className="mr-2" />
                        {t('trialSearch.search', 'Rechercher')}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant={showFilters ? 'outline-secondary' : 'primary'}
                    onClick={() => setShowFilters(!showFilters)}
                    className="position-relative ml-2"
                  >
                    <FontAwesomeIcon icon={faSliders} className="mr-2" />
                    {showFilters ? t('trialSearch.hideFilters', 'Masquer') : t('trialSearch.showFilters', 'Filtres')}
                    {activeFiltersCount > 0 && (
                      <Badge 
                        variant="danger" 
                        pill 
                        className="position-absolute"
                        style={{ top: '-8px', right: '-8px' }}
                      >
                        {activeFiltersCount}
                      </Badge>
                    )}
                    <FontAwesomeIcon 
                      icon={showFilters ? faChevronUp : faChevronDown} 
                      className="ml-2" 
                      size="sm"
                    />
                  </Button>
                </Col>
              </Row>
            </Form>

            {/* Panneau de filtres */}
            {showFilters && (
              <div className="filters-panel mt-4 pt-4 border-top">
                <TrialFilters
                  filters={filters}
                  filterOptions={filterOptions}
                  onChange={handleFilterChange}
                  onApply={handleApplyFilters}
                  onReset={handleResetFilters}
                />
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Barre d'informations et tri */}
        {results.length > 0 && (
          <div className="results-toolbar mb-3 d-flex justify-content-between align-items-center">
            <div className="results-info">
              <span className="text-muted">
                {t('trialSearch.resultsCount', { 
                  count: pagination.total, 
                  defaultValue: `${pagination.total} essai(s) trouvé(s)` 
                })}
              </span>
            </div>
            
            <div className="sort-controls d-flex align-items-center">
              <span className="text-muted small mr-2">
                <FontAwesomeIcon icon={faSortAmountDown} className="mr-1" />
                {t('trialSearch.sortBy', 'Trier par:')}
              </span>
              
              <div className="btn-group btn-group-sm">
                <Button
                  variant={sortBy === 'trial_date' ? 'danger' : 'outline-secondary'}
                  size="sm"
                  onClick={() => handleSortChange('trial_date')}
                >
                  {t('trialSearch.sortByDate', 'Date')}
                  {sortBy === 'trial_date' && (
                    <FontAwesomeIcon 
                      icon={sortOrder === 'ASC' ? faChevronUp : faChevronDown} 
                      className="ml-1" 
                      size="xs"
                    />
                  )}
                </Button>
                <Button
                  variant={sortBy === 'trial_code' ? 'danger' : 'outline-secondary'}
                  size="sm"
                  onClick={() => handleSortChange('trial_code')}
                >
                  {t('trialSearch.sortByCode', 'Code')}
                  {sortBy === 'trial_code' && (
                    <FontAwesomeIcon 
                      icon={sortOrder === 'ASC' ? faChevronUp : faChevronDown} 
                      className="ml-1" 
                      size="xs"
                    />
                  )}
                </Button>
                <Button
                  variant={sortBy === 'name' ? 'danger' : 'outline-secondary'}
                  size="sm"
                  onClick={() => handleSortChange('name')}
                >
                  {t('trialSearch.sortByName', 'Nom')}
                  {sortBy === 'name' && (
                    <FontAwesomeIcon 
                      icon={sortOrder === 'ASC' ? faChevronUp : faChevronDown} 
                      className="ml-1" 
                      size="xs"
                    />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Messages d'erreur */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <Alert.Heading>
              <FontAwesomeIcon icon={faTimes} className="mr-2" />
              {t('trialSearch.error', 'Erreur')}
            </Alert.Heading>
            <p className="mb-0">{error}</p>
          </Alert>
        )}

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="danger" />
            <p className="mt-3 text-muted">{t('trialSearch.loading', 'Chargement des résultats...')}</p>
          </div>
        ) : results.length > 0 ? (
          <TrialResultsGrid 
            results={results}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        ) : query || activeFiltersCount > 0 ? (
          <Card className="text-center py-5">
            <Card.Body>
              <FontAwesomeIcon icon={faSearch} size="3x" className="text-muted mb-3" />
              <h5>{t('trialSearch.noResults', 'Aucun essai trouvé')}</h5>
              <p className="text-muted">
                {t('trialSearch.noResultsHint', 'Essayez de modifier vos critères de recherche ou vos filtres')}
              </p>
            </Card.Body>
          </Card>
        ) : (
          <Card className="text-center py-5 bg-light border-0">
            <Card.Body>
              <FontAwesomeIcon icon={faSearch} size="3x" className="text-muted mb-3" />
              <h5>{t('trialSearch.welcome', 'Commencez votre recherche')}</h5>
              <p className="text-muted">
                {t('trialSearch.welcomeHint', 'Utilisez la barre de recherche ou les filtres pour trouver des essais')}
              </p>
            </Card.Body>
          </Card>
        )}
      </Container>
    </Layout>
  );
};

export default TrialSearch;
