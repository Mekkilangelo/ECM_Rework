import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Badge, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faFilter, 
  faDownload, 
  faRefresh,
  faCalendarAlt,
  faUser,
  faInfo,
  faExclamationTriangle,
  faCheckCircle,
  faBan
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import logService from '../services/logService';
import '../styles/logs.css';

const Logs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
    // Tous les hooks doivent être au début
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  
  // Filtres
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    level: '',
    action: '',
    user: ''
  });  const [showFilters, setShowFilters] = useState(false);

  // Vérification des droits d'accès - seuls les admin et superuser peuvent accéder aux logs
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'superuser') {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);
  // Chargement des logs depuis l'API
  const loadLogs = async (page = 1, filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pagination.limit,
        ...filterParams
      };
      
      const response = await logService.getLogs(params);
      
      setLogs(response.logs || []);
      setFilteredLogs(response.logs || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 50,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      });
      
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err);
      setError(t('logs.errors.loadFailed'));
      toast.error(t('logs.errors.loadFailed'));
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Chargement des statistiques
  const loadStats = async () => {
    try {
      const statsResponse = await logService.getStats();
      setStats(statsResponse);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superuser')) {
      loadLogs();
      loadStats();
    }
  }, [user]);

  // Si l'utilisateur n'a pas les droits, ne rien afficher pendant la redirection
  if (!user || (user.role !== 'admin' && user.role !== 'superuser')) {
    return null;
  }
  // Fonction pour appliquer les filtres via l'API
  const applyFilters = async () => {
    const filterParams = {};
    
    if (filters.dateFrom) filterParams.startDate = filters.dateFrom;
    if (filters.dateTo) filterParams.endDate = filters.dateTo;
    if (filters.level) filterParams.level = filters.level;
    if (filters.action) filterParams.action = filters.action;
    if (filters.user) filterParams.user = filters.user;
    
    await loadLogs(1, filterParams);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = async () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      level: '',
      action: '',
      user: ''
    });
    await loadLogs(1, {});
  };

  // Fonction pour changer de page
  const handlePageChange = async (newPage) => {
    const filterParams = {};
    if (filters.dateFrom) filterParams.startDate = filters.dateFrom;
    if (filters.dateTo) filterParams.endDate = filters.dateTo;
    if (filters.level) filterParams.level = filters.level;
    if (filters.action) filterParams.action = filters.action;
    if (filters.user) filterParams.user = filters.user;
    
    await loadLogs(newPage, filterParams);
  };

  // Fonction pour obtenir l'icône selon le niveau
  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <FontAwesomeIcon icon={faBan} className="text-danger" />;
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning" />;
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-success" />;
      case 'info':
      default:
        return <FontAwesomeIcon icon={faInfo} className="text-info" />;
    }
  };

  // Fonction pour obtenir la classe CSS du badge selon le niveau
  const getLevelBadgeVariant = (level) => {
    switch (level) {
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'info';
    }  };

  // Fonction pour rafraîchir les logs
  const refreshLogs = async () => {
    const filterParams = {};
    if (filters.dateFrom) filterParams.startDate = filters.dateFrom;
    if (filters.dateTo) filterParams.endDate = filters.dateTo;
    if (filters.level) filterParams.level = filters.level;
    if (filters.action) filterParams.action = filters.action;
    if (filters.user) filterParams.user = filters.user;
    
    await loadLogs(pagination.page, filterParams);
    await loadStats();
    toast.success(t('logs.messages.refreshed'));
  };

  // Fonction pour exporter les logs
  const exportLogs = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.dateFrom) filterParams.startDate = filters.dateFrom;
      if (filters.dateTo) filterParams.endDate = filters.dateTo;
      if (filters.level) filterParams.level = filters.level;
      if (filters.action) filterParams.action = filters.action;
      if (filters.user) filterParams.user = filters.user;
      
      const blob = await logService.exportLogs(filterParams);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(t('logs.messages.exported'));
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      toast.error(t('logs.errors.exportFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container fluid>
        <Row>
          <Col>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="h3 mb-0">
                <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                {t('logs.title')}
              </h1>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FontAwesomeIcon icon={faFilter} className="me-1" />
                  {t('logs.filters')}
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={refreshLogs}
                >
                  <FontAwesomeIcon icon={faRefresh} className="me-1" />
                  {t('logs.refresh')}
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={exportLogs}
                >
                  <FontAwesomeIcon icon={faDownload} className="me-1" />
                  {t('logs.export')}
                </Button>
              </div>
            </div>

            {/* Statistiques */}
            {stats && (
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <div className="text-primary">
                        <FontAwesomeIcon icon={faInfo} size="2x" />
                      </div>
                      <h5 className="mt-2 mb-1">{stats.totalLogs || 0}</h5>
                      <small className="text-muted">{t('logs.stats.totalLogs')}</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <div className="text-danger">
                        <FontAwesomeIcon icon={faBan} size="2x" />
                      </div>
                      <h5 className="mt-2 mb-1">{stats.errorCount || 0}</h5>
                      <small className="text-muted">{t('logs.stats.errors')}</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <div className="text-warning">
                        <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                      </div>
                      <h5 className="mt-2 mb-1">{stats.warningCount || 0}</h5>
                      <small className="text-muted">{t('logs.stats.warnings')}</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center border-0 shadow-sm">
                    <Card.Body>
                      <div className="text-success">
                        <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                      </div>
                      <h5 className="mt-2 mb-1">{stats.todayCount || 0}</h5>
                      <small className="text-muted">{t('logs.stats.today')}</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Filtres */}
            {showFilters && (
              <Card className="mb-4">
                <Card.Header>
                  <FontAwesomeIcon icon={faFilter} className="me-2" />
                  {t('logs.filters')}
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('logs.dateFrom')}</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={filters.dateFrom}
                          onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} lg={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('logs.dateTo')}</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          value={filters.dateTo}
                          onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('logs.level')}</Form.Label>
                        <Form.Select
                          value={filters.level}
                          onChange={(e) => setFilters({...filters, level: e.target.value})}
                        >
                          <option value="">{t('logs.allLevels')}</option>
                          <option value="error">{t('logs.error')}</option>
                          <option value="warning">{t('logs.warning')}</option>
                          <option value="success">{t('logs.success')}</option>
                          <option value="info">{t('logs.info')}</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('logs.action')}</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder={t('logs.actionPlaceholder')}
                          value={filters.action}
                          onChange={(e) => setFilters({...filters, action: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} lg={2}>
                      <Form.Group className="mb-3">
                        <Form.Label>{t('logs.user')}</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder={t('logs.userPlaceholder')}
                          value={filters.user}
                          onChange={(e) => setFilters({...filters, user: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex gap-2">
                    <Button variant="primary" size="sm" onClick={applyFilters}>
                      {t('logs.applyFilters')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={resetFilters}>
                      {t('logs.resetFilters')}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Contenu principal */}
            <Card>              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>
                  {t('logs.logHistory')} ({pagination.total} {t('logs.entries')})
                </span>
                <Badge bg="secondary">
                  {t('logs.lastUpdate')}: {new Date().toLocaleString()}
                </Badge>
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <div className="mt-2">{t('logs.loading')}</div>
                  </div>
                ) : error ? (
                  <Alert variant="danger" className="m-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    {error}
                  </Alert>                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FontAwesomeIcon icon={faFileAlt} size="3x" className="mb-3" />
                    <div>{t('logs.noLogs')}</div>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <Table hover className="mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th width="5%">{t('logs.level')}</th>
                            <th width="20%">
                              <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                              {t('logs.timestamp')}
                            </th>
                            <th width="15%">
                              <FontAwesomeIcon icon={faUser} className="me-1" />
                              {t('logs.user')}
                            </th>
                            <th width="20%">{t('logs.action')}</th>
                            <th width="40%">{t('logs.message')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.map((log) => (
                            <tr key={log.id} className="log-entry">
                              <td>
                                <div className="d-flex align-items-center">
                                  {getLevelIcon(log.level)}
                                  <Badge 
                                    bg={getLevelBadgeVariant(log.level)} 
                                    className="ms-2"
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    {log.level.toUpperCase()}
                                  </Badge>
                                </div>
                              </td>
                              <td>
                                <small className="text-muted">
                                  {new Date(log.timestamp).toLocaleString()}
                                </small>
                              </td>
                              <td>
                                <Badge bg="outline-secondary" className="user-badge">
                                  {log.username || 'Système'}
                                </Badge>
                              </td>
                              <td>
                                <code className="action-code">{log.action}</code>
                              </td>
                              <td>{log.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <Card.Footer>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            {t('logs.pagination.showing')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('logs.pagination.of')} {pagination.total}
                          </small>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              disabled={pagination.page <= 1}
                              onClick={() => handlePageChange(pagination.page - 1)}
                            >
                              {t('logs.pagination.previous')}
                            </Button>
                            
                            {/* Pages */}
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                              const pageNum = pagination.page <= 3 
                                ? i + 1 
                                : pagination.page >= pagination.totalPages - 2
                                  ? pagination.totalPages - 4 + i
                                  : pagination.page - 2 + i;
                              
                              if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={pageNum === pagination.page ? "primary" : "outline-secondary"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                            
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              disabled={pagination.page >= pagination.totalPages}
                              onClick={() => handlePageChange(pagination.page + 1)}
                            >
                              {t('logs.pagination.next')}
                            </Button>
                          </div>
                        </div>
                      </Card.Footer>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>        </Row>
      </Container>
    </Layout>
  );
};

export default Logs;
