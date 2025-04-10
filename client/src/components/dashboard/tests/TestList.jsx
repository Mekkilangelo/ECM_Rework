import React, { useState, useContext, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faArrowLeft, faFlask, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { AuthContext } from '../../../context/AuthContext';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import TestForm from './TestForm';
//import TestDetails from './TestDetails';
import '../../../styles/dataList.css';

const TestList = ({ partId }) => {
  const { navigateBack } = useNavigation();
  const { data, loading, error, updateItemStatus, refreshData, deleteItem } = useHierarchy();
  const { user } = useContext(AuthContext);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const testFormRef = useRef(null)

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
  
  const handleDeleteTest = (test) => {
    setSelectedTest(test);
    setShowDeleteConfirmation(true);
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

  if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /></div>;
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
            Tests
          </h2>
        </div>
        <Button
          variant="danger"
          onClick={() => setShowCreateForm(true)}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Nouvel essai
        </Button>
      </div>

      {data.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '30%' }}>Code d'essai</th>
                <th className="text-center">Date</th>
                <th className="text-center">Lieu</th>
                <th className="text-center">Modifié le</th>
                <th className="text-center" style={{ width: hasEditRights ? '180px' : '80px' }}>Actions</th>
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
                        {test.name || "Sans nom"}
                      </div>
                      <div className="ml-2">
                        <StatusBadge status={test.data_status} />
                      </div>
                    </div>
                  </td>
                  <td className="text-center">{test.Test?.test_date || "Pas encore réalisé"}</td>
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
                      : "Inconnu"}
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
                          title="Détails"
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
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTest(test);
                            }}
                            title="Supprimer"
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
            <h4>Aucun essai trouvé pour cette pièce</h4>
            <p className="text-muted">Cliquez sur "Nouvel essai" pour en ajouter un</p>
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
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Nouvel essai</Modal.Title>
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
          // On utilise maintenant handleCloseRequest au lieu de fermer directement
          if (testFormRef.current && testFormRef.current.handleCloseRequest) {
            testFormRef.current.handleCloseRequest();
          } else {
            setShowEditForm(false);
          }
        }}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Modifier l'essai</Modal.Title>
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
          <Modal.Title>Détails de l'essai</Modal.Title>
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
          <Modal.Title>Confirmer la suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Êtes-vous sûr de vouloir supprimer l'essai {selectedTest?.name} ?
          Cette action est irréversible.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirmation(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TestList;
