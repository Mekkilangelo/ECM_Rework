import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faList, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import enumService from '../../services/enumService';
import '../../styles/dataList.css';
import useConfirmationDialog from '../../hooks/useConfirmationDialog';

const EnumTableContent = ({ table, column }) => {
  const { confirmDelete } = useConfirmationDialog();
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [currentValue, setCurrentValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [replacementValue, setReplacementValue] = useState('');
  const [showUsageWarning, setShowUsageWarning] = useState(false);

  useEffect(() => {
    fetchEnumValues();
  }, [table, column]);
  const fetchEnumValues = async () => {
    console.log(`[EnumTableContent] Début fetchEnumValues pour table: ${table}, column: ${column}`);
    setLoading(true);
    try {
      console.log(`[EnumTableContent] Appel enumService.getEnumValues(${table}, ${column})`);
      const response = await enumService.getEnumValues(table, column);
      console.log(`[EnumTableContent] Réponse de enumService:`, response);
      
      if (response && response.success && response.data) {
        console.log(`[EnumTableContent] Réponse avec success=true, values:`, response.data.values);
        setValues(response.data.values || []);
      } else if (response && response.values) {
        console.log(`[EnumTableContent] Réponse avec format direct values:`, response.values);
        setValues(response.values || []);
      } else {
        console.log(`[EnumTableContent] Format de réponse non reconnu, définition de valeurs vides`);
        console.log(`[EnumTableContent] Structure complète de la réponse:`, JSON.stringify(response, null, 2));
        setValues([]);
      }
      setError(null);
    } catch (err) {
      console.error('[EnumTableContent] Error fetching enum values:', err);
      console.error('[EnumTableContent] Stack trace:', err.stack);
      setError('Failed to load values. Please try again.');
      setValues([]);
    } finally {
      setLoading(false);
      console.log(`[EnumTableContent] Fin fetchEnumValues, loading=false`);
    }
  };

  const checkValueUsage = async (value) => {
    try {
      // Cette fonction sera à implémenter côté serveur
      const response = await enumService.checkEnumValueUsage(table, column, value);
      return response.count || 0;
    } catch (err) {
      console.error('Error checking enum value usage:', err);
      return 0;
    }
  };

  const handleEdit = async (value) => {
    const count = await checkValueUsage(value);
    setUsageCount(count);
    setShowUsageWarning(count > 0);
    
    setModalMode('edit');
    setCurrentValue(value);
    setOriginalValue(value);
    setShowModal(true);
  };
  const handleDelete = async (value) => {
    const count = await checkValueUsage(value);
    setUsageCount(count);
    
    if (count > 0) {
      // Si la valeur est utilisée, demander à l'utilisateur de choisir une valeur de remplacement
      setModalMode('delete');
      setOriginalValue(value);
      setCurrentValue(value);
      setReplacementValue('');
      setShowModal(true);    } else {
      // Si la valeur n'est pas utilisée, confirmer la suppression simple
      const confirmed = await confirmDelete(value, 'la valeur');
      if (confirmed) {
        try {
          await enumService.deleteEnumValue(table, column, value);
          // Rafraîchir la liste après suppression pour assurer la cohérence
          await fetchEnumValues();
        } catch (err) {
          console.error('Error deleting enum value:', err);
          alert('Échec de la suppression. Veuillez réessayer.');
        }
      }
    }
  };
  const handleAdd = () => {
    setModalMode('add');
    setCurrentValue('');
    setOriginalValue('');
    setReplacementValue('');
    setUsageCount(0);
    setShowUsageWarning(false);
    setShowModal(true);
  };

  // Gérer la fermeture du modal avec réinitialisation des états
  const handleModalClose = () => {
    setShowModal(false);
    setCurrentValue('');
    setOriginalValue('');
    setReplacementValue('');
    setUsageCount(0);
    setShowUsageWarning(false);
    setModalMode('add');
  };
  const handleSave = async () => {
    if (modalMode !== 'delete' && !currentValue.trim()) {
      alert('La valeur ne peut pas être vide');
      return;
    }

    if (modalMode === 'delete' && !replacementValue) {
      alert('Veuillez sélectionner une valeur de remplacement');
      return;
    }

    try {
      if (modalMode === 'add') {
        await enumService.addEnumValue(table, column, currentValue);
        
        if (!values.includes(currentValue)) {
          setValues([...values, currentValue]);
        }
      } else if (modalMode === 'edit') {
        await enumService.updateEnumValue(table, column, originalValue, currentValue);
        setValues(values.map(v => v === originalValue ? currentValue : v));
      } else if (modalMode === 'delete') {
        await enumService.replaceAndDeleteEnumValue(table, column, originalValue, replacementValue);
        setValues(values.filter(v => v !== originalValue));
      }
        // Réinitialiser les états du modal
      setCurrentValue('');
      setOriginalValue('');
      setReplacementValue('');
      setUsageCount(0);
      setShowUsageWarning(false);
      setModalMode('add');
      setShowModal(false);
      
      // Rafraîchir la liste pour s'assurer de la cohérence
      await fetchEnumValues();
    } catch (err) {
      console.error('Error saving enum value:', err);
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
          <FontAwesomeIcon icon={faPlus} className="me-2" /> Ajouter une nouvelle valeur
        </Button>
      </div>

      {values.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '70%' }}>Valeur</th>
                <th className="text-center" style={{ width: '30%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {values.map((value, index) => (
                <tr key={index}>
                  <td>
                    <div className="item-name font-weight-bold">
                      {value}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center">
                      <Button 
                        variant="outline-warning" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEdit(value)}
                        title="Modifier"
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
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <Card className="text-center p-5 bg-light empty-state">
          <Card.Body>
            <FontAwesomeIcon icon={faList} size="3x" className="text-secondary mb-3 empty-state-icon" />
            <h4>Aucune valeur trouvée</h4>
            <p className="text-muted">Cliquez sur "Ajouter une nouvelle valeur" pour ajouter des valeurs à cette énumération</p>
          </Card.Body>
        </Card>
      )}      {/* Modal for Add/Edit/Delete with Replacement */}
      <Modal 
        show={showModal} 
        onHide={handleModalClose}
        size="lg"
        backdrop="static"
        keyboard={true}
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            {modalMode === 'add' 
              ? 'Ajouter une nouvelle valeur' 
              : modalMode === 'edit' 
                ? 'Modifier la valeur' 
                : 'Supprimer et remplacer la valeur'
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showUsageWarning && modalMode === 'edit' && (
            <Alert variant="warning">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Cette valeur est utilisée dans {usageCount} enregistrement(s). La modification mettra à jour tous ces enregistrements.
            </Alert>
          )}
            <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {modalMode === 'delete' ? (
              <>
                <Alert variant="warning">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  La valeur <strong>{originalValue}</strong> est utilisée dans {usageCount} enregistrement(s). 
                  Veuillez sélectionner une valeur de remplacement.
                </Alert>
                
                <Form.Group className="mb-3">
                  <Form.Label>Valeur à supprimer</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={originalValue} 
                    disabled
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Remplacer par</Form.Label>
                  <Form.Select 
                    value={replacementValue} 
                    onChange={(e) => setReplacementValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                  >
                    <option value="">Sélectionnez une valeur de remplacement</option>
                    {values
                      .filter(v => v !== originalValue)
                      .map((v, i) => (
                        <option key={i} value={v}>{v}</option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>{`Valeur ${column}`}</Form.Label>
                <Form.Control 
                  type="text" 
                  value={currentValue} 
                  onChange={(e) => setCurrentValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Entrez la valeur ${column}`}
                  autoFocus
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleSave}
            disabled={
              (modalMode === 'delete' && !replacementValue) || 
              (modalMode !== 'delete' && !currentValue.trim())
            }
          >
            {modalMode === 'delete' ? 'Supprimer et remplacer' : 'Enregistrer'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EnumTableContent;