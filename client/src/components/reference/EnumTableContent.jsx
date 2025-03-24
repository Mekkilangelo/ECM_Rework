import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Modal, Card, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faList } from '@fortawesome/free-solid-svg-icons';
import enumService from '../../services/enumService';
import '../../styles/dataList.css';

const EnumTableContent = ({ table, column }) => {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentValue, setCurrentValue] = useState('');
  const [originalValue, setOriginalValue] = useState('');

  useEffect(() => {
    fetchEnumValues();
  }, [table, column]);

  const fetchEnumValues = async () => {
    setLoading(true);
    try {
      const response = await enumService.getEnumValues(table, column);
      if (response && response.success && response.data) {
        setValues(response.data.values || []);
      } else {
        setValues([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching enum values:', err);
      setError('Failed to load values. Please try again.');
      setValues([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (value) => {
    setModalMode('edit');
    setCurrentValue(value);
    setOriginalValue(value);
    setShowModal(true);
  };

  const handleDelete = async (value) => {
    if (window.confirm(`Are you sure you want to delete this value: ${value}?`)) {
      try {
        await enumService.deleteEnumValue(table, column, value);
        setValues(values.filter(v => v !== value));
      } catch (err) {
        console.error('Error deleting enum value:', err);
        alert('Failed to delete value. Please try again.');
      }
    }
  };

  const handleAdd = () => {
    setModalMode('add');
    setCurrentValue('');
    setOriginalValue('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!currentValue.trim()) {
      alert('Value cannot be empty');
      return;
    }

    try {
      if (modalMode === 'add') {
        await enumService.addEnumValue(table, column, currentValue);
        
        if (!values.includes(currentValue)) {
          setValues([...values, currentValue]);
        }
      } else {
        await enumService.updateEnumValue(table, column, originalValue, currentValue);
        setValues(values.map(v => v === originalValue ? currentValue : v));
      }
      
      setShowModal(false);
    } catch (err) {
      console.error('Error saving enum value:', err);
      alert('Failed to save value. Please try again.');
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
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Add New Value
        </Button>
      </div>

      {values.length > 0 ? (
        <div className="data-list-container">
          <Table hover responsive className="data-table border-bottom">
            <thead>
              <tr className="bg-light">
                <th style={{ width: '70%' }}>Value</th>
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
                        variant="outline-primary" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => handleEdit(value)}
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(value)}
                        title="Delete"
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
            <h4>No values found</h4>
            <p className="text-muted">Click "Add New Value" to add values to this enum</p>
          </Card.Body>
        </Card>
      )}

      {/* Modal for Add/Edit */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            {modalMode === 'add' ? 'Add New Value' : 'Edit Value'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>{`${column} Value`}</Form.Label>
              <Form.Control 
                type="text" 
                value={currentValue} 
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder={`Enter ${column} value`}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EnumTableContent;