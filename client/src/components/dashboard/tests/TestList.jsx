import React, { useState } from 'react';
import { Table, Button, Dropdown, DropdownButton, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEllipsisV, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { AuthContext } from '../../../context/AuthContext';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import TestForm from './TestForm';
import TestDetails from './TestDetails';

const TestList = ({ partId }) => {
  const { navigateToLevel } = useNavigation();
  const { data, loading, error, updateItemStatus, totalItems } = useHierarchy('tests', partId);
  const { user } = React.useContext(AuthContext);
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

  if (loading) return <Spinner animation="border" role="status" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h2>Tests</h2>
        <Button
          variant="outline-warning"
          onClick={() => setShowCreateForm(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" /> Nouvel essai
        </Button>
      </div>

      {data.length > 0 ? (
        <Table hover>
          <thead className="bg-warning">
            <tr>
              <th className="text-center">Code d'essai</th>
              <th className="text-center">Date</th>
              <th className="text-center">Lieu</th>
              <th className="text-center">Modifié le</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(test => (
              <tr key={test.id}>
                <td>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditTest(test);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {test.name || "Sans nom"}
                    <StatusBadge status={test.data_status} />
                  </a>
                </td>
                <td className="text-center">{test.test_date || "Pas encore réalisé"}</td>
                <td className="text-center">{test.location || ""}</td>
                <td className="text-center">{test.modified_at || "Inconnu"}</td>
                <td className="text-center align-middle">
                  <DropdownButton
                    size="sm"
                    variant="outline-secondary"
                    title={<FontAwesomeIcon icon={faEllipsisV} />}
                    id={`dropdown-test-${test.id}`}
                  >
                    <Dropdown.Item
                      onClick={() => handleViewDetails(test)}
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" /> Détails
                    </Dropdown.Item>
                    {hasEditRights && (
                      <Dropdown.Item
                        onClick={() => handleEditTest(test)}
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" /> Modifier
                      </Dropdown.Item>
                    )}
                  </DropdownButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="warning">Aucun essai trouvé pour cette pièce.</Alert>
      )}

      {/* Modal pour créer un essai */}
      <Modal
        show={showCreateForm}
        onHide={() => setShowCreateForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
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
        <Modal.Header closeButton>
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
        <Modal.Header closeButton>
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