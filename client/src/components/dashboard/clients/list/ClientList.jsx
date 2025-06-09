import React, { useContext, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../../context/NavigationContext';
import { useHierarchy } from '../../../../hooks/useHierarchy';
import { AuthContext } from '../../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../../common/StatusBadge/StatusBadge';
import ActionButtons from '../../../common/ActionButtons';
import ClientForm from '../form/ClientForm';
import clientService from '../../../../services/clientService';
import '../../../../styles/dataList.css';
import PropTypes from 'prop-types';
import useModalState from '../../../../hooks/useModalState';

const ClientList = ({ onDataChanged }) => {
  const { t } = useTranslation();
  const { navigateToLevel } = useNavigation();
  const { data, loading, error, updateItemStatus, refreshData } = useHierarchy();
  const { user } = useContext(AuthContext);
  const clientFormRef = useRef(null);

  // Fonction de rafraîchissement améliorée qui met à jour également le total
  const handleRefreshData = async () => {
    await refreshData();
    // Utiliser la fonction de rappel pour mettre à jour le total si elle est fournie
    if (onDataChanged) {
      onDataChanged();
    }
  };

  // Utilisation du hook useModalState pour gérer les modales
  const {
    showCreateModal: showCreateForm,
    showEditModal: showEditForm,
    showDetailModal,
    selectedItem: selectedClient,
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
    onRefreshData: handleRefreshData
  });

  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');
  const isUserRole = user && user.role === 'user';

  const handleClientClick = (client) => {
    if (client.data_status === 'new') {
      updateItemStatus(client.id);
    }
    navigateToLevel('order', client.id, client.name);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm(t('clients.confirmDelete'))) {
      try {
        await clientService.deleteClient(clientId);
        alert(t('clients.deleteSuccess'));
        // Utiliser la fonction améliorée pour également mettre à jour le total
        handleRefreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression du client:', err);
        alert(err.response?.data?.message || t('clients.deleteError'));
      }
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <>      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          {t('clients.title')}
        </h2>
        {hasEditRights && (
          <Button
            variant="danger"
            onClick={openCreateModal}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('clients.add')}
          </Button>
        )}
      </div>

      {data.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '30%' }}>{t('clients.name')}</th>
                <th className="text-center">{t('clients.group')}</th>
                <th className="text-center">{t('clients.country')}</th>
                <th className="text-center">{t('clients.city')}</th>
                <th className="text-center">{t('common.modifiedAt')}</th>
                <th className="text-center" style={{ width: '150px' }}>{t('common.actions')}</th>
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
                        {client.name || t('clients.noName')}
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
                      : t('common.unknown')}
                  </td>
                  <td className="text-center">
                    <ActionButtons
                      itemId={client.id}
                      onView={(e, id) => {
                        openDetailModal(client);
                      }}
                      onEdit={hasEditRights ? (e, id) => {
                        openEditModal(client);
                      } : undefined}
                      onDelete={hasEditRights ? (e, id) => {
                        handleDeleteClient(client.id);
                      } : undefined}
                      hasEditRights={hasEditRights}
                      labels={{
                        view: t('common.view'),
                        edit: t('common.edit'),
                        delete: t('common.delete')
                      }}
                    />
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
            <h4>{t('clients.noClientsFound')}</h4>
            <p className="text-muted">{t('clients.clickToAddClient')}</p>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer un client */}
      <Modal
        show={showCreateForm}
        onHide={() => handleRequestClose('create', clientFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('clients.add')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ClientForm
            ref={clientFormRef}
            onClose={() => {
              // Appeler directement closeCreateModal au lieu de handleRequestClose
              // pour éviter la boucle infinie
              closeCreateModal();
            }}
            onClientCreated={handleItemCreated}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer un client */}
      <Modal
        show={showEditForm}
        onHide={() => handleRequestClose('edit', clientFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('clients.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <ClientForm
              ref={clientFormRef}
              client={selectedClient}
              onClose={() => {
                // Appeler directement closeEditModal au lieu de handleRequestClose
                // pour éviter la boucle infinie
                closeEditModal();
              }}
              onClientUpdated={handleItemUpdated}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails - utilise maintenant ClientForm en mode lecture seule */}
      <Modal
        show={showDetailModal}
        onHide={() => handleRequestClose('detail', clientFormRef)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('clients.details')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <ClientForm
              client={selectedClient}
              onClose={() => {
                // Appeler directement closeDetailModal au lieu de handleRequestClose
                // pour éviter la boucle infinie
                closeDetailModal();
              }}
              viewMode={true} // Nouveau prop pour activer le mode lecture seule
            />
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

ClientList.propTypes = {
  onDataChanged: PropTypes.func
};

export default ClientList;
