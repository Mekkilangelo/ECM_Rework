import React, { useState, useContext } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEdit, faArrowLeft, faFlask } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { AuthContext } from '../../../context/AuthContext';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import TestForm from './TestForm';
import TestDetails from './TestDetails';
import '../../../styles/dataList.css';

const TestList = ({ partId }) => {
  const { navigateBack } = useNavigation();
  const { data, loading, error, updateItemStatus, totalItems } = useHierarchy('tests', partId);
  const { user } = useContext(AuthContext);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  const nextTestNumber = data ? data.length + 1 : 1;
  const nextTestName = `TRIAL - ${nextTestNumber}`;

  const handleTestClick = (test) => {
    setSelectedTest(test);
    setShowDetailModal(true);

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
                <th className="text-center" style={{ width: hasEditRights ? '150px' : '80px' }}>Actions</th>
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
                  <td className="text-center">{test.test_date || "Pas encore réalisé"}</td>
                  <td className="text-center">{test.location || "-"}</td>
                  <td className="text-center">{test.modified_at || "Inconnu"}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center">
                      <Button 
                        variant="outline-info" 
                        size="sm" 
                        className="mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(test);
                        }}
                        title="Détails"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      
                      {hasEditRights && (
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTest(test);
                          }}
                          title="Modifier"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
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
        onHide={() => setShowCreateForm(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Nouvel essai</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TestForm
            partId={partId}
            nextTestName={nextTestName}
            onClose={() => setShowCreateForm(false)}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un essai */}
      <Modal
        show={showEditForm}
        onHide={() => setShowEditForm(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Modifier l'essai</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTest && (
            <TestForm
              test={selectedTest}
              partId={partId}
              onClose={() => setShowEditForm(false)}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails */}
      <Modal
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
      </Modal>
    </>
  );
};

export default TestList;
