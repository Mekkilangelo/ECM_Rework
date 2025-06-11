import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import testService from '../../../../../../../../services/testService';
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
      }      try {
        setLoading(true);
        const response = await testService.getTestSpecs(testNodeId, parentId);
        
        // Log la réponse pour le débogage
        console.log('Réponse du service getTestSpecs:', response);
          // Vérifiez si la réponse a la structure attendue
        // Si response est un objet avec la propriété 'specifications'
        if (response && response.specifications) {
          // Assurez-vous que specifications est un objet et non une chaîne
          const specs = typeof response.specifications === 'string' 
            ? JSON.parse(response.specifications) 
            : response.specifications;
          setSpecifications(specs);
        } 
        // Si la réponse contient response.data.specifications
        else if (response && response.data && response.data.specifications) {
          // Assurez-vous que specifications est un objet et non une chaîne
          const specs = typeof response.data.specifications === 'string'
            ? JSON.parse(response.data.specifications)
            : response.data.specifications;
          setSpecifications(specs);
        } 
        // Sinon, initialisez avec un objet vide
        else {
          console.warn('La réponse ne contient pas de spécifications, initialisation avec valeurs par défaut');
          setSpecifications({});
        }
        
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
  // Fonction pour formater l'affichage des spécifications de dureté
  const formatHardnessSpec = (spec) => {
    const range = formatRange(spec.min, spec.max);
    return `${range}${spec.unit ? ` ${spec.unit}` : ''}`;
  };

  // Fonction pour formater l'affichage des spécifications ECD
  const formatEcdSpec = (spec) => {
    const depthRange = formatRange(spec.depthMin, spec.depthMax);
    const hardnessText = spec.hardness ? ` (${spec.hardness}${spec.hardnessUnit ? ` ${spec.hardnessUnit}` : ''})` : '';
    return `${depthRange}${spec.depthUnit ? ` ${spec.depthUnit}` : ''}${hardnessText}`;
  };

  return (
    <ListGroup variant="flush">
      {/* Affichage des spécifications de dureté dynamiques */}
      {specifications.hardnessSpecs && Array.isArray(specifications.hardnessSpecs) && specifications.hardnessSpecs.length > 0 && (
        specifications.hardnessSpecs.map((spec, index) => (
          <ListGroup.Item key={`hardness-${index}`} className="py-2">
            <span className="d-flex justify-content-between">
              <span>
                {spec.name ? `${spec.name}:` : `${t('parts.specifications.hardnessSpecs')} ${index + 1}:`}
              </span>
              <span className="text-primary">
                {formatHardnessSpec(spec)}
              </span>
            </span>
          </ListGroup.Item>
        ))
      )}

      {/* Affichage des spécifications ECD dynamiques */}
      {specifications.ecdSpecs && Array.isArray(specifications.ecdSpecs) && specifications.ecdSpecs.length > 0 && (
        specifications.ecdSpecs.map((spec, index) => (
          <ListGroup.Item key={`ecd-${index}`} className="py-2">
            <span className="d-flex justify-content-between">
              <span>
                {spec.name ? `${spec.name}:` : `${t('parts.specifications.ecdSpecs')} ${index + 1}:`}
              </span>
              <span className="text-primary">
                {formatEcdSpec(spec)}
              </span>
            </span>
          </ListGroup.Item>
        ))
      )}

      {/* Support pour l'ancien format de spécifications (rétrocompatibilité) */}
      {specifications.ecd && !Array.isArray(specifications.ecdSpecs) && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.ecd', { hardness: specifications.ecd.hardness, unit: specifications.ecd.unit })}</span>
            <span className="text-primary">{formatRange(specifications.ecd.depthMin, specifications.ecd.depthMax)} mm</span>
          </span>
        </ListGroup.Item>
      )}
      {specifications.surfaceHardness && !Array.isArray(specifications.hardnessSpecs) && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.surfaceHardness')}</span>
            <span className="text-primary">
              {formatRange(specifications.surfaceHardness.min, specifications.surfaceHardness.max)} {specifications.surfaceHardness.unit}
            </span>
          </span>
        </ListGroup.Item>
      )}
      {specifications.coreHardness && !Array.isArray(specifications.hardnessSpecs) && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.coreHardness')}</span>
            <span className="text-primary">
              {formatRange(specifications.coreHardness.min, specifications.coreHardness.max)} {specifications.coreHardness.unit}
            </span>
          </span>
        </ListGroup.Item>
      )}
      {specifications.toothHardness && !Array.isArray(specifications.hardnessSpecs) && (
        <ListGroup.Item className="py-2">
          <span className="d-flex justify-content-between">
            <span>{t('tests.after.specifications.toothHardness')}</span>
            <span className="text-primary">
              {formatRange(specifications.toothHardness.min, specifications.toothHardness.max)} {specifications.toothHardness.unit}
            </span>
          </span>
        </ListGroup.Item>
      )}

      {/* Message si aucune spécification n'est disponible */}
      {(!specifications.hardnessSpecs || specifications.hardnessSpecs.length === 0) &&
       (!specifications.ecdSpecs || specifications.ecdSpecs.length === 0) &&
       !specifications.ecd && !specifications.surfaceHardness && !specifications.coreHardness && !specifications.toothHardness && (
        <ListGroup.Item className="py-2 text-center">
          <span className="text-muted small">{t('tests.after.specifications.noSpecifications')}</span>
        </ListGroup.Item>
      )}
    </ListGroup>
  );
};

export default SpecificationsSection;
