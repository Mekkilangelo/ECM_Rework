import React, { useContext, useRef } from 'react';
import { Button, Spinner, Alert, Modal, Card, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../../context/NavigationContext';
import { useHierarchy } from '../../../../hooks/useHierarchy';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../../context/AuthContext';
import StatusBadge from '../../../common/StatusBadge/StatusBadge';
import ActionButtons from '../../../common/ActionButtons';
import SortableTable from '../../../common/SortableTable';
import SearchInput from '../../../common/SearchInput/SearchInput';
import OrderForm from '../form/OrderForm';
import orderService from '../../../../services/orderService';
import '../../../../styles/dataList.css';
import useModalState from '../../../../hooks/useModalState';
import useConfirmationDialog from '../../../../hooks/useConfirmationDialog';

const OrderList = () => {
  const { t } = useTranslation();  const { navigateToLevel, navigateBack, hierarchyState } = useNavigation();
  const { 
    data, 
    loading, 
    error, 
    updateItemStatus, 
    refreshData, 
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
  const orderFormRef = useRef(null);

  // Utilisation du hook useModalState pour gérer les modales
  const {
    showCreateModal: showCreateForm,
    showEditModal: showEditForm,
    showDetailModal,
    selectedItem: selectedOrder,
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
  // Vérifier si l'utilisateur a les droits d'édition
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

  // Configuration des colonnes pour la table triable
  const columns = [
    {
      key: 'name',
      label: t('orders.reference'),
      style: { width: '30%' },
      render: (order) => (
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
      ),
      sortValue: (order) => order.name || ''
    },
    {
      key: 'Order.commercial',
      label: t('orders.commercial'),
      cellClassName: 'text-center',
      render: (order) => order.Order?.commercial || "-",
      sortValue: (order) => order.Order?.commercial || ''
    },
    {
      key: 'Order.order_date',
      label: t('orders.date'),
      cellClassName: 'text-center',
      render: (order) => order.Order?.order_date
        ? new Date(order.Order?.order_date).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        : t('common.unknown'),
      sortValue: (order) => order.Order?.order_date ? new Date(order.Order?.order_date).getTime() : 0
    },
    {
      key: 'modified_at',
      label: t('common.modifiedAt'),
      cellClassName: 'text-center',
      render: (order) => order.modified_at
        ? new Date(order.modified_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : t('common.unknown'),
      sortValue: (order) => order.modified_at ? new Date(order.modified_at).getTime() : 0
    },
    {
      key: 'actions',
      label: t('common.actions'),
      style: { width: hasEditRights ? '150px' : '80px' },
      cellClassName: 'text-center',
      sortable: false,
      render: (order) => (
        <ActionButtons
          itemId={order.id}
          onView={(e, id) => {
            openDetailModal(order);
          }}
          onEdit={hasEditRights ? (e, id) => {
            openEditModal(order);
          } : undefined}
          onDelete={hasEditRights ? (e, id) => {
            handleDeleteOrder(order.id);
          } : undefined}
          hasEditRights={hasEditRights}
          labels={{
            view: t('common.view'),
            edit: t('common.edit'),
            delete: t('common.delete')
          }}
        />
      )
    }
  ];

  const handleOrderClick = (order) => {
    if (order.data_status === 'new') {
      updateItemStatus(order.id);
    }
    navigateToLevel('part', order.id, order.name);
  };
  const handleDeleteOrder = async (orderId) => {
    const orderToDelete = data.find(o => o.id === orderId);
    const orderName = orderToDelete?.name || 'cette commande';
    
    const confirmed = await confirmDelete(orderName, 'la commande');
    if (confirmed) {
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
            onClick={openCreateModal}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('orders.add')}
          </Button>
        )}
      </div>

      {/* Barre de recherche */}
      <Row className="mb-3">
        <Col md={6}>
          <SearchInput
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder={t('orders.searchPlaceholder', 'Rechercher une commande...')}
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
            <FontAwesomeIcon icon={faFileInvoice} size="3x" className="text-secondary mb-3" />
            <h4>
              {searchQuery 
                ? t('orders.noResultsFound', 'Aucune commande trouvée')
                : t('orders.noOrdersFound')
              }
            </h4>
            <p className="text-muted">
              {searchQuery 
                ? t('orders.tryDifferentSearch', 'Essayez une recherche différente')
                : t('orders.clickToAddOrder')
              }
            </p>
          </Card.Body>
        </Card>
      )}{/* Modal pour créer une commande */}
      <Modal
        show={showCreateForm}
        onHide={() => handleRequestClose('create', orderFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('orders.add')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <OrderForm
            ref={orderFormRef}
            clientId={hierarchyState.clientId}
            onClose={closeCreateModal}
            onOrderCreated={handleItemCreated}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer une commande */}
      <Modal
        show={showEditForm}
        onHide={() => handleRequestClose('edit', orderFormRef)}
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
              onClose={closeEditModal}
              onOrderUpdated={handleItemUpdated}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails - utilise OrderForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={closeDetailModal}
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
              onClose={closeDetailModal}
              viewMode={true} // Active le mode lecture seule
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrderList;
