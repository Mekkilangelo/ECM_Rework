import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import trialService from '../../../../../../../../services/trialService';
import { Spinner, ListGroup } from 'react-bootstrap';

const SpecificationsSection = ({ trialNodeId, parentId, viewMode = false }) => {
  const { t } = useTranslation();
  const [specifications, setSpecifications] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSpecifications = async () => {
      if (!trialNodeId || !parentId) {
        
        setLoading(false);
        return;
      }

      

      try {
        setLoading(true);
        const response = await trialService.getTrialSpecs(trialNodeId, parentId);
        
        
        

        
        
        

        // Vérifiez si la réponse a la structure attendue
        // Si response est un objet avec la propriété 'specifications'
        if (response && response.specifications !== undefined && response.specifications !== null) {
          
          
          let specs = response.specifications;
          
          // Si c'est une chaîne JSON, la parser (comme dans usePartData)
          if (typeof specs === 'string') {
            
            try {
              specs = JSON.parse(specs);
              
            } catch (parseError) {
              console.error('🔍 SpecificationsSection - Erreur parsing JSON:', parseError);
              specs = { hardnessSpecs: [], ecdSpecs: [] };
            }
          } else if (specs && typeof specs === 'object') {
          } else {
            
            specs = { hardnessSpecs: [], ecdSpecs: [] };
          }
          
          
          
          
          setSpecifications(specs);
        } 
        // Si la réponse contient response.data.specifications
        else if (response && response.data && response.data.specifications !== undefined && response.data.specifications !== null) {
          
          
          let specs = response.data.specifications;
          
          // Si c'est une chaîne JSON, la parser
          if (typeof specs === 'string') {
            try {
              specs = JSON.parse(specs);
            } catch (parseError) {
              console.error('🔍 SpecificationsSection - Erreur parsing JSON (data):', parseError);
              specs = { hardnessSpecs: [], ecdSpecs: [] };
            }
          } else if (specs && typeof specs === 'object') {
          } else {
            specs = { hardnessSpecs: [], ecdSpecs: [] };
          }
          
          setSpecifications(specs);
        } 
        // Sinon, initialisez avec un objet vide avec la nouvelle structure
        else {
          console.warn('🔍 SpecificationsSection - Aucune spécification trouvée dans response:', response);
          setSpecifications({
            hardnessSpecs: [],
            ecdSpecs: []
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error(t('trials.after.specifications.fetchError'), err);
        setError(t('trials.after.specifications.loadError'));
        setLoading(false);
      }
    };

    fetchSpecifications();
  }, [trialNodeId, parentId, t]);

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }

  if (error) {
    return <div className="text-danger small">{error}</div>;
  }

  if (!specifications) {
    return <div className="text-muted small">{t('trials.after.specifications.noSpecifications')}</div>;
  }

  // Formatage des données pour un affichage compact
  const formatRange = (min, max) => {
    if (min && max) return `${min} - ${max}`;
    if (min) return t('trials.after.specifications.formatMin', { value: min });
    if (max) return t('trials.after.specifications.formatMax', { value: max });
    return t('trials.after.specifications.notAvailable');
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

      {/* Message si aucune spécification n'est disponible */}
      {(!specifications.hardnessSpecs || specifications.hardnessSpecs.length === 0) &&
       (!specifications.ecdSpecs || specifications.ecdSpecs.length === 0) && (
        <ListGroup.Item className="py-2 text-center">
          <span className="text-muted small">{t('trials.after.specifications.noSpecifications')}</span>
        </ListGroup.Item>
      )}
    </ListGroup>
  );
};

export default SpecificationsSection;
