import React, { useState, useContext, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faTrash, faEdit, faArrowLeft, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../context/AuthContext';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import OrderForm from './OrderForm';
import orderService from '../../../services/orderService';
import '../../../styles/dataList.css';

const OrderList = () => {
  const { t } = useTranslation();
  const { navigateToLevel, navigateBack, hierarchyState } = useNavigation();
  const { data, loading, error, updateItemStatus, refreshData } = useHierarchy();
  const { user } = useContext(AuthContext);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const orderFormRef = useRef(null);

  // Vérifier si l'utilisateur a les droits d'édition
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

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

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditForm(true);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(t('orders.confirmDelete'))) {
      try {
        await orderService.deleteOrder(orderId);
        alert(t('orders.deleteSuccess'));
        refreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression de la commande:', err);
        alert(err.response?.data?.message || t('orders.deleteError'));
      }
    }
  };

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
            <FontAwesomeIcon icon={faFileInvoice} className="mr-2 text-danger" />
            {t('orders.title')} - {hierarchyState.clientName}
          </h2>
        </div>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={() => setShowCreateForm(true)}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('orders.add')}
          </Button>
        )}
      </div>

      {data.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '30%' }}>{t('orders.reference')}</th>
                <th className="text-center">{t('orders.commercial')}</th>
                <th className="text-center">{t('orders.date')}</th>
                <th className="text-center">{t('common.modifiedAt')}</th>
                <th className="text-center" style={{ width: hasEditRights ? '150px' : '80px' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map(order => (
                <tr key={order.id}>
                  <td>
                    <div
                      onClick={() => handleOrderClick(order)}
                      style={{ cursor: 'pointer' }}
                      className="d-flex align-items-center"
                    >
                      <div className="item-name font-weight-bold text-primary">
                        {order.name || t('orders.noReference')}
                      </div>
                      <div className="ml-2">
                        <StatusBadge status={order.data_status} />
                      </div>
                    </div>
                  </td>
                  <td className="text-center">{order.Order?.commercial || "-"}</td>
                  <td className="text-center">
                    {order.Order?.order_date
                      ? new Date(order.Order?.order_date).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                      : t('common.unknown')}
                  </td>
                  <td className="text-center">
                    {order.modified_at
                      ? new Date(order.modified_at).toLocaleString('fr-FR', {
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
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(order);
                        }}
                        title={t('common.view')}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </Button>
                      {hasEditRights && (
                        <>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order);
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
                              handleDeleteOrder(order.id);
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
            <FontAwesomeIcon icon={faFileInvoice} size="3x" className="text-secondary mb-3" />
            <h4>{t('orders.noOrdersFound')}</h4>
            <p className="text-muted">{t('orders.clickToAddOrder')}</p>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer une commande */}
      <Modal
        show={showCreateForm}
        onHide={() => {
          if (orderFormRef.current && orderFormRef.current.handleCloseRequest) {
            orderFormRef.current.handleCloseRequest();
          } else {
            setShowCreateForm(false);
          }
        }}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('orders.add')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OrderForm
            ref={orderFormRef}
            clientId={hierarchyState.clientId}
            onClose={() => setShowCreateForm(false)}
            onOrderCreated={() => refreshData()}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer une commande */}
      <Modal
        show={showEditForm}
        onHide={() => {
          if (orderFormRef.current && orderFormRef.current.handleCloseRequest) {
            orderFormRef.current.handleCloseRequest();
          } else {
            setShowEditForm(false);
          }
        }}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('orders.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <OrderForm
              ref={orderFormRef}
              order={selectedOrder}
              clientId={hierarchyState.clientId}
              onClose={() => setShowEditForm(false)}
              onOrderUpdated={() => refreshData()}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails - utilise OrderForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('orders.details')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <OrderForm
              order={selectedOrder}
              clientId={hierarchyState.clientId}
              onClose={() => setShowDetailModal(false)}
              viewMode={true} // Active le mode lecture seule
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrderList;
