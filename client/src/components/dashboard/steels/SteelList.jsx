// src/components/reference/steels/SteelList.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card, Badge, Row, Col, Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCodeBranch, faSearch } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../../context/AuthContext';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import ActionButtons from '../../common/ActionButtons';
import SteelForm from './SteelForm';
import steelService from '../../../services/steelService';
import '../../../styles/dataList.css';
import { useTranslation } from 'react-i18next';
import useModalState from '../../../hooks/useModalState';

const SteelList = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [steels, setSteels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const steelFormRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Utilisation du hook useModalState pour gérer les modales
  const {
    showCreateModal: showCreateForm,
    showEditModal: showEditForm,
    showDetailModal,
    selectedItem: selectedSteel,
    openCreateModal,
    openEditModal,
    openDetailModal,
    closeCreateModal,
    closeEditModal,
    closeDetailModal,
    handleRequestClose,
    handleItemCreated,
    handleItemUpdated
  } = useModalState({
    onRefreshData: fetchSteels
  });

  // Vérification des droits utilisateur
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  useEffect(() => {
    fetchSteels();
  }, [currentPage, limit]);

  const fetchSteels = async () => {
    try {
      setLoading(true);
      const response = await steelService.getAllSteels(currentPage, limit);
      
      // Check the structure of the response based on your API
      if (response.data && response.data.steels) {
        // If the API returns { steels, pagination }
        setSteels(response.data.steels);
        
        // Set pagination data
        const { total, limit: responseLimit } = response.data.pagination;
        setTotal(total);
        setTotalPages(Math.ceil(total / responseLimit));
      } else if (Array.isArray(response.data)) {
        // If the API directly returns an array of steels
        setSteels(response.data);
        // Assuming the total count is in a header or elsewhere
        const totalCount = parseInt(response.headers['x-total-count'] || '0');
        setTotal(totalCount);
        setTotalPages(Math.ceil(totalCount / limit));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching steels:', err);
      setError('Une erreur est survenue lors du chargement des aciers.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (steel) => {
    openDetailModal(steel);
  };

  const handleEditSteel = (steel) => {
    openEditModal(steel);
  };

  const handleDeleteSteel = async (steelId) => {
    if (window.confirm(t("steels.confirmDelete"))) {
      try {
        await steelService.deleteSteel(steelId);
        alert(t("steels.deleteSuccess"));
        fetchSteels();
      } catch (err) {
        console.error('Erreur lors de la suppression de l\'acier:', err);
        alert(err.response?.data?.message || t("steels.deleteError"));
      }
    }
  };

  const renderPagination = () => {
    const items = [];
    const maxPagesToShow = 5; // Show at most 5 page links
    
    // Calculate the range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
      }
    }
    
    // Add page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }
      items.push(
        <Pagination.Item 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="mt-3 justify-content-center">
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  if (loading && steels.length === 0) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FontAwesomeIcon className="mr-2 text-danger" />
          {t('steels.title')}
        </h2>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={openCreateModal}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('steels.add')}
          </Button>
        )}
      </div>
      {steels.length > 0 ? (
        <>
          <div className="data-list-container">
            <Table hover responsive className="data-table border-bottom">
              <thead>
                <tr className="bg-light">
                  <th style={{ width: '30%' }}>{t('steels.grade')}</th>
                  <th className="text-center">{t('steels.family')}</th>
                  <th className="text-center">{t('steels.standard')}</th>
                  <th className="text-center">{t('common.modifiedAt')}</th>
                  <th className="text-center" style={{ width: hasEditRights ? '150px' : '80px' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {steels.map(steel => {
                  // Handle different response structures
                  const steelData = steel.Steel || steel; // If it's nested under a Node object
                  
                  return (
                    <tr key={steel.id || steelData.id}>
                      <td>
                        <div
                          onClick={() => handleViewDetails(steel)}
                          style={{ cursor: 'pointer' }}
                          className="d-flex align-items-center"
                        >
                          <div className="item-name font-weight-bold text-primary">
                            {steelData.grade || t('steels.noGrade')}
                          </div>
                          <div className="ml-2">
                            <StatusBadge status={steel.data_status || steelData.data_status || 'active'} />
                          </div>
                        </div>
                      </td>
                      <td className="text-center">{steelData.family || "-"}</td>
                      <td className="text-center">{steelData.standard || "-"}</td>
                      <td className="text-center">
                        {steel.modified_at || steelData.modified_at
                          ? new Date(steel.modified_at || steelData.modified_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                          : "-"}
                      </td>
                      <td className="text-center">
                        <ActionButtons
                          itemId={steel.id || steelData.id}
                          onView={(e, id) => {
                            handleViewDetails(steel);
                          }}
                          onEdit={hasEditRights ? (e, id) => {
                            handleEditSteel(steel);
                          } : undefined}
                          onDelete={hasEditRights ? (e, id) => {
                            handleDeleteSteel(steel.id || steelData.id);
                          } : undefined}
                          hasEditRights={hasEditRights}
                          labels={{
                            view: t('common.view'),
                            edit: t('common.edit'),
                            delete: t('common.delete')
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          {loading && <div className="text-center mt-3"><Spinner animation="border" size="sm" /></div>}
          {totalPages > 1 && renderPagination()}
          <div className="text-muted text-center mt-2">
            {t('steels.showing', { count: steels.length, total: total })}
          </div>
        </>
      ) : (
        <Card className="text-center p-5 bg-light">
          <Card.Body>
            <FontAwesomeIcon icon={faCodeBranch} size="3x" className="text-secondary mb-3" />
            <h4>{t('steels.noSteelsFound')}</h4>
            <p className="text-muted">
              {searchQuery ? t('steels.noResultsFound') : t('steels.clickToAddSteel')}
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer un acier */}
      <Modal
        show={showCreateForm}
        onHide={closeCreateModal}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('steels.add')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SteelForm
            onClose={closeCreateModal}
            onSteelCreated={() => {
              fetchSteels();
              closeCreateModal();
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un acier */}
      <Modal
        show={showEditForm}
        onHide={closeEditModal}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('steels.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSteel && (
            <SteelForm
              steel={selectedSteel}
              onClose={closeEditModal}
              onSteelUpdated={() => {
                fetchSteels();
                closeEditModal();
              }}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails - utilise SteelForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={closeDetailModal}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('steels.details')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSteel && (
            <SteelForm
              steel={selectedSteel}
              onClose={closeDetailModal}
              viewMode={true} // Active le mode lecture seule
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SteelList;
