// client/src/components/dashboard/orders/OrderList.jsx
import React, { useState } from 'react';
import { Table, Button, Dropdown, DropdownButton, Spinner, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faEllipsisV, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import OrderForm from './OrderForm';
import OrderDetails from './OrderDetails';

const OrderList = () => {
  const { navigateToLevel, navigateBack, hierarchyState } = useNavigation();
  const { data, loading, error, updateItemStatus } = useHierarchy();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const handleOrderClick = (order) => {
    if (order.data_status === 'new') {
      updateItemStatus(order.id);
    }
    navigateToLevel('part', order.id, order.name);
  };
  
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
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
          <h2 className="d-inline-block">Commandes - {hierarchyState.clientName}</h2>
        </div>
        <Button 
          variant="outline-danger" 
          onClick={() => setShowCreateForm(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-1" /> Nouvelle commande
        </Button>
      </div>
      
      {data.length > 0 ? (
        <Table hover>
          <thead className="bg-warning">
            <tr>
              <th>Référence</th>
              <th className="text-center">Contact</th>
              <th className="text-center">Date</th>
              <th className="text-center">Statut</th>
              <th className="text-center">Modifié le</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(order => (
              <tr key={order.id}>
                <td>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleOrderClick(order);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {order.name || "Sans référence"}
                    <StatusBadge status={order.data_status} />
                  </a>
                </td>
                <td className="text-center">{order.contact_name || "Inconnu"}</td>
                <td className="text-center">{order.order_date || "Inconnu"}</td>
                <td className="text-center">{order.status || "Inconnu"}</td>
                <td className="text-center">{order.modified_at || "Inconnu"}</td>
                <td className="text-center align-middle">
                  <DropdownButton
                    size="sm"
                    variant="outline-secondary"
                    title={<FontAwesomeIcon icon={faEllipsisV} />}
                    id={`dropdown-order-${order.id}`}
                  >
                    <Dropdown.Item 
                      onClick={() => handleViewDetails(order)}
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
        <Alert variant="warning">Aucune commande trouvée.</Alert>
      )}
      
      {/* Modal pour créer une commande */}
      <Modal 
        show={showCreateForm} 
        onHide={() => setShowCreateForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle commande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OrderForm 
            clientId={hierarchyState.clientId} 
            onClose={() => setShowCreateForm(false)} 
          />
        </Modal.Body>
      </Modal>
      
      {/* Modal pour voir les détails */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Détails de la commande</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <OrderDetails 
              orderId={selectedOrder.id} 
              onClose={() => setShowDetailModal(false)} 
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrderList;