// src/components/reference/UnitsSection.jsx
import React, { useState, useEffect } from 'react';
import { Tab, Nav, Button, Card, Table, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faList } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import referenceService from '../../../services/referenceService';
import useConfirmationDialog from '../../../hooks/useConfirmationDialog';

/**
 * Composant spécialisé pour gérer les unités avec types
 * Contrairement aux autres références, les unités ont une structure hiérarchique (unit_type)
 */
const UnitsSection = () => {
  const [activePill, setActivePill] = useState('length');
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitDescription, setNewUnitDescription] = useState('');
  const { t } = useTranslation();
  const { confirmDelete } = useConfirmationDialog();

  // Types d'unités disponibles
  const unitTypes = [
    { key: 'length', label: t('references.units.length_units') },
    { key: 'weight', label: t('references.units.weight_units') },
    { key: 'hardness', label: t('references.units.hardness_units') },
    { key: 'temperature', label: t('references.units.temperature_units') },
    { key: 'time', label: t('references.units.time_units') },
    { key: 'pressure', label: t('references.units.pressure_units') }
  ];

  useEffect(() => {
    fetchUnits();
    
    // S'abonner aux changements
    const unsubscribe = referenceService.subscribe('ref_units', () => {
      
      fetchUnits();
    });
    
    return unsubscribe;
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await referenceService.getValues('ref_units');
      setUnits(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(u => 
    typeof u === 'object' && u.unit_type === activePill
  );

  const handleAdd = () => {
    setNewUnitName('');
    setNewUnitDescription('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!newUnitName.trim()) {
      alert('Le nom de l\'unité est requis');
      return;
    }

    try {
      await referenceService.addValue('ref_units', newUnitName.trim(), {
        unit_type: activePill,
        description: newUnitDescription.trim() || null
      });
      
      setShowModal(false);
      setNewUnitName('');
      setNewUnitDescription('');
      await fetchUnits();
    } catch (error) {
      console.error('Error adding unit:', error);
      alert('Échec de l\'ajout de l\'unité');
    }
  };

  const handleDelete = async (unit) => {
    const confirmed = await confirmDelete(unit.name, 'l\'unité');
    if (confirmed) {
      try {
        await referenceService.deleteValue('ref_units', unit.name);
        await fetchUnits();
      } catch (error) {
        console.error('Error deleting unit:', error);
        alert('Échec de la suppression');
      }
    }
  };

  if (loading) {
    return (
      <div className="spinner-container text-center py-5">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <>
      <Tab.Container activeKey={activePill} onSelect={setActivePill}>
        <Nav variant="pills" className="mb-3">
          {unitTypes.map(type => (
            <Nav.Item key={type.key}>
              <Nav.Link eventKey={type.key}>{type.label}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        <Tab.Content>
          {unitTypes.map(type => (
            <Tab.Pane key={type.key} eventKey={type.key}>
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-end align-items-center mb-4">
                    <Button 
                      variant="danger" 
                      onClick={handleAdd}
                      className="d-flex align-items-center"
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" /> Ajouter
                    </Button>
                  </div>

                  {filteredUnits.length > 0 ? (
                    <Table hover responsive className="data-table border-bottom">
                      <thead>
                        <tr className="bg-light">
                          <th style={{ width: '70%' }}>Unité</th>
                          <th className="text-center" style={{ width: '30%' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUnits.map((unit, index) => (
                          <tr key={index}>
                            <td>
                              <div className="item-name font-weight-bold">
                                {unit.name}
                              </div>
                              {unit.description && (
                                <small className="text-muted">{unit.description}</small>
                              )}
                            </td>
                            <td className="text-center">
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleDelete(unit)}
                                title="Supprimer"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <Card className="text-center p-5 bg-light">
                      <Card.Body>
                        <FontAwesomeIcon icon={faList} size="3x" className="text-secondary mb-3" />
                        <h4>Aucune unité trouvée</h4>
                        <p className="text-muted">Cliquez sur "Ajouter" pour créer une nouvelle unité</p>
                      </Card.Body>
                    </Card>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>

      {/* Modal d'ajout */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Ajouter une unité ({activePill})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nom de l'unité *</Form.Label>
            <Form.Control 
              type="text" 
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="Ex: mm, kg, °C..."
              autoFocus
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description (optionnel)</Form.Label>
            <Form.Control 
              as="textarea"
              rows={2}
              value={newUnitDescription}
              onChange={(e) => setNewUnitDescription(e.target.value)}
              placeholder="Description de l'unité"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="danger" 
            onClick={handleSave}
            disabled={!newUnitName.trim()}
          >
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UnitsSection;
