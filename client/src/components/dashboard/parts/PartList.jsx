import React, { useState, useContext, useRef } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faTrash, faEdit, faArrowLeft, faCog } from '@fortawesome/free-solid-svg-icons';
import { useNavigation } from '../../../context/NavigationContext';
import { useHierarchy } from '../../../hooks/useHierarchy';
import { AuthContext } from '../../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import StatusBadge from '../../common/StatusBadge/StatusBadge';
import PartForm from './PartForm';
//import PartDetails from './PartDetails';
import partService from '../../../services/partService';
import '../../../styles/dataList.css';

const PartList = ({ orderId }) => {
  const { t } = useTranslation();
  const { navigateToLevel, navigateBack, hierarchyState } = useNavigation();
  const { data, loading, error, updateItemStatus, refreshData } = useHierarchy();
  const { user } = useContext(AuthContext);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);
  const partFormRef = useRef(null);

  // Vérifier si l'utilisateur a les droits d'édition
  const hasEditRights = user && (user.role === 'admin' || user.role === 'superuser');

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

  const handleEditPart = (part) => {
    setSelectedPart(part);
    setShowEditForm(true);
  };

  const handleDeletePart = async (partId) => {
    if (window.confirm(t('parts.deleteConfirmation'))) {
      try {
        await partService.deletePart(partId);
        alert(t('parts.deleteSuccess'));
        refreshData();
      } catch (err) {
        console.error('Erreur lors de la suppression de la pièce:', err);
        alert(err.response?.data?.message || t('parts.deleteError'));
      }
    }
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" variant="danger" /><div>{t('common.loading')}</div></div>;
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
            <FontAwesomeIcon icon={faCog} className="mr-2 text-danger" />
            {t('parts.title')} - {hierarchyState.orderName}
          </h2>
        </div>
        <Button
          variant="danger"
          onClick={() => setShowCreateForm(true)}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> {t('parts.new')}
        </Button>
      </div>

      {data.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '10%' }}>{t('parts.designation')}</th>
                <th className="text-center">{t('parts.clientDesignation')}</th>
                <th className="text-center">{t('parts.reference')}</th>
                <th className="text-center">{t('parts.steel.title')}</th>
                <th className="text-center">{t('common.modifiedAt')}</th>
                <th className="text-center" style={{ width: hasEditRights ? '150px' : '80px' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map(part => (
                <tr key={part.id}>
                  <td>
                    <div
                      onClick={() => handlePartClick(part)}
                      style={{ cursor: 'pointer' }}
                      className="d-flex align-items-center"
                    >
                      <div className="item-name font-weight-bold text-primary">
                        {part.name || t('common.unknown')}
                      </div>
                      <div className="ml-2">
                        <StatusBadge status={part.data_status} />
                      </div>
                    </div>
                  </td>
                  <td className="text-center">{part.Part?.client_designation || "-"}</td>
                  <td className="text-center">{part.Part?.reference || "-"}</td>
                  <td className="text-center">{part.Part?.steel || "-"}</td>
                  <td className="text-center">
                    {part.modified_at
                      ? new Date(part.modified_at).toLocaleString('fr-FR', {
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
                      {!hasEditRights && (
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(part);
                          }}
                          title={t('common.view')}
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
                              handleEditPart(part);
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
                              handleDeletePart(part.id);
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
            <FontAwesomeIcon icon={faCog} size="3x" className="text-secondary mb-3" />
            <h4>{t('parts.noParts')}</h4>
            <p className="text-muted">{t('parts.clickToAdd')}</p>
          </Card.Body>
        </Card>
      )}

      {/* Modal pour créer une pièce */}
      <Modal
        show={showCreateForm}
        onHide={() => {
          if (partFormRef.current && partFormRef.current.handleCloseRequest) {
            partFormRef.current.handleCloseRequest();
          } else {
            setShowCreateForm(false);
          }
        }}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('parts.new')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <PartForm
            ref={partFormRef}
            orderId={orderId}
            onClose={() => setShowCreateForm(false)}
            onPartCreated={() => refreshData()}
          />
        </Modal.Body>
      </Modal>

      {/* Modal pour éditer une pièce */}
      <Modal
        show={showEditForm}
        onHide={() => {
          if (partFormRef.current && partFormRef.current.handleCloseRequest) {
            partFormRef.current.handleCloseRequest();
          } else {
            setShowCreateForm(false);
          }
        }}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('parts.edit')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPart && (
            <PartForm
              ref={partFormRef}
              part={selectedPart}
              orderId={orderId}
              onClose={() => setShowEditForm(false)}
              onPartUpdated={() => refreshData()}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir les détails */}
      {/* <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>{t('parts.details')}</Modal.Title>
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
      </Modal> */}
    </>
  );
};

export default PartList;
