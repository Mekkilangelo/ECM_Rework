// src/components/reference/steels/SteelList.jsx
import React, { useState, useContext, useEffect, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCodeBranch, faSearch } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../../../context/AuthContext';
import StatusBadge from '../../../common/StatusBadge/StatusBadge';
import ActionButtons from '../../../common/ActionButtons';
import SteelForm from '../form/SteelForm';
import steelService from '../../../../services/steelService';
import '../../../../styles/dataList.css';
import { useTranslation } from 'react-i18next';
import useModalState from '../../../../hooks/useModalState';
import Pagination from '../../../common/Pagination';
import LimitSelector from '../../../common/LimitSelector';

const SteelList = () => {  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const [steels, setSteels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const steelFormRef = useRef(null);
  const limitSelectorRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);  // Déclarer fetchSteels avant de l'utiliser
  const fetchSteels = async () => {
    try {
      console.log('=== FRONTEND SteelList fetchSteels called ===');
      console.log('Paramètres:', { currentPage, itemsPerPage });
      
      setLoading(true);
      const response = await steelService.getSteels(currentPage, itemsPerPage);
      
      console.log('Réponse complète steelService.getSteels:', response);
      
      // Check the structure of the response based on your API
      if (response && response.steels) {
        console.log('Structure trouvée: response.steels');
        console.log('Aciers trouvés:', response.steels);
        console.log('Pagination:', response.pagination);
        
        // If the API returns { steels, pagination }
        setSteels(response.steels);
        
        // Set pagination data
        const { total, limit: responseLimit } = response.pagination || {};
        console.log('Pagination data:', { total, responseLimit });
        
        setTotal(total || 0);
        setTotalPages(Math.ceil((total || 0) / (responseLimit || itemsPerPage)));
        
        // Mettre à jour le total dans le limitSelector
        if (limitSelectorRef.current) {
          limitSelectorRef.current.updateTotal(total || 0);
        }
      } else if (response && response.data && response.data.steels) {
        console.log('Structure trouvée: response.data.steels');
        console.log('Aciers trouvés:', response.data.steels);
        
        setSteels(response.data.steels);
        
        // Set pagination data
        const { total, limit: responseLimit } = response.data.pagination || {};
        setTotal(total || 0);
        setTotalPages(Math.ceil((total || 0) / (responseLimit || itemsPerPage)));
        
        // Mettre à jour le total dans le limitSelector
        if (limitSelectorRef.current) {
          limitSelectorRef.current.updateTotal(total || 0);
        }
      } else if (Array.isArray(response.data)) {
        console.log('Structure trouvée: response.data (array)');
        console.log('Aciers trouvés:', response.data);
        
        // If the API directly returns an array of steels
        setSteels(response.data);
        // Assuming the total count is in a header or elsewhere
        const totalCount = parseInt(response.headers['x-total-count'] || '0');
        setTotal(totalCount);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
        
        // Mettre à jour le total dans le limitSelector
        if (limitSelectorRef.current) {
          limitSelectorRef.current.updateTotal(totalCount);
        }
      } else {
        console.log('Structure non reconnue:', response);
        setSteels([]);
        setTotal(0);
        setTotalPages(1);
      }
      
      console.log('État final:', {
        steelsCount: steels.length,
        total,
        totalPages
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching steels:', err);
      console.error('Détails erreur:', err.response?.data);
      setError('Une erreur est survenue lors du chargement des aciers.');
    } finally {
      setLoading(false);
    }
  };

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
  }, [currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Fonction pour gérer le changement de limite d'éléments par page
  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Réinitialiser à la première page lors du changement de limite
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

  if (loading && steels.length === 0) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">        <h2 className="mb-0">
          <FontAwesomeIcon icon={faCodeBranch} className="mr-2 text-danger" />
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
      
      {/* Contrôles de pagination */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <LimitSelector 
          ref={limitSelectorRef}
          itemsPerPage={itemsPerPage} 
          onLimitChange={handleLimitChange} 
          totalItems={total}
        />
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
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
            </Table>          </div>
          {loading && <div className="text-center mt-3"><Spinner animation="border" size="sm" /></div>}
          
          {/* Pagination en bas de liste si besoin */}
          <div className="d-flex justify-content-center mt-3">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
          
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
