import React, { useContext, useRef } from 'react';
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
import TestForm from '../form/TestForm';
//import TestDetails from './TestDetails';
import '../../../../styles/dataList.css';
import testService from '../../../../services/testService';
import useModalState from '../../../../hooks/useModalState';
import useConfirmationDialog from '../../../../hooks/useConfirmationDialog';

const TestList = ({ partId }) => {
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
  const testFormRef = useRef(null);
    // Utilisation du hook useModalState pour gérer les modales
  const {
    showCreateModal: showCreateForm,
    showEditModal: showEditForm,
    showDetailModal,
    selectedItem: selectedTest,
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
  const handleTestClick = (test) => {
    if (hasEditRights) {
      // Admin et superuser : ouvrir en mode édition
      openEditModal(test);
    } else {
      // User : ouvrir en mode visualisation
      openDetailModal(test);
    }
    
    if (test.data_status === 'new') {
      updateItemStatus(test.id);
    }  };  const handleDeleteTest = async (testId) => {
    const testToDelete = data.find(t => t.id === testId);
    const testName = testToDelete?.name || 'ce test';
    
    const confirmed = await confirmDelete(testName, 'le test');
    if (confirmed) {
      try {
        await testService.deleteTest(testId);
        alert(t('tests.deleteSuccess'));
        refreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression du test:', err);
        alert(err.response?.data?.message || t('tests.deleteError'));
      }
    }
  };

  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  // Fonctions Copy/Paste qui utilisent la référence du formulaire
  const handleCopy = () => {
    if (testFormRef.current?.handleCopy) {
      testFormRef.current.handleCopy();
    }
  };

  const handlePaste = () => {
    if (testFormRef.current?.handlePaste) {
      testFormRef.current.handlePaste();
    }
  };

  // Configuration des colonnes pour la table triable
  const columns = [
    {
      key: 'name',
      label: t('tests.testCode'),
      style: { width: '25%' },
      render: (test) => (
        <div
          onClick={() => handleTestClick(test)}
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center"
        >
          <div className="item-name font-weight-bold text-primary">
            {test.name || t('tests.noName')}
          </div>
          <div className="ml-2">
            <StatusBadge status={test.data_status} />
          </div>
        </div>
      ),
      sortValue: (test) => test.name || ''
    },
    {
      key: 'Test.load_number',
      label: t('tests.loadNumber'),
      cellClassName: 'text-center',
      render: (test) => test.test?.load_number || "-",
      sortValue: (test) => parseInt(test.test?.load_number) || 0
    },
    {
      key: 'Test.test_date',
      label: t('tests.date'),
      cellClassName: 'text-center',
      render: (test) => test.test?.test_date || t('tests.notDoneYet'),
      sortValue: (test) => test.test?.test_date ? new Date(test.test?.test_date).getTime() : 0
    },
    {
      key: 'Test.location',
      label: t('tests.location'),
      cellClassName: 'text-center',
      render: (test) => test.test?.location || "-",
      sortValue: (test) => test.test?.location || ''
    },
    {
      key: 'modified_at',
      label: t('common.modifiedAt'),
      cellClassName: 'text-center',
      render: (test) => test.modified_at
        ? new Date(test.modified_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : t('common.unknown'),
      sortValue: (test) => test.modified_at ? new Date(test.modified_at).getTime() : 0
    },
    {
      key: 'actions',
      label: t('common.actions'),
      style: { width: hasEditRights ? '210px' : '80px' },
      cellClassName: 'text-center',
      sortable: false,
      render: (test) => (
        <ActionButtons
          itemId={test.id}
          onView={(e, id) => {
            openDetailModal(test);
          }}
          onEdit={hasEditRights ? (e, id) => {
            openEditModal(test);
          } : undefined}
          onDelete={hasEditRights ? (e, id) => {
            handleDeleteTest(id);
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
            {t('tests.title')}
          </h2>        </div>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={() => openCreateModal()}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('tests.new')}
          </Button>
        )}
      </div>

      {/* Barre de recherche */}
      <Row className="mb-3">
        <Col md={6}>
          <SearchInput
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder={t('tests.searchPlaceholder', 'Rechercher un test...')}
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
                ? t('tests.noResultsFound', 'Aucun test trouvé')
                : t('tests.noTests')
              }
            </h4>
            <p className="text-muted">
              {searchQuery 
                ? t('tests.tryDifferentSearch', 'Essayez une recherche différente')
                : t('tests.clickToAdd')
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
            title={t('tests.new')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>
        <Modal.Body>
          <TestForm
            ref={testFormRef}
            partId={partId}
            onClose={closeCreateModal}
            onTestCreated={handleItemCreated}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un essai */}
      <Modal
        show={showEditForm}
        onHide={() => handleRequestClose('edit', testFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('tests.edit')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={false}
          />
        </Modal.Header>        <Modal.Body>
          {selectedTest && (
            <TestForm
              ref={testFormRef}
              test={selectedTest}
              partId={partId}
              onClose={() => {
                // Appeler directement closeEditModal au lieu de handleRequestClose
                // pour éviter la boucle infinie
                closeEditModal();
              }}
              onTestUpdated={handleItemUpdated}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails - utilise TestForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={() => handleRequestClose('detail', testFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={t('tests.details')}
            onCopy={handleCopy}
            onPaste={handlePaste}
            viewMode={true}
          />
        </Modal.Header>
        <Modal.Body>
          {selectedTest && (
            <TestForm
              test={selectedTest}
              partId={partId}
              onClose={closeDetailModal}
              viewMode={true} // Active le mode lecture seule
            />
          )}
        </Modal.Body>      </Modal>
    </>
  );
};

export default TestList;
