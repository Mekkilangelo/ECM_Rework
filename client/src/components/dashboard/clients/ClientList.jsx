import React, { useState, useContext } from 'react';
import { Table, Button, Dropdown, DropdownButton, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEllipsisV, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { AuthContext } from '../../../context/AuthContext'; 
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import ClientForm from './ClientForm';
import ClientDetails from './ClientDetails';
import clientService from '../../../services/clientService';

const ClientList = () => {
  const { navigateToLevel } = useNavigation();
  const { data, loading, error, updateItemStatus, refreshData } = useHierarchy();
  const { user } = useContext(AuthContext); // Récupérer l'utilisateur connecté
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Vérifier si l'utilisateur a les droits d'édition
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');
  
  const handleClientClick = (client) => {
    if (client.data_status === 'new') {
      updateItemStatus(client.id);
    }
    navigateToLevel('order', client.id, client.name);
  };
  
  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setShowDetailModal(true);
  };
  
  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowEditForm(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.")) {
      try {
        await clientService.deleteClient(clientId);
        alert("Client supprimé avec succès");
        // Rafraîchir les données
        refreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression du client:', err);
        alert(err.response?.data?.message || "Une erreur est survenue lors de la suppression du client");
      }
    }
  };
  
  
  if (loading) return <Spinner animation="border" role="status" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  
  return (
    <>
      <div className="d-flex justify-content-between mb-3">
        <h2>Clients</h2>
        <Button 
          variant="outline-danger" 
          onClick={() => setShowCreateForm(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" /> Nouveau client
        </Button>
      </div>
      
      {data.length > 0 ? (
        <Table hover>
          <thead className="bg-warning">
            <tr>
              <th>Client</th>
              <th className="text-center">Groupe</th>
              <th className="text-center">Pays</th>
              <th className="text-center">Ville</th>
              <th className="text-center">Modifié le</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(client => (
              <tr key={client.id}>
                <td>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleClientClick(client);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {client.name || "Sans nom"}
                    <StatusBadge status={client.data_status} />
                  </a>
                </td>
                <td className="text-center">{client.client_group || "Inconnu"}</td>
                <td className="text-center">{client.country || "Inconnu"}</td>
                <td className="text-center">{client.city || "Inconnu"}</td>
                <td className="text-center">{client.modified_at || "Inconnu"}</td>
                <td className="text-center align-middle">
                  <DropdownButton
                    size="sm"
                    variant="outline-secondary"
                    title={<FontAwesomeIcon icon={faEllipsisV} />}
                    id={`dropdown-client-${client.id}`}
                  >
                    <Dropdown.Item 
                      onClick={() => handleViewDetails(client)}
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" /> Détails
                    </Dropdown.Item>
                    {hasEditRights && (
                      <Dropdown.Item 
                        onClick={() => handleEditClient(client)}
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" /> Modifier
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item 
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-2" /> Delete
                    </Dropdown.Item>
                  </DropdownButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="warning">Aucun client trouvé.</Alert>
      )}
      
      {/* Modal pour créer un client */}
      <Modal 
        show={showCreateForm} 
        onHide={() => setShowCreateForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nouveau client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ClientForm 
            onClose={() => setShowCreateForm(false)} 
            onClientCreated={() => refreshData()}
          />
        </Modal.Body>
      </Modal>
      
      {/* Modal pour éditer un client */}
      <Modal 
        show={showEditForm} 
        onHide={() => setShowEditForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Modifier le client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <ClientForm 
              client={selectedClient}
              onClose={() => setShowEditForm(false)} 
              onClientUpdated={() => refreshData()}
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
          <Modal.Title>Détails du client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <ClientDetails 
              clientId={selectedClient.id} 
              onClose={() => setShowDetailModal(false)} 
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ClientList;