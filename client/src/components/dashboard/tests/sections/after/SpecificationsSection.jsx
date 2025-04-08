import React, { useState, useEffect } from 'react';
import { testService } from '../../../../../services/testService';
import { Card, Spinner, ListGroup } from 'react-bootstrap';

const SpecificationsSection = ({ testNodeId, parentId }) => {
  const [specifications, setSpecifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpecifications = async () => {
      if (!testNodeId || !parentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await testService.getTestSpecs(testNodeId, parentId);
        setSpecifications(response.data.specifications);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des spécifications:', err);
        setError('Impossible de charger les spécifications');
        setLoading(false);
      }
    };

    fetchSpecifications();
  }, [testNodeId, parentId]);

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  if (error) {
    return <div className="text-danger small">{error}</div>;
  }

  if (!specifications) {
    return <div className="text-muted small">Aucune spécification disponible</div>;
  }

  // Formatage des données pour un affichage compact
  const formatRange = (min, max) => {
    if (min && max) return `${min} - ${max}`;
    if (min) return `Min: ${min}`;
    if (max) return `Max: ${max}`;
    return 'N/A';
  };

  return (
      <ListGroup variant="flush">
        {specifications.ecd && (
          <ListGroup.Item className="py-2">
            <span className="d-flex justify-content-between">
              <span>ECD {specifications.ecd.hardness} {specifications.ecd.unit}:</span>
              <span className="text-primary">{formatRange(specifications.ecd.depthMin, specifications.ecd.depthMax)} mm</span>
            </span>
          </ListGroup.Item>
        )}
        {specifications.surfaceHardness && (
          <ListGroup.Item className="py-2">
            <span className="d-flex justify-content-between">
              <span>Dureté en Surface:</span>
              <span className="text-primary">
                {formatRange(specifications.surfaceHardness.min, specifications.surfaceHardness.max)} {specifications.surfaceHardness.unit}
              </span>
            </span>
          </ListGroup.Item>
        )}
        {specifications.coreHardness && (
          <ListGroup.Item className="py-2">
            <span className="d-flex justify-content-between">
              <span>Dureté à Coeur:</span>
              <span className="text-primary">
                {formatRange(specifications.coreHardness.min, specifications.coreHardness.max)} {specifications.coreHardness.unit}
              </span>
            </span>
          </ListGroup.Item>
        )}
      </ListGroup>
  );
};

export default SpecificationsSection;
