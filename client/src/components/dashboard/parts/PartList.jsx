import React, { useState } from 'react';
import { Table, Button, Dropdown, DropdownButton, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEllipsisV, faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import PartForm from './PartForm';
import PartDetails from './PartDetails';

const PartList = ({ orderId }) => {
  const { navigateToLevel, navigateBack, hierarchyState } = useNavigation();
  const { data, loading, error, updateItemStatus } = useHierarchy();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  
  const handlePartClick = (part) => {
    if (part.data_status === 'new') {
      updateItemStatus(part.id);
    }
    navigateToLevel('test', part.id, part.name);
  };
  
  const handleViewDetails = (part) => {
    setSelectedPart(part);
    setShowDetailModal(true);
  };
  
  if (loading) return <Spinner animation="border" role="status" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  
  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <div>
          <Button 
            variant="outline-secondary" 
            className="mr-2"
            onClick={navigateBack}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Retour
          </Button>
          <h2 className="d-inline-block">Parts - {hierarchyState.orderName}</h2>
        </div>
        <Button 
          variant="outline-danger" 
          onClick={() => setShowCreateForm(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" /> Nouvelle pièce
        </Button>
      </div>
      
      {data.length > 0 ? (
        <Table hover>
          <thead className="bg-warning">
            <tr>
              <th>Nom de la pièce</th>
              <th className="text-center">Désignation</th>
              <th className="text-center">Acier</th>
              <th className="text-center">Modifié le</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(part => (
              <tr key={part.id}>
                <td>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handlePartClick(part);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {part.name || "Référence Inconnue"}
                    <StatusBadge status={part.data_status} />
                  </a>
                </td>
                <td className="text-center">{part.designation || ""}</td>
                <td className="text-center">{part.steel || ""}</td>
                <td className="text-center">{part.modified_at || "Inconnu"}</td>
                <td className="text-center align-middle">
                  <DropdownButton
                    size="sm"
                    variant="outline-secondary"
                    title={<FontAwesomeIcon icon={faEllipsisV} />}
                    id={`dropdown-part-${part.id}`}
                  >
                    <Dropdown.Item 
                      onClick={() => handleViewDetails(part)}
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" /> Détails
                    </Dropdown.Item>
                  </DropdownButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="warning">Aucune pièce trouvée pour cette commande.</Alert>
      )}
      
      {/* Modal pour créer une pièce */}
      <Modal 
        show={showCreateForm} 
        onHide={() => setShowCreateForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle pièce</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PartForm orderId={orderId} onClose={() => setShowCreateForm(false)} />
        </Modal.Body>
      </Modal>
      
      {/* Modal pour voir les détails */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Détails de la pièce</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPart && (
            <PartDetails 
              partId={selectedPart.id} 
              orderId={orderId}
              onClose={() => setShowDetailModal(false)} 
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PartList;