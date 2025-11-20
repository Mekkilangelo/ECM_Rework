import React, { useContext, useRef, useEffect } from 'react';
import { Button, Spinner, Alert, Modal, Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faArrowLeft, faFlask, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../../context/NavigationContext';
import { useHierarchy } from '../../../../hooks/useHierarchy';
import { AuthContext } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../../common/StatusBadge/StatusBadge';
import ActionButtons from '../../../common/ActionButtons';
import SortableTable from '../../../common/SortableTable';
import SearchInput from '../../../common/SearchInput/SearchInput';
import FormHeader from '../../../common/FormHeader/FormHeader';
import TrialForm from '../form/TrialForm';
//import TrialDetails from './TrialDetails';
import '../../../../styles/dataList.css';
import trialService from '../../../../services/trialService';
import useModalState from '../../../../hooks/useModalState';
import useConfirmationDialog from '../../../../hooks/useConfirmationDialog';

const TrialList = ({ partId }) => {
  const { t } = useTranslation();  const { navigateBack } = useNavigation();
  const { 
    data, 
    loading, 
    error, 
    updateItemStatus, 
    refreshData, 
    deleteItem, 
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
  const trialFormRef = useRef(null);
    // Utilisation du hook useModalState pour gérer les modales
  const {
    showCreateModal: showCreateForm,
    showEditModal: showEditForm,
    showDetailModal,
    selectedItem: selectedTrial,
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

  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');
  
  // Ref pour éviter les appels multiples
  const trialLoadedRef = useRef(false);

  // Effet pour ouvrir automatiquement un trial depuis la recherche
  useEffect(() => {
    // Si déjà chargé, ne rien faire
    if (trialLoadedRef.current) return;
    
    const openTrialId = sessionStorage.getItem('openTrialId');
    console.log('[TrialList] useEffect - openTrialId:', openTrialId);
    
    if (openTrialId) {
      // Marquer comme en cours de chargement
      trialLoadedRef.current = true;
      
      // Nettoyer immédiatement du sessionStorage pour éviter les multiples tentatives
      sessionStorage.removeItem('openTrialId');
      console.log('[TrialList] Chargement du trial', openTrialId);
      
      // Charger le trial directement depuis l'API
      const loadTrial = async () => {
        try {
          const trial = await trialService.getTrialById(parseInt(openTrialId));
          console.log('[TrialList] Trial chargé:', trial);
          if (trial) {
            console.log('[TrialList] Ouverture du modal, hasEditRights:', hasEditRights);
            // Ouvrir le modal du trial
            if (hasEditRights) {
              openEditModal(trial);
            } else {
              openDetailModal(trial);
            }
            
            // Marquer comme vu si nouveau
            if (trial.data_status === 'new') {
              updateItemStatus(trial.id);
            }
          }
        } catch (error) {
          console.error('[TrialList] Erreur lors du chargement du trial:', error);
        }
      };
      
      loadTrial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dépendances vides : s'exécute une seule fois au mount

  const handleTrialClick = (trial) => {
    if (hasEditRights) {
      // Admin et superuser : ouvrir en mode édition
      openEditModal(trial);
    } else {
      // User : ouvrir en mode visualisation
      openDetailModal(trial);
    }
    
    if (trial.data_status === 'new') {
      updateItemStatus(trial.id);
    }  };  const handleDeleteTrial = async (trialId) => {
    const trialToDelete = data.find(t => t.id === trialId);
    const trialName = trialToDelete?.name || 'ce trial';
    
    const confirmed = await confirmDelete(trialName, 'le trial');
    if (confirmed) {
      try {
        await trialService.deleteTrial(trialId);
        alert(t('trials.deleteSuccess'));
        refreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression du trial:', err);
        alert(err.response?.data?.message || t('trials.deleteError'));
      }
    }
  };

  // Fonctions Copy/Paste qui utilisent la référence du formulaire
  const handleCopy = () => {
    if (trialFormRef.current?.handleCopy) {
      trialFormRef.current.handleCopy();
    }
  };

  const handlePaste = () => {
    if (trialFormRef.current?.handlePaste) {
      trialFormRef.current.handlePaste();
    }
  };

  // Configuration des colonnes pour la table triable
  const columns = [
    {
      key: 'name',
      label: t('trials.trialCode'),
      style: { width: '20%' },
      render: (trial) => (
        <div
          onClick={() => handleTrialClick(trial)}
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center"
        >
          <div className="item-name font-weight-bold text-primary">
            {trial.name || t('trials.noName')}
          </div>
          <div className="ml-2">
            <StatusBadge status={trial.data_status} />
          </div>
        </div>
      ),
      sortValue: (trial) => trial.name || ''
    },
    {
      key: 'Trial.recipe_number',
      label: t('trials.recipeNumber'),
      cellClassName: 'text-center',
      render: (trial) => trial.trial?.recipe?.recipe_number || "-",
      sortValue: (trial) => trial.trial?.recipe?.recipe_number || ''
    },
    {
      key: 'Trial.load_number',
      label: t('trials.loadNumber'),
      cellClassName: 'text-center',
      render: (trial) => trial.trial?.load_number || "-",
      sortValue: (trial) => parseInt(trial.trial?.load_number) || 0
    },
    {
      key: 'Trial.test_date',
      label: t('trials.date'),
      cellClassName: 'text-center',
      render: (trial) => trial.trial?.trial_date || t('trials.notDoneYet'),
      sortValue: (trial) => trial.trial?.trial_date ? new Date(trial.trial?.trial_date).getTime() : 0
    },
    {
      key: 'Trial.location',
      label: t('trials.location'),
      cellClassName: 'text-center',
      render: (trial) => trial.trial?.location || "-",
      sortValue: (trial) => trial.trial?.location || ''
    },
    {
      key: 'modified_at',
      label: t('common.modifiedAt'),
      cellClassName: 'text-center',
      render: (trial) => trial.modified_at
        ? new Date(trial.modified_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : t('common.unknown'),
      sortValue: (trial) => trial.modified_at ? new Date(trial.modified_at).getTime() : 0
    },
    {
      key: 'actions',
      label: t('common.actions'),
      style: { width: hasEditRights ? '210px' : '80px' },
      cellClassName: 'text-center',
      sortable: false,
      render: (trial) => (
        <ActionButtons
          itemId={trial.id}
          onView={(e, id) => {
            openDetailModal(trial);
          }}
          onEdit={hasEditRights ? (e, id) => {
            openEditModal(trial);
          } : undefined}
          onDelete={hasEditRights ? (e, id) => {
            handleDeleteTrial(id);
          } : undefined}
          hasEditRights={hasEditRights}
          viewOnly={!hasEditRights}
          labels={{
            view: t('common.view'),
            edit: t('common.edit'),
            delete: t('common.delete')
          }}
        />
      )
    }
  ];

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
            {t('trials.title')}
          </h2>        </div>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={() => openCreateModal()}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('trials.new')}
          </Button>
        )}
      </div>

      {/* Barre de recherche */}
      <Row className="mb-3">
        <Col md={6}>
          <SearchInput
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder={t('trials.searchPlaceholder', 'Rechercher un trial...')}
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
            <FontAwesomeIcon icon={faFlask} size="3x" className="text-secondary mb-3" />
            <h4>
              {searchQuery 
                ? t('trials.noResultsFound', 'Aucun trial trouvé')
                : t('trials.noTrials')
              }
            </h4>
            <p className="text-muted">
              {searchQuery 
                ? t('trials.tryDifferentSearch', 'Essayez une recherche différente')
                : t('trials.clickToAdd')
              }
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer un essai */}
      <Modal
        show={showCreateForm}
        onHide={closeCreateModal}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('trials.new')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>
        <Modal.Body>
          <TrialForm
            ref={trialFormRef}
            partId={partId}
            onClose={closeCreateModal}
            onTrialCreated={handleItemCreated}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un essai */}
      <Modal
        show={showEditForm}
        onHide={() => handleRequestClose('edit', trialFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('trials.edit')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>        <Modal.Body>
          {selectedTrial && (
            <TrialForm
              ref={trialFormRef}
              trial={selectedTrial}
              partId={partId}
              onClose={() => {
                // Appeler directement closeEditModal au lieu de handleRequestClose
                // pour éviter la boucle infinie
                closeEditModal();
              }}
              onTrialUpdated={handleItemUpdated}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails - utilise TrialForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={() => handleRequestClose('detail', trialFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('trials.details')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={true}
          />
        </Modal.Header>
        <Modal.Body>
          {selectedTrial && (
            <TrialForm
              trial={selectedTrial}
              partId={partId}
              onClose={closeDetailModal}
              viewMode={true} // Active le mode lecture seule
            />
          )}
        </Modal.Body>      </Modal>
    </>
  );
};

export default TrialList;
