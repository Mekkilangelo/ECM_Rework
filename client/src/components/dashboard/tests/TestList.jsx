import React, { useState, useContext, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faArrowLeft, faFlask, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { AuthContext } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import TestForm from './TestForm';
//import TestDetails from './TestDetails';
import '../../../styles/dataList.css';
import testService from '../../../services/testService';

const TestList = ({ partId }) => {
  const { t } = useTranslation();
  const { navigateBack } = useNavigation();
  const { data, loading, error, updateItemStatus, refreshData, deleteItem } = useHierarchy();
  const { user } = useContext(AuthContext);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const testFormRef = useRef(null);

  const handleTestClick = (test) => {
    setSelectedTest(test);
    setShowEditForm(true);
    if (test.data_status === 'new') {
      updateItemStatus(test.id);
    }
  };

  const handleViewDetails = (test) => {
    setSelectedTest(test);
    setShowDetailModal(true);
  };

  const handleEditTest = (test) => {
    setSelectedTest(test);
    setShowEditForm(true);
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm(t('tests.deleteConfirmation'))) {
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

  const confirmDelete = async () => {
    try {
      await deleteItem(selectedTest.id);
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

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
            <FontAwesomeIcon icon={faFlask} className="mr-2 text-danger" />
            {t('tests.title')}
          </h2>
        </div>
        <Button
          variant="danger"
          onClick={() => setShowCreateForm(true)}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('tests.new')}
        </Button>
      </div>

      {data.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '30%' }}>{t('tests.testCode')}</th>
                <th className="text-center">{t('tests.date')}</th>
                <th className="text-center">{t('tests.location')}</th>
                <th className="text-center">{t('common.modifiedAt')}</th>
                <th className="text-center" style={{ width: hasEditRights ? '180px' : '80px' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map(test => (
                <tr key={test.id}>
                  <td>
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
                  </td>
                  <td className="text-center">{test.Test?.test_date || t('tests.notDoneYet')}</td>
                  <td className="text-center">{test.Test?.location || "-"}</td>
                  <td className="text-center">
                    {test.modified_at
                      ? new Date(test.modified_at).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : t('common.unknown')}
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center">
                      {!hasEditRights && (
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(test);
                          }}
                          title={t('common.view')}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      )}

                      {hasEditRights && (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTest(test);
                            }}
                            title={t('common.edit')}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTest(test.id);
                            }}
                            title={t('common.delete')}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card className="text-center p-5 bg-light">
          <Card.Body>
            <FontAwesomeIcon icon={faFlask} size="3x" className="text-secondary mb-3" />
            <h4>{t('tests.noTests')}</h4>
            <p className="text-muted">{t('tests.clickToAdd')}</p>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer un essai */}
      <Modal
        show={showCreateForm}
        onHide={() => {
          // On utilise maintenant handleCloseRequest au lieu de fermer directement
          if (testFormRef.current && testFormRef.current.handleCloseRequest) {
            testFormRef.current.handleCloseRequest();
          } else {
            setShowCreateForm(false);
          }
        }}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('tests.new')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TestForm
            ref={testFormRef}
            partId={partId}
            onClose={() => setShowCreateForm(false)}
            onTestCreated={() => refreshData()}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un essai */}
      <Modal
        show={showEditForm}
        onHide={() => {
          if (testFormRef.current && testFormRef.current.handleCloseRequest) {
            testFormRef.current.handleCloseRequest();
          } else {
            setShowEditForm(false);
          }
        }}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('tests.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTest && (
            <TestForm
              ref={testFormRef}
              test={selectedTest}
              partId={partId}
              onClose={() => setShowEditForm(false)}
              onTestUpdated={() => refreshData()}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails */}
      {/* <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('tests.details')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTest && (
            <TestDetails
              testId={selectedTest.id}
              partId={partId}
              onClose={() => setShowDetailModal(false)}
            />
          )}
        </Modal.Body>
      </Modal> */}

      {/* Modal de confirmation de suppression */}
      <Modal
        show={showDeleteConfirmation}
        onHide={() => setShowDeleteConfirmation(false)}
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('tests.confirmDelete')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {t('tests.deleteMessage', { name: selectedTest?.name })}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirmation(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            {t('common.delete')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TestList;
