import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faList, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import referenceService from '../../services/referenceService';
import '../../styles/dataList.css';
import useConfirmationDialog from '../../hooks/useConfirmationDialog';
import DeleteWithUsageModal from '../common/DeleteWithUsageModal/DeleteWithUsageModal';

// Mapping des anciennes colonnes ENUM vers les nouvelles tables de référence
const ENUM_TO_REF_TABLE_MAPPING = {
  'parts.designation': 'ref_designation',
  'clients.country': 'ref_country',
  'trials.status': 'ref_status',
  'trials.location': 'ref_location',
  'trials.mounting_type': 'ref_mounting_type',
  'trials.position_type': 'ref_position_type',
  'trials.process_type': 'ref_process_type',
  'furnaces.furnace_type': 'ref_furnace_types',
  'furnaces.furnace_size': 'ref_furnace_sizes',
  'furnaces.heating_cell': 'ref_heating_cells',
  'furnaces.cooling_media': 'ref_cooling_media',
  'furnaces.quench_cell': 'ref_quench_cells',
  'steels.family': 'ref_steel_family',
  'steels.standard': 'ref_steel_standard',
  'files.category': 'ref_file_category',
  'files.subcategory': 'ref_file_subcategory',
  'units': 'ref_units'
};

const EnumTableContent = ({ table, column, refTable }) => {
  const { t } = useTranslation();
  const { confirmDelete } = useConfirmationDialog();
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'delete' (plus besoin de 'edit')
  const [currentValue, setCurrentValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [usageDetails, setUsageDetails] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [valueToDelete, setValueToDelete] = useState(null);

  // Déterminer la table de référence à utiliser
  const activeRefTable = useMemo(() => {
    if (refTable) return refTable;
    if (table && column) {
      const key = `${table}.${column}`;
      return ENUM_TO_REF_TABLE_MAPPING[key] || ENUM_TO_REF_TABLE_MAPPING[table];
    }
    return null;
  }, [refTable, table, column]);

  const fetchReferenceValues = useCallback(async () => {
    
    setLoading(true);
    try {
      const response = await referenceService.getValues(activeRefTable);
      
      
      // referenceService.getValues peut retourner:
      // - Tableau de strings pour les tables simples
      // - Tableau d'objets pour les tables complexes (ref_units, ref_unit_types)
      if (Array.isArray(response)) {
        setValues(response);
      } else {
        console.warn(`[EnumTableContent] Unexpected response format:`, response);
        setValues([]);
      }
      setError(null);
    } catch (err) {
      console.error('[EnumTableContent] Error fetching reference values:', err);
      setError('Failed to load values. Please try again.');
      setValues([]);
    } finally {
      setLoading(false);
    }
  }, [activeRefTable]);

  useEffect(() => {
    if (activeRefTable) {
      fetchReferenceValues();
    }
  }, [activeRefTable, fetchReferenceValues]);

  // S'abonner aux changements de la table pour re-render automatiquement
  useEffect(() => {
    if (!activeRefTable) return;

    const unsubscribe = referenceService.subscribe(activeRefTable, () => {
      fetchReferenceValues();
    });

    return unsubscribe;
  }, [activeRefTable, fetchReferenceValues]);

  const checkValueUsage = async (value) => {
    try {
      // Si value est un objet, extraire le nom
      const valueName = typeof value === 'object' ? value.name : value;
      const response = await referenceService.checkUsage(activeRefTable, valueName);
      setUsageDetails(response.details || []);
      return response.totalCount || 0;
    } catch (err) {
      console.error('Error checking value usage:', err);
      return 0;
    }
  };

  const handleDelete = async (value) => {
    // Extraire le nom si c'est un objet
    const valueName = typeof value === 'object' ? value.name : value;
    const count = await checkValueUsage(valueName);
    setUsageCount(count);
    setValueToDelete(valueName);
    
    if (count > 0) {
      // Afficher le modal avec options de remplacement
      setShowDeleteModal(true);
    } else {
      // Si la valeur n'est pas utilisée, confirmer la suppression simple
      const confirmed = await confirmDelete(valueName, 'la valeur');
      if (confirmed) {
        try {
          await referenceService.deleteValue(activeRefTable, valueName);
          await fetchReferenceValues();
        } catch (err) {
          console.error('Error deleting reference value:', err);
          alert('Échec de la suppression. Veuillez réessayer.');
        }
      }
    }
  };
  
  const handleDeleteForce = async (valueName) => {
    try {
      await referenceService.forceDelete(activeRefTable, valueName);
      setShowDeleteModal(false);
      setValueToDelete(null);
      setUsageCount(0);
      await fetchReferenceValues();
    } catch (err) {
      console.error('Error force deleting reference value:', err);
      alert('Échec de la suppression. Veuillez réessayer.');
    }
  };
  
  const handleReplace = async (oldValue, newValue) => {
    try {
      await referenceService.replaceValue(activeRefTable, oldValue, newValue);
      setShowDeleteModal(false);
      setValueToDelete(null);
      setUsageCount(0);
      await fetchReferenceValues();
    } catch (err) {
      console.error('Error replacing reference value:', err);
      alert('Échec du remplacement. Veuillez réessayer.');
    }
  };
  
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setValueToDelete(null);
    setUsageCount(0);
  };
  
  const handleEdit = async (value) => {
    const valueName = typeof value === 'object' ? value.name : value;
    setModalMode('edit');
    setCurrentValue(valueName);
    setOriginalValue(valueName);
    
    // Vérifier l'utilisation pour afficher un avertissement si nécessaire
    const count = await checkValueUsage(valueName);
    setUsageCount(count);
    
    setShowModal(true);
  };
  
  const handleAdd = () => {
    setModalMode('add');
    setCurrentValue('');
    setOriginalValue('');
    setUsageCount(0);
    setUsageDetails([]);
    setShowModal(true);
  };

  // Gérer la fermeture du modal avec réinitialisation des états
  const handleModalClose = () => {
    setShowModal(false);
    setCurrentValue('');
    setOriginalValue('');
    setUsageCount(0);
    setUsageDetails([]);
    setModalMode('add');
  };
  
  const handleSave = async () => {
    if (!currentValue.trim()) {
      alert('La valeur ne peut pas être vide');
      return;
    }

    try {
      if (modalMode === 'edit') {
        // Mode édition : renommer la valeur
        await referenceService.updateValue(activeRefTable, originalValue, currentValue.trim());
      } else {
        // Mode ajout : ajouter une nouvelle valeur
        await referenceService.addValue(activeRefTable, currentValue.trim());
      }
      
      // Réinitialiser les états du modal
      setCurrentValue('');
      setOriginalValue('');
      setUsageCount(0);
      setUsageDetails([]);
      setModalMode('add');
      setShowModal(false);
      
      // Rafraîchir la liste pour s'assurer de la cohérence
      await fetchReferenceValues();
    } catch (err) {
      console.error('Error saving reference value:', err);
      alert('Échec de l\'enregistrement. Veuillez réessayer.');
    }
  };

  // Gérer la soumission du formulaire avec Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <>
      <div className="d-flex justify-content-end align-items-center mb-4">
        <Button 
          variant="danger" 
          onClick={handleAdd}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" /> {t('common.addNewValue')}
        </Button>
      </div>

      {values.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '50%' }}>Valeur</th>
                {activeRefTable === 'ref_units' && (
                  <th style={{ width: '20%' }}>Type</th>
                )}
                <th className="text-center" style={{ width: activeRefTable === 'ref_units' ? '30%' : '50%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {values.map((value, index) => {
                // Gérer le cas où value peut être un objet ou une string
                const valueName = typeof value === 'object' ? value.name : value;
                const unitType = typeof value === 'object' ? value.unit_type : null;
                const description = typeof value === 'object' ? value.description : null;
                
                return (
                  <tr key={index}>
                    <td>
                      <div className="item-name font-weight-bold">
                        {valueName}
                      </div>
                      {description && (
                        <small className="text-muted">{description}</small>
                      )}
                    </td>
                    {activeRefTable === 'ref_units' && (
                      <td>
                        {unitType ? (
                          <span className="badge bg-secondary">{unitType}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    )}
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          onClick={() => handleEdit(value)}
                          title="Modifier"
                          className="mr-1"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(value)}
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card className="text-center p-5 bg-light empty-state">
          <Card.Body>
            <FontAwesomeIcon icon={faList} size="3x" className="text-secondary mb-3 empty-state-icon" />
            <h4>{t('common.noValuesFound')}</h4>
            <p className="text-muted">{t('common.clickToAddValues')}</p>
          </Card.Body>
        </Card>
      )}
      
      {/* Modal de confirmation de suppression avec options de remplacement */}
      <DeleteWithUsageModal
        show={showDeleteModal}
        onHide={handleCancelDelete}
        onCancel={handleCancelDelete}
        onDeleteForce={handleDeleteForce}
        onReplace={handleReplace}
        itemName={valueToDelete}
        itemType="reference"
        usageCount={usageCount}
        availableOptions={values
          .filter(v => {
            const vName = typeof v === 'object' ? v.name : v;
            return vName !== valueToDelete;
          })
          .map(v => {
            const vName = typeof v === 'object' ? v.name : v;
            return { value: vName, label: vName };
          })
        }
      />
      
      {/* Modal for Add/Edit/Delete with Replacement */}
      <Modal 
        show={showModal} 
        onHide={handleModalClose}
        size="lg"
        backdrop="static"
        keyboard={true}
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            {modalMode === 'edit' ? 'Modifier la valeur' : t('common.addNewValue')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <Form.Group className="mb-3">
              <Form.Label>{`Nouvelle valeur pour ${activeRefTable}`}</Form.Label>
              <Form.Control 
                type="text" 
                value={currentValue} 
                onChange={(e) => setCurrentValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                placeholder={`Entrez la nouvelle valeur`}
                autoFocus
              />
            </Form.Group>
          </Form>
        </Modal.Body>        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleSave}
            disabled={!currentValue.trim()}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EnumTableContent;