import React, { useEffect } from 'react';
import { Row, Col, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faUser, faWeight, faCalendarAlt, faClipboardCheck, faCogs, faGavel, faLayers } from '@fortawesome/free-solid-svg-icons';

const CoverPageSection = ({ testData, partData, clientData }) => {
  // Fonction pour déboguer la structure de l'ECD
  useEffect(() => {
    if (partData && partData.specifications && partData.specifications.ecd) {
      console.log("=== ECD Debug Info ===");
      console.log("ECD structure:", partData.specifications.ecd);
      console.log("ECD direct:", partData.ecd);
    }
  }, [partData]);
    // Vérifier que les données nécessaires sont présentes
  if (!testData || !partData) {
    return (
      <div className="text-center p-5">
        <p>Insufficient data to display the cover page</p>
      </div>
    );
  }  // Récupérer les spécifications depuis les données de la pièce selon la nouvelle structure
  const { hardnessSpecs, ecdSpecs } = (() => {
    if (!partData?.specifications) return { hardnessSpecs: [], ecdSpecs: [] };
    
    const specifications = partData.specifications;
    
    // Nouvelle structure: { hardnessSpecs: [], ecdSpecs: [] }
    if (specifications.hardnessSpecs || specifications.ecdSpecs) {
      return {
        hardnessSpecs: specifications.hardnessSpecs || [],
        ecdSpecs: specifications.ecdSpecs || []
      };
    }
    
    // Format de compatibilité - si c'est un tableau
    if (Array.isArray(specifications)) {
      const hardness = [];
      const ecd = [];
      
      specifications.forEach(spec => {
        if (spec.parameter && (
          spec.parameter.toLowerCase().includes('ecd') || 
          spec.parameter.toLowerCase().includes('depth') ||
          spec.depthMin !== undefined || 
          spec.depthMax !== undefined
        )) {
          ecd.push(spec);
        } else {
          hardness.push(spec);
        }
      });
      
      return { hardnessSpecs: hardness, ecdSpecs: ecd };
    }
    
    // Format de compatibilité - si c'est un objet direct (ancien format)
    if (typeof specifications === 'object' && specifications !== null) {
      const hardness = [];
      const ecd = [];
      
      Object.entries(specifications).forEach(([key, value]) => {
        if (key.toLowerCase().includes('ecd') || 
            key.toLowerCase().includes('pdd') ||
            key.toLowerCase().includes('case') ||
            key.toLowerCase().includes('depth') ||
            (typeof value === 'object' && (value.depthMin !== undefined || value.depthMax !== undefined || value.hardness !== undefined))) {
          
          // Pour les spécifications ECD
          const ecdSpec = {
            parameter: key,
            hardness: value.hardness || value.target || value.value || '',
            depthMin: value.depthMin || value.min || '',
            depthMax: value.depthMax || value.max || '',
            hardnessUnit: value.hardnessUnit || value.unit || 'HV',
            depthUnit: 'mm'
          };
          ecd.push(ecdSpec);
        } else {
          // Spécifications de dureté standard
          const spec = {
            parameter: key,
            min_value: value.min !== undefined ? value.min : '',
            max_value: value.max !== undefined ? value.max : '',
            unit: value.unit || ''
          };
          hardness.push(spec);
        }
      });
      
      return { hardnessSpecs: hardness, ecdSpecs: ecd };
    }
    
    return { hardnessSpecs: [], ecdSpecs: [] };
  })();
  
  // Récupérer les résultats depuis les données du test (comme dans ControlSection)
  const results = testData.results || (testData.results_data?.results) || [];  // Récupérer et formater le poids de la charge
  const formatLoadWeight = () => {
    // Vérifier plusieurs sources possibles pour les données de charge
    const loadData = testData.loadData || testData.load_data || testData.data?.load || {};
    
    console.log("=== DEBUG POIDS DE LA CHARGE ===");
    console.log("CoverPageSection - TestData complet:", testData);
    console.log("CoverPageSection - LoadData extrait:", loadData);
    console.log("CoverPageSection - testData.loadData:", testData.loadData);
    console.log("CoverPageSection - testData.load_data:", testData.load_data);
    console.log("CoverPageSection - testData.data?.load:", testData.data?.load);
    console.log("CoverPageSection - Type de loadData:", typeof loadData);
    console.log("CoverPageSection - Keys de loadData:", Object.keys(loadData || {}));
    console.log("CoverPageSection - TestData keys:", Object.keys(testData || {}));
    
    // Si le loadData est null ou undefined
    if (!loadData) {
      console.log("Aucune donnée de charge trouvée");
      return 'Not specified';
    }
    
    // Si le poids est défini dans les données de charge
    if (loadData && typeof loadData === 'object') {
      console.log("LoadData est un objet, exploration des propriétés...");
      
      // Format structuré: { weight: { value: X, unit: Y } }
      if (loadData.weight && typeof loadData.weight === 'object' && loadData.weight.value !== undefined) {
        console.log("Format structuré détecté:", loadData.weight);
        let value = loadData.weight.value;
        let unit = loadData.weight.unit || 'kg';
        
        // Si l'unité est en grammes, convertir en kg
        if (unit.toLowerCase() === 'g') {
          value = (value / 1000).toFixed(2);
          unit = 'kg';
        }
        
        console.log(`Poids formaté (structuré): ${value} ${unit}`);
        return `${value} ${unit}`;
      }
      
      // Format direct: { weight: X, weight_unit: Y } ou variations
      if (loadData.weight !== undefined && loadData.weight !== null) {
        console.log("Format direct détecté:", { weight: loadData.weight, unit: loadData.weight_unit || loadData.weightUnit });
        let value = loadData.weight;
        let unit = loadData.weight_unit || loadData.weightUnit || 'kg';
        
        if (unit.toLowerCase() === 'g') {
          value = (value / 1000).toFixed(2);
          unit = 'kg';
        }
        
        console.log(`Poids formaté (direct): ${value} ${unit}`);
        return `${value} ${unit}`;
      }
      
      // Autres formats possibles
      if (loadData.totalWeight !== undefined) {
        console.log("Format totalWeight détecté:", { totalWeight: loadData.totalWeight, unit: loadData.totalWeightUnit });
        const result = `${loadData.totalWeight} ${loadData.totalWeightUnit || 'kg'}`;
        console.log(`Poids formaté (totalWeight): ${result}`);
        return result;
      }
      
      // Explorer toutes les propriétés pour trouver des indices de poids
      console.log("Exploration de toutes les propriétés de loadData:");
      Object.entries(loadData).forEach(([key, value]) => {
        if (key.toLowerCase().includes('weight') || key.toLowerCase().includes('poids') || key.toLowerCase().includes('mass')) {
          console.log(`Propriété contenant 'weight/poids/mass': ${key} =`, value);
        }
      });
    }
    
    // Vérifier si loadData est une string JSON à parser
    if (typeof loadData === 'string') {
      console.log("LoadData est une string, tentative de parsing:", loadData);
      try {
        const parsedData = JSON.parse(loadData);
        console.log("Données parsées:", parsedData);
        return formatLoadWeight({ ...testData, loadData: parsedData });
      } catch (e) {
        console.warn("Impossible de parser loadData:", loadData, e);
      }
    }
    
    console.log("Aucun format de poids reconnu, retour de 'Not specified'");
    return 'Not specified';
  };
  
  // Obtenir le poids formaté
  const loadWeight = formatLoadWeight();

  // Reformater les données de test pour l'en-tête
  const formattedTestData = {
    testCode: testData.testCode || testData.test_code || '',
    processType: testData.processType || testData.process_type || '',
    loadNumber: testData.loadNumber || testData.load_number || '',
    testDate: testData.testDate || testData.test_date || null
  };  // Vérification de la console pour le débogage
  console.log("CoverPageSection - PartData:", partData);
  console.log("CoverPageSection - HardnessSpecs:", hardnessSpecs);
  console.log("CoverPageSection - EcdSpecs:", ecdSpecs);
  console.log("CoverPageSection - Results:", results);
  console.log("CoverPageSection - TestData:", testData);
  console.log("CoverPageSection - Steel value:", partData?.steel);

  // Fonction utilitaire pour formater les valeurs de spécification
  const formatSpecValue = (value) => {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'object') {
      // Tentative d'extraire une valeur significative de l'objet plutôt qu'afficher le JSON brut
      if (value.value !== undefined) return value.value;
      if (value.target !== undefined) return value.target;
      return JSON.stringify(value);
    }
    return value;
  };
  // Fonction utilitaire pour formater les noms de paramètres
  const formatParameterName = (paramName) => {
    if (!paramName) return 'Parameter';
    
    // Convertir les nomenclatures spéciales
    if (paramName.toLowerCase().includes('surface')) return 'Surface Hardness';
    if (paramName.toLowerCase().includes('coeur') || paramName.toLowerCase().includes('core')) return 'Core Hardness';
    if (paramName.toLowerCase().includes('pdd') || paramName.toLowerCase().includes('pied')) return 'Case Depth Hardness';
    if (paramName.toLowerCase() === 'toothhardness') return 'Case Depth Hardness'; // Ajout explicite pour toothHardness
    if (paramName.toLowerCase() === 'ecd') return 'ECD';
    
    // Formater les paramètres ordinaires avec une première lettre majuscule
    return paramName.charAt(0).toUpperCase() + paramName.slice(1);
  };  return (
    <div style={{ 
      minHeight: '297mm', // Format A4 exact
      maxHeight: '297mm',
      width: '210mm',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '10mm', // Marges réduites mais professionnelles
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pageBreakAfter: 'always',
      pageBreakInside: 'avoid',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>{/* Header moderne avec gradient rouge/jaune */}
      <div style={{
        background: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 8px 32px rgba(211, 47, 47, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Motif décoratif en arrière-plan */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '100%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          borderRadius: '50%',
          transform: 'translateX(50px)'
        }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              fontSize: '32px', 
              fontWeight: 'bold', 
              margin: '0 0 5px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              TRIAL REPORT
            </h1>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '500' }}>
              <FontAwesomeIcon icon={faFlask} style={{ marginRight: '8px' }} />
              Trial {testData?.testCode || testData?.test_code || 'N/A'}
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '8px', 
            padding: '15px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <img 
              src="/images/logoECM.png" 
              alt="Logo ECM" 
              style={{ height: '50px', width: 'auto', filter: 'brightness(0) invert(1)' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div style={{ 
              display: 'none', 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: '20px',
              textAlign: 'center',
              padding: '15px'
            }}>
              ECM
            </div>
          </div>
        </div>        
        {/* Info dans le header comme ReportPageHeader */}
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          gap: '25px', 
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
          fontSize: '14px'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FontAwesomeIcon icon={faUser} />
            <span style={{ fontWeight: '600' }}>Client:</span>
            <span>{clientData?.name || 'Not specified'}</span>
            {clientData?.country && (
              <>
                <span style={{ margin: '0 4px', opacity: 0.7 }}>•</span>
                <span>{clientData.country}</span>
              </>
            )}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FontAwesomeIcon icon={faCogs} />
            <span style={{ fontWeight: '600' }}>Treatment:</span>
            <span>{testData?.processType || testData?.process_type || 'Not specified'}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FontAwesomeIcon icon={faWeight} />
            <span style={{ fontWeight: '600' }}>Load N°:</span>
            <span>{testData?.loadNumber || testData?.load_number || 'Not specified'}</span>
            <span style={{ margin: '0 4px', opacity: 0.7 }}>•</span>
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>
              {testData?.testDate || testData?.test_date 
                ? new Date(testData.testDate || testData.test_date).toLocaleDateString('en-US') 
                : 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenu principal en deux colonnes */}
      <Row style={{ margin: 0 }}>
        {/* Colonne gauche - Informations principales */}
        <Col md={6} style={{ paddingLeft: 0, paddingRight: '15px' }}>
          {/* Section Part Information */}
          <div style={{
            background: 'white',            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #ffebee'
          }}>
            <h3 style={{ 
              color: '#d32f2f', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faCogs} style={{ color: '#f44336' }} />
              Part Information
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: '600', color: '#424242' }}>Designation:</span>
                <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{partData?.designation || 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: '600', color: '#424242' }}>Client designation:</span>
                <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{partData?.clientDesignation || partData?.client_designation || 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: '600', color: '#424242' }}>Steel:</span>
                <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{partData?.steel || 'Not specified'}</span>
              </div>
              {partData?.reference && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontWeight: '600', color: '#424242' }}>Reference:</span>
                  <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{partData.reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section Test Information */}
          <div style={{
            background: 'white',            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #fff8e1'
          }}>
            <h3 style={{ 
              color: '#f57c00', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faWeight} style={{ color: '#ff9800' }} />
              Load Information
            </h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: '600', color: '#424242' }}>Test number:</span>
                <span style={{ color: '#666' }}>{testData?.testCode || testData?.test_code || 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: '600', color: '#424242' }}>Process type:</span>
                <span style={{ color: '#666' }}>{testData?.processType || testData?.process_type || 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontWeight: '600', color: '#424242' }}>Weight:</span>
                <span style={{ color: '#666' }}>{loadWeight}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontWeight: '600', color: '#424242' }}>Load number:</span>
                <span style={{ color: '#666' }}>{testData?.loadNumber || testData?.load_number || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </Col>

        {/* Colonne droite - Spécifications et résultats */}
        <Col md={6} style={{ paddingRight: 0, paddingLeft: '15px' }}>
          {/* Spécifications */}
          <div style={{
            background: 'white',            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #ffebee'
          }}>
            <h3 style={{ 
              color: '#c62828', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faGavel} style={{ color: '#e53935' }} />
              Specifications
            </h3>
            
            {/* Spécifications de dureté */}
            {hardnessSpecs && hardnessSpecs.length > 0 && (
              <div style={{ marginBottom: '20px' }}>                <h5 style={{ color: '#b71c1c', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Hardness Requirements
                </h5>
                <div style={{ 
                  background: '#fafafa', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#ffcdd2' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', color: '#b71c1c' }}>Parameter</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#b71c1c' }}>Min</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#b71c1c' }}>Max</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#b71c1c' }}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hardnessSpecs.slice(0, 4).map((spec, index) => (
                        <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={{ padding: '8px', fontWeight: '500', color: '#333' }}>
                            {formatParameterName(spec.parameter || spec.name)}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                            {spec.min_value || spec.min || '-'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                            {spec.max_value || spec.max || '-'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                            {spec.unit || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Spécifications ECD */}
            {ecdSpecs && ecdSpecs.length > 0 && (
              <div>                <h5 style={{ color: '#b71c1c', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  ECD Requirements
                </h5>
                <div style={{ 
                  background: '#fafafa', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  border: '1px solid #e0e0e0'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#ffcdd2' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', color: '#b71c1c' }}>Parameter</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#b71c1c' }}>Hardness</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#b71c1c' }}>Depth Min</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#b71c1c' }}>Depth Max</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ecdSpecs.slice(0, 3).map((spec, index) => (
                        <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={{ padding: '8px', fontWeight: '500', color: '#333' }}>
                            {formatParameterName(spec.parameter || spec.name)}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                            {spec.hardness || spec.target_value || '-'} {spec.hardnessUnit || spec.unit || 'HV'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                            {spec.depthMin || spec.min_value || '-'} mm
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                            {spec.depthMax || spec.max_value || '-'} mm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Message si aucune spécification */}
            {(!hardnessSpecs || hardnessSpecs.length === 0) && (!ecdSpecs || ecdSpecs.length === 0) && (
              <div style={{ 
                textAlign: 'center', 
                padding: '30px',
                color: '#666',
                fontStyle: 'italic',
                background: '#f9f9f9',
                borderRadius: '8px'
              }}>
                No specifications available
              </div>
            )}
          </div>

          {/* Résultats de conformité */}
          <div style={{
            background: 'white',            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #fff3e0'
          }}>
            <h3 style={{ 
              color: '#ef6c00', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faClipboardCheck} style={{ color: '#ff9800' }} />
              Trial Results Summary
            </h3>
            
            {results && results.length > 0 ? (
              <div style={{ 
                background: '#fafafa', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#ffe0b2' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', color: '#e65100' }}>Parameter</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Value</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 6).map((result, index) => {
                      // Traitement des différents formats de résultats (comme dans la version précédente)
                      if (result.parameter || result.name) {
                        return (
                          <tr key={index} style={{ background: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                            <td style={{ padding: '8px', fontWeight: '500', color: '#333' }}>
                              {formatParameterName(result.parameter || result.name)}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                              {result.value !== undefined ? 
                                (typeof result.value === 'object' ? 
                                  JSON.stringify(result.value) : 
                                  result.value) 
                                : '-'}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              {result.conformity === true || result.conformity === 'conforme' ? (
                                <span style={{ 
                                  color: '#2e7d32', 
                                  fontWeight: 'bold',
                                  background: '#e8f5e8',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px'
                                }}>✓ OK</span>
                              ) : result.conformity === false || result.conformity === 'non-conforme' ? (
                                <span style={{ 
                                  color: '#d32f2f', 
                                  fontWeight: 'bold',
                                  background: '#ffebee',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px'
                                }}>✗ NOK</span>
                              ) : (
                                <span style={{ 
                                  color: '#666',
                                  background: '#f5f5f5',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px'
                                }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                      return null;
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '30px',
                color: '#666',
                fontStyle: 'italic',
                background: '#f9f9f9',
                borderRadius: '8px'
              }}>
                No results available
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Footer élégant */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <div>
          <strong>Confidential Document</strong> - ECM Industrial Analysis
        </div>
        <div>
          Generated on {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        <div>
          Page 1 of 1
        </div>
      </div>
    </div>
  );
};

export default CoverPageSection;