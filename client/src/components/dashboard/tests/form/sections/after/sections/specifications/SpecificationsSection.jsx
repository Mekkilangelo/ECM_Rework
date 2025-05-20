import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { testService } from '../../../../../../../../services/testService';
import { Spinner, ListGroup } from 'react-bootstrap';

const SpecificationsSection = ({ testNodeId, parentId, viewMode = false }) => {
  const { t } = useTranslation();
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
        console.error(t('tests.after.specifications.fetchError'), err);
        setError(t('tests.after.specifications.loadError'));
        setLoading(false);
      }
    };

    fetchSpecifications();
  }, [testNodeId, parentId, t]);

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  if (error) {
    return <div className="text-danger small">{error}</div>;
  }

  if (!specifications) {
    return <div className="text-muted small">{t('tests.after.specifications.noSpecifications')}</div>;
  }

  // Formatage des données pour un affichage compact
  const formatRange = (min, max) => {
    if (min && max) return `${min} - ${max}`;
    if (min) return t('tests.after.specifications.formatMin', { value: min });
    if (max) return t('tests.after.specifications.formatMax', { value: max });
    return t('tests.after.specifications.notAvailable');
  };

  return (
    <ListGroup variant="flush">
      {specifications.ecd && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.ecd', { hardness: specifications.ecd.hardness, unit: specifications.ecd.unit })}</span>
            <span className="text-primary">{formatRange(specifications.ecd.depthMin, specifications.ecd.depthMax)} mm</span>
          </span>
        </ListGroup.Item>
      )}
      {specifications.surfaceHardness && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.surfaceHardness')}</span>
            <span className="text-primary">
              {formatRange(specifications.surfaceHardness.min, specifications.surfaceHardness.max)} {specifications.surfaceHardness.unit}
            </span>
          </span>
        </ListGroup.Item>
      )}
      {specifications.coreHardness && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.coreHardness')}</span>
            <span className="text-primary">
              {formatRange(specifications.coreHardness.min, specifications.coreHardness.max)} {specifications.coreHardness.unit}
            </span>
          </span>
        </ListGroup.Item>
      )}
      {specifications.toothHardness && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.toothHardness')}</span>
            <span className="text-primary">
              {formatRange(specifications.toothHardness.min, specifications.toothHardness.max)} {specifications.toothHardness.unit}
            </span>
          </span>
        </ListGroup.Item>
      )}
    </ListGroup>
  );
};

export default SpecificationsSection;
