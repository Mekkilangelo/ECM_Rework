// src/components/reference/steels/SteelDetails.jsx
import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import steelService from '../../../services/steelService';

const SteelDetails = ({ steelId, onClose }) => {
  const [steel, setSteel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSteelDetails = async () => {
      try {
        setLoading(true);
        const response = await steelService.getSteelById(steelId);
        setSteel(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching steel details:", err);
        setError("Une erreur est survenue lors du chargement des détails de l'acier.");
      } finally {
        setLoading(false);
      }
    };

    if (steelId) {
      fetchSteelDetails();
    }
  }, [steelId]);

  if (loading) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!steel) {
    return <Alert variant="warning">Acier non trouvé</Alert>;
  }

  return (
    <div>
      <Row className="mb-4">
        <Col md={6}>
          <h5 className="text-muted mb-3">Informations générales</h5>
          <Table bordered hover size="sm">
            <tbody>
              <tr>
                <td className="bg-light" style={{ width: '40%' }}>Grade</td>
                <td>{steel.grade || '-'}</td>
              </tr>
              <tr>
                <td className="bg-light">Famille</td>
                <td>{steel.family || '-'}</td>
              </tr>
              <tr>
                <td className="bg-light">Standard</td>
                <td>{steel.standard || '-'}</td>
              </tr>
              <tr>
                <td className="bg-light">Date de création</td>
                <td>{steel.created_at || '-'}</td>
              </tr>
              <tr>
                <td className="bg-light">Dernière modification</td>
                <td>{steel.modified_at || '-'}</td>
              </tr>
            </tbody>
          </Table>
        </Col>
      </Row>

      {/* Équivalents */}
      {steel.equivalents && steel.equivalents.length > 0 && (
        <Row className="mb-4">
          <Col md={12}>
            <h5 className="text-muted mb-3">Équivalents</h5>
            <Table bordered hover size="sm">
              <thead>
                <tr className="bg-light">
                  <th>Grade</th>
                  <th>Standard</th>
                </tr>
              </thead>
              <tbody>
                {steel.equivalents.map((eq, index) => (
                  <tr key={index}>
                    <td>{eq.grade || '-'}</td>
                    <td>{eq.standard || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}

      {/* Composition chimique */}
      {steel.chemical_elements && steel.chemical_elements.length > 0 && (
        <Row>
          <Col md={12}>
            <h5 className="text-muted mb-3">Composition chimique</h5>
            <Table bordered hover size="sm">
              <thead>
                <tr className="bg-light">
                  <th>Élément</th>
                  <th>Valeurs</th>
                </tr>
              </thead>
              <tbody>
                {steel.chemical_elements.map((elem, index) => (
                  <tr key={index}>
                    <td>{elem.element || '-'}</td>
                    <td>
                      {elem.value !== null ? (
                        `${elem.value}%`
                      ) : (
                        `${elem.min_value}% - ${elem.max_value}%`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SteelDetails;
