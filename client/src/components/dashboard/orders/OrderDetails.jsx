import React, { useState, useEffect } from 'react';
import { Spinner, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const ClientDetails = ({ clientId, onClose }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/clients/${clientId}`);
        console.log('Client details:', response.data);
        setClient(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des détails du client:', err);
        setError(err.response?.data?.message || err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientDetails();
  }, [clientId]);
  
  if (loading) return <Spinner animation="border" />;
  
  if (error) return <Alert variant="danger">{error}</Alert>;
  
  if (!client) return <Alert variant="warning">Client non trouvé</Alert>;
  
  return (
    <div>
      <Row>
        <Col md={6}>
          <p><strong>Nom:</strong> {client.name}</p>
          <p><strong>Code client:</strong> {client.Client?.client_code}</p>
          <p><strong>Status:</strong> {client.data_status}</p>
        </Col>
        <Col md={6}>
          <p><strong>Pays:</strong> {client.Client?.country || 'Non spécifié'}</p>
          <p><strong>Ville:</strong> {client.Client?.city || 'Non spécifiée'}</p>
          <p><strong>Groupe:</strong> {client.Client?.client_group || 'Non spécifié'}</p>
        </Col>
      </Row>
      
      <Row className="mt-3">
        <Col>
          <p><strong>Adresse:</strong></p>
          <p>{client.Client?.address || 'Non spécifiée'}</p>
        </Col>
      </Row>
      
      <Row className="mt-3">
        <Col>
          <p><strong>Créé le:</strong> {new Date(client.created_at).toLocaleString()}</p>
          <p><strong>Dernière modification:</strong> {new Date(client.modified_at).toLocaleString()}</p>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-end mt-4">
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default ClientDetails;