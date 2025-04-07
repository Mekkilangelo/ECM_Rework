import React, { useState, useContext, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card, Badge, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faTrash, faEdit, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { AuthContext } from '../../../context/AuthContext'; 
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import ClientForm from './ClientForm';
import ClientDetails from './ClientDetails';
import clientService from '../../../services/clientService';
import '../../../styles/dataList.css';


const ClientList = () => {
  const { navigateToLevel } = useNavigation();
  const { data, loading, error, updateItemStatus, refreshData } = useHierarchy();
  const { user } = useContext(AuthContext);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const clientFormRef = useRef(null);
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');
  const isUserRole = user && user.role === 'user';
  
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
        refreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression du client:', err);
        alert(err.response?.data?.message || "Une erreur est survenue lors de la suppression du client");
      }
    }
  };
  
  if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <FontAwesomeIcon icon={faBuilding} className="mr-2 text-danger" />
          Clients
        </h2>
        <Button 
          variant="danger" 
          onClick={() => setShowCreateForm(true)}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Nouveau client
        </Button>
      </div>
      
      {data.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '30%' }}>Client</th>
                <th className="text-center">Groupe</th>
                <th className="text-center">Pays</th>
                <th className="text-center">Ville</th>
                <th className="text-center">Modifié le</th>
                <th className="text-center" style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(client => (
                <tr key={client.id}>
                  <td>
                    <div 
                      onClick={() => handleClientClick(client)}
                      style={{ cursor: 'pointer' }}
                      className="d-flex align-items-center"
                    >
                      <div className="item-name font-weight-bold text-primary">
                        {client.name || "Sans nom"}
                      </div>
                      <div className="ml-2">
                        <StatusBadge status={client.data_status} />
                      </div>
                    </div>
                  </td>
                  <td className="text-center">{client.Client?.client_group || "-"}</td>
                  <td className="text-center">{client.Client?.country || "-"}</td>
                  <td className="text-center">{client.Client?.city || "-"}</td>
                  <td className="text-center">
                    {client.modified_at 
                      ? new Date(client.modified_at).toLocaleString('fr-FR', {
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
                      {isUserRole && (
                        <Button 
                          variant="outline-info" 
                          size="sm" 
                          className="mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(client);
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
                              handleEditClient(client);
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
                              handleDeleteClient(client.id);
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
            <FontAwesomeIcon icon={faBuilding} size="3x" className="text-secondary mb-3" />
            <h4>Aucun client trouvé</h4>
            <p className="text-muted">Cliquez sur "Nouveau client" pour ajouter un client</p>
          </Card.Body>
        </Card>
      )}
      
      {/* Modal pour créer un client */}
      <Modal 
        show={showCreateForm} 
        onHide={() => {
          // On utilise maintenant handleCloseRequest au lieu de fermer directement
          if (clientFormRef.current && clientFormRef.current.handleCloseRequest) {
            clientFormRef.current.handleCloseRequest();
          } else {
            setShowCreateForm(false);
          }
        }}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Nouveau client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ClientForm
            ref={clientFormRef} 
            onClose={() => setShowCreateForm(false)} 
            onClientCreated={() => refreshData()}
          />
        </Modal.Body>
      </Modal>
      
      {/* Modal pour éditer un client */}
      <Modal 
        show={showEditForm} 
        onHide={() => {
          // On utilise maintenant handleCloseRequest au lieu de fermer directement
          if (clientFormRef.current && clientFormRef.current.handleCloseRequest) {
            clientFormRef.current.handleCloseRequest();
          } else {
            setShowCreateForm(false);
          }
        }}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Modifier le client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <ClientForm 
              ref={clientFormRef}
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
        <Modal.Header closeButton className="bg-light">
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
