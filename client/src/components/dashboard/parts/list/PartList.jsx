import React, { useContext, useRef } from 'react';
import { Button, Spinner, Alert, Modal, Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft, faCog, faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../../context/NavigationContext';
import { useHierarchy } from '../../../../hooks/useHierarchy';
import { AuthContext } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../../common/StatusBadge/StatusBadge';
import ActionButtons from '../../../common/ActionButtons';
import SortableTable from '../../../common/SortableTable';
import SearchInput from '../../../common/SearchInput/SearchInput';
import FormHeader from '../../../common/FormHeader/FormHeader';
import PartForm from '../form/PartForm';
import partService from '../../../../services/partService';
import '../../../../styles/dataList.css';
import useModalState from '../../../../hooks/useModalState';
import useConfirmationDialog from '../../../../hooks/useConfirmationDialog';

const PartList = ({ orderId }) => {
  const { t } = useTranslation();  const { navigateToLevel, navigateBack, hierarchyState } = useNavigation();
  const { 
    data, 
    loading, 
    error, 
    updateItemStatus, 
    refreshData, 
    handleSort, 
    sortBy, 
    sortOrder,
    searchQuery,
    handleSearch,
    clearSearch,
    totalItems
  } = useHierarchy();
  const { user } = useContext(AuthContext);
  const { confirmDelete } = useConfirmationDialog();
  const partFormRef = useRef(null);
  
  // Utilisation du hook useModalState pour gérer les modales
  const {
    showCreateModal: showCreateForm,
    showEditModal: showEditForm,
    showDetailModal,
    selectedItem: selectedPart,
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
    onRefreshData: refreshData
  });
  // Vérifier si l'utilisateur a les droits d'édition
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  // Fonctions Copy/Paste qui utilisent la référence du formulaire
  const handleCopy = () => {
    if (partFormRef.current?.handleCopy) {
      partFormRef.current.handleCopy();
    }
  };

  const handlePaste = () => {
    if (partFormRef.current?.handlePaste) {
      partFormRef.current.handlePaste();
    }
  };

  // Configuration des colonnes pour la table triable
  const columns = [
    {
      key: 'name',
      label: t('parts.designation'),
      style: { width: '10%' },
      render: (part) => (
        <div
          onClick={() => handlePartClick(part)}
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center"
        >
          <div className="item-name font-weight-bold text-primary">
            {part.name || t('common.unknown')}
          </div>
          <div className="ml-2">
            <StatusBadge status={part.data_status} />
          </div>
        </div>
      ),
      sortValue: (part) => part.name || ''
    },
    {
      key: 'Part.client_designation',
      label: t('parts.clientDesignation'),
      cellClassName: 'text-center',
      render: (part) => part.part?.client_designation || "-",
      sortValue: (part) => part.part?.client_designation || ''
    },
    {
      key: 'Part.reference',
      label: t('parts.reference'),
      cellClassName: 'text-center',
      render: (part) => part.part?.reference || "-",
      sortValue: (part) => part.part?.reference || ''
    },
    {
      key: 'Part.steel',
      label: t('parts.steel.title'),
      cellClassName: 'text-center',
      render: (part) => part.part?.steel || "-",
      sortValue: (part) => part.part?.steel || ''
    },
    {
      key: 'Part.quantity',
      label: t('parts.quantity'),
      cellClassName: 'text-center',
      render: (part) => part.part?.quantity || "-",
      sortValue: (part) => parseInt(part.part?.quantity) || 0
    },
    {
      key: 'modified_at',
      label: t('common.modifiedAt'),
      cellClassName: 'text-center',
      render: (part) => part.modified_at
        ? new Date(part.modified_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : t('common.unknown'),
      sortValue: (part) => part.modified_at ? new Date(part.modified_at).getTime() : 0
    },
    {
      key: 'actions',
      label: t('common.actions'),
      style: { width: hasEditRights ? '180px' : '80px' },
      cellClassName: 'text-center',
      sortable: false,
      render: (part) => (
        <ActionButtons
          itemId={part.id}
          onView={(e, id) => {
            handleViewDetails(part);
          }}
          onEdit={hasEditRights ? (e, id) => {
            handleEditPart(part);
          } : undefined}
          onDelete={hasEditRights ? (e, id) => {
            handleDeletePart(id);
          } : undefined}
          hasEditRights={hasEditRights}
          labels={{
            view: t('common.view'),
            edit: t('common.edit'),
            delete: t('common.delete')
          }}
        />
      )
    }
  ];

  const handlePartClick = (part) => {
    if (part.data_status === 'new') {
      updateItemStatus(part.id);
    }
    navigateToLevel('test', part.id, part.name);
  };

  const handleViewDetails = (part) => {
    openDetailModal(part);
  };

  const handleEditPart = (part) => {
    openEditModal(part);
  };
  const handleDeletePart = async (partId) => {
    const partToDelete = data.find(p => p.id === partId);
    const partName = partToDelete?.name || 'cette pièce';
    
    const confirmed = await confirmDelete(partName, 'la pièce');
    if (confirmed) {
      try {
        await partService.deletePart(partId);
        alert(t('parts.deleteSuccess'));
        refreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression de la pièce:', err);
        alert(err.response?.data?.message || t('parts.deleteError'));
      }
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /><div>{t('common.loading')}</div></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Button
            variant="outline-secondary"
            className="mr-3"
            onClick={navigateBack}
            size="sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </Button>
          <h2 className="mb-0">
            {t('parts.title')} - {hierarchyState.orderName}
          </h2>        </div>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={openCreateModal}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('parts.new')}
          </Button>
        )}
      </div>

      {/* Barre de recherche */}
      <Row className="mb-3">
        <Col md={6}>
          <SearchInput
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder={t('parts.searchPlaceholder', 'Rechercher une pièce...')}
            initialValue={searchQuery}
            className="mb-0"
          />
        </Col>        {searchQuery && (
          <Col md={6} className="d-flex align-items-center">
            <small className="text-muted">
              {t('search.totalResults', {
                count: data.length
              })}
            </small>
          </Col>
        )}
      </Row>      {data.length > 0 ? (
        <div className="data-list-container">          <SortableTable
            data={data}
            columns={columns}
            hover
            responsive
            className="data-table border-bottom"
            serverSide={true}
            onSort={handleSort}
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
          />
        </div>
      ) : (
        <Card className="text-center p-5 bg-light">
          <Card.Body>
            <FontAwesomeIcon icon={faCog} size="3x" className="text-secondary mb-3" />
            <h4>
              {searchQuery 
                ? t('parts.noResultsFound', 'Aucune pièce trouvée')
                : t('parts.noParts')
              }
            </h4>
            <p className="text-muted">
              {searchQuery 
                ? t('parts.tryDifferentSearch', 'Essayez une recherche différente')
                : t('parts.clickToAdd')
              }
            </p>
          </Card.Body>
        </Card>
      )}{/* Modal pour créer une pièce */}
      <Modal
        show={showCreateForm}
        onHide={() => handleRequestClose('create', partFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('parts.new')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>
        <Modal.Body>
          <PartForm
            ref={partFormRef}
            orderId={orderId}
            onClose={closeCreateModal}
            onPartCreated={handleItemCreated}
          />
        </Modal.Body>
      </Modal>      {/* Modal pour éditer une pièce */}
      <Modal
        show={showEditForm}
        onHide={() => handleRequestClose('edit', partFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('parts.edit')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>
        <Modal.Body>          {selectedPart && (
            <PartForm
              ref={partFormRef}
              part={selectedPart}
              orderId={orderId}
              onClose={() => {
                // Appeler directement closeEditModal au lieu de handleRequestClose
                // pour éviter la boucle infinie
                closeEditModal();
              }}
              onPartUpdated={handleItemUpdated}
            />
          )}
        </Modal.Body>
      </Modal>      {/* Modal pour voir les détails - utilise PartForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={() => handleRequestClose('detail', partFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('parts.details')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={true}
          />
        </Modal.Header>
        <Modal.Body>
          {selectedPart && (
            <PartForm
              part={selectedPart}
              orderId={orderId}
              onClose={closeDetailModal}
              viewMode={true} // Active le mode lecture seule
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PartList;
