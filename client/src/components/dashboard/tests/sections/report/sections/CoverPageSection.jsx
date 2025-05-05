import React, { useEffect } from 'react';
import { Row, Col, Table } from 'react-bootstrap';
import ReportPageHeader from './ReportPageHeader';

const CoverPageSection = ({ testData, partData, clientData }) => {
  // Vérifier que les données nécessaires sont présentes
  if (!testData || !partData) {
    return (
      <div className="text-center p-5">
        <p>Données insuffisantes pour afficher la page de garde</p>
      </div>
    );
  }

  // Fonction pour déboguer la structure de l'ECD
  useEffect(() => {
    if (partData && partData.specifications && partData.specifications.ecd) {
      console.log("=== ECD Debug Info ===");
      console.log("ECD structure:", partData.specifications.ecd);
      console.log("ECD direct:", partData.ecd);
    }
  }, [partData]);

  // Récupérer les spécifications depuis les données de la pièce (comme dans ControlSection)
  // Peut être un tableau ou un objet selon la structure des données
  const specs = Array.isArray(partData.specifications) 
    ? partData.specifications 
    : (typeof partData.specifications === 'object' && partData.specifications !== null)
      ? Object.entries(partData.specifications).map(([key, value]) => {
          // Formater proprement les valeurs selon leur type
          let targetValue = '';
          let minValue = '';
          let maxValue = '';
          let unit = '';
          
          if (typeof value === 'object' && value !== null) {
            targetValue = value.target || value.value || '';
            minValue = value.min !== undefined ? value.min : '';
            maxValue = value.max !== undefined ? value.max : '';
            unit = value.unit || '';
          } else {
            targetValue = value;
          }
          
          return {
            parameter: key,
            target_value: targetValue,
            min_value: minValue,
            max_value: maxValue,
            unit: unit
          };
        })
      : [];
  
  // Récupérer les résultats depuis les données du test (comme dans ControlSection)
  const results = testData.results || (testData.results_data?.results) || [];

  // Récupérer et formater le poids de la charge
  const formatLoadWeight = () => {
    // Vérifier si les données de charge sont présentes
    const loadData = testData.loadData || {};
    
    // Si le poids est défini dans les données de charge
    if (loadData.weight && loadData.weight.value !== undefined) {
      // Vérifier si l'unité est en grammes et convertir en kg si nécessaire
      let value = loadData.weight.value;
      let unit = loadData.weight.unit || 'kg';
      
      // Si l'unité est en grammes, convertir en kg
      if (unit.toLowerCase() === 'g') {
        value = (value / 1000).toFixed(2);
        unit = 'kg';
      }
      
      return `${value} ${unit}`;
    }
    return 'Non spécifié';
  };
  
  // Obtenir le poids formaté
  const loadWeight = formatLoadWeight();

  // Reformater les données de test pour l'en-tête
  const formattedTestData = {
    testCode: testData.testCode || testData.test_code || '',
    processType: testData.processType || testData.process_type || '',
    loadNumber: testData.loadNumber || testData.load_number || '',
    testDate: testData.testDate || testData.test_date || null
  };

  // Vérification de la console pour le débogage
  console.log("CoverPageSection - PartData:", partData);
  console.log("CoverPageSection - Specs:", specs);
  console.log("CoverPageSection - Results:", results);

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
    if (!paramName) return 'Paramètre';
    
    // Convertir les nomenclatures spéciales
    if (paramName.toLowerCase().includes('surface')) return 'Dureté Surface';
    if (paramName.toLowerCase().includes('coeur') || paramName.toLowerCase().includes('core')) return 'Dureté Coeur';
    if (paramName.toLowerCase().includes('pdd') || paramName.toLowerCase().includes('pied')) return 'Dureté PdD';
    if (paramName.toLowerCase() === 'toothhardness') return 'Dureté PdD'; // Ajout explicite pour toothHardness
    if (paramName.toLowerCase() === 'ecd') return 'ECD';
    
    // Formater les paramètres ordinaires avec une première lettre majuscule
    return paramName.charAt(0).toUpperCase() + paramName.slice(1);
  };

  return (
    <div className="cover-page" style={{ minHeight: '100%', position: 'relative', padding: '15px' }}>
      {/* En-tête du rapport */}
      <ReportPageHeader testData={formattedTestData} clientData={clientData} />

      {/* Titre centré */}
      <div className="text-center mb-5 mt-4">
        <h1 style={{ fontSize: '28px', color: '#dc3545', fontWeight: 'bold', borderBottom: '2px solid #dc3545', paddingBottom: '10px', display: 'inline-block' }}>
          RAPPORT D'ESSAI
        </h1>
      </div>

      {/* Section principale */}
      <Row className="mb-5">
        {/* Informations de la pièce (côté gauche) */}
        <Col md={6}>
          <div className="p-3 border rounded h-100" style={{ backgroundColor: '#f8f9fa', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h4 style={{ color: '#dc3545', borderBottom: '2px solid #dc3545', paddingBottom: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
              Pièce
            </h4>
            <table className="table table-borderless">
              <tbody>
                <tr>
                  <td className="fw-bold" style={{ width: '40%', color: '#495057' }}>Désignation:</td>
                  <td>{partData.designation || 'Non spécifiée'}</td>
                </tr>
                <tr>
                  <td className="fw-bold" style={{ color: '#495057' }}>Désignation client:</td>
                  <td>{partData.clientDesignation || partData.client_designation || 'Non spécifiée'}</td>
                </tr>
                <tr>
                  <td className="fw-bold" style={{ color: '#495057' }}>Acier:</td>
                  <td>{partData.steel?.designation || 'Non spécifié'}</td>
                </tr>
                {partData.reference && (
                  <tr>
                    <td className="fw-bold" style={{ color: '#495057' }}>Référence:</td>
                    <td>{partData.reference}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Col>

        {/* Informations de la charge (côté droit) */}
        <Col md={6}>
          <div className="p-3 border rounded h-100" style={{ backgroundColor: '#f8f9fa', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h4 style={{ color: '#dc3545', borderBottom: '2px solid #dc3545', paddingBottom: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
              Charge
            </h4>
            <table className="table table-borderless">
              <tbody>
                <tr>
                  <td className="fw-bold" style={{ width: '40%', color: '#495057' }}>Numéro de test:</td>
                  <td>{testData.testCode || testData.test_code || 'Non spécifié'}</td>
                </tr>
                <tr>
                  <td className="fw-bold" style={{ color: '#495057' }}>Date du test:</td>
                  <td>
                    {testData.testDate || testData.test_date 
                      ? new Date(testData.testDate || testData.test_date).toLocaleDateString('fr-FR') 
                      : 'Non spécifiée'}
                  </td>
                </tr>
                <tr>
                  <td className="fw-bold" style={{ color: '#495057' }}>Poids (kg):</td>
                  <td>{loadWeight}</td>
                </tr>
                <tr>
                  <td className="fw-bold" style={{ color: '#495057' }}>Client:</td>
                  <td>{clientData?.name || 'Non spécifié'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Col>
      </Row>

      {/* Section inférieure */}
      <Row className="mt-5">
        {/* Spécifications (bas gauche) */}
        <Col md={6}>
          <div className="p-3 border rounded h-100" style={{ backgroundColor: '#f8f9fa', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h4 style={{ color: '#dc3545', borderBottom: '2px solid #dc3545', paddingBottom: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
              Spécifications
            </h4>
            
            {/* Section pour les spécifications spéciales comme dans ControlSection */}
            <div style={{ marginBottom: '15px' }}>
                {/* Duretés standard */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {partData.surfaceHardness && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <strong>Dureté Surface:</strong> {partData.surfaceHardness.min || ''}-{partData.surfaceHardness.max || ''} {partData.surfaceHardness.unit || 'HV'}
                    </div>
                  )}
                  {partData.coreHardness && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <strong>Dureté Coeur:</strong> {partData.coreHardness.min || ''}-{partData.coreHardness.max || ''} {partData.coreHardness.unit || 'HV'}
                    </div>
                  )}
                  {partData.toothHardness && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <strong>Dureté PdD:</strong> {partData.toothHardness.min || ''}-{partData.toothHardness.max || ''} {partData.toothHardness.unit || 'HV'}
                    </div>
                  )}
                </div>
                
                {/* Bloc ECD sous forme de tableau aligné avec le reste */}
                {(partData.ecd || (partData.specifications && partData.specifications.ecd)) && (
                  <div style={{ marginTop: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e9ecef' }}>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>Paramètre</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Min</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Max</th>
                          <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Unité</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>
                            <strong>ECD {partData.ecd ? partData.ecd.hardness : (partData.specifications && partData.specifications.ecd ? partData.specifications.ecd.hardness : '')} {partData.ecd ? (partData.ecd.unit || 'HV') : (partData.specifications && partData.specifications.ecd ? (partData.specifications.ecd.unit || 'HV') : 'HV')}</strong>
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {partData.ecd ? partData.ecd.depthMin : (partData.specifications && partData.specifications.ecd ? partData.specifications.ecd.depthMin : '')}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {partData.ecd ? partData.ecd.depthMax : (partData.specifications && partData.specifications.ecd ? partData.specifications.ecd.depthMax : '')}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            mm
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
            
            {specs && specs.length > 0 ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e9ecef' }}>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Paramètre</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Min</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Max</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Unité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specs.map((spec, index) => {
                      // Ne pas afficher l'ECD dans ce tableau puisqu'il est déjà affiché plus haut
                      if (spec.parameter && spec.parameter.toLowerCase() === 'ecd') {
                        return null;
                      }
                      
                      return (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>
                            {formatParameterName(spec.parameter || spec.name)}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {formatSpecValue(spec.min_value !== undefined ? spec.min_value : (spec.tolerance_min !== undefined ? spec.tolerance_min : spec.toleranceMin))}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {formatSpecValue(spec.max_value !== undefined ? spec.max_value : (spec.tolerance_max !== undefined ? spec.tolerance_max : spec.toleranceMax))}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {spec.unit || ''}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted fst-italic text-center p-4">Aucune spécification disponible</p>
            )}
          </div>
        </Col>

        {/* Résultats (bas droite) */}
        <Col md={6}>
          <div className="p-3 border rounded h-100" style={{ backgroundColor: '#f8f9fa', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h4 style={{ color: '#dc3545', borderBottom: '2px solid #dc3545', paddingBottom: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
              Résultats
            </h4>
            {results && results.length > 0 ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e9ecef' }}>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Paramètre</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Valeur mesurée</th>
                      <th style={{ padding: '10px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>Conformité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => {
                      // Pour les résultats qui contiennent directement un paramètre et une valeur
                      if (result.parameter || result.name) {
                        return (
                          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                            <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>
                              {formatParameterName(result.parameter || result.name)}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                              {result.value !== undefined ? 
                                (typeof result.value === 'object' ? 
                                  JSON.stringify(result.value) : 
                                  result.value) 
                                : '-'}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                              {result.conformity === true || result.conformity === 'conforme' ? (
                                <span style={{ color: '#28a745', fontWeight: 'bold' }}>Conforme</span>
                              ) : result.conformity === false || result.conformity === 'non-conforme' ? (
                                <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Non conforme</span>
                              ) : (
                                <span style={{ color: '#6c757d' }}>Non évalué</span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                      
                      // Pour les résultats qui contiennent des points de dureté (comme dans ControlSection)
                      if (result.hardness_points && result.hardness_points.length > 0) {
                        return result.hardness_points.map((point, pointIdx) => (
                          <tr key={`${index}-${pointIdx}`} style={{ backgroundColor: (index + pointIdx) % 2 === 0 ? 'white' : '#f8f9fa' }}>
                            <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>
                              {point.location === 'surface' ? 'Dureté Surface' : 
                               point.location === 'pdd' ? 'Dureté PdD' : 
                               point.location === 'coeur' ? 'Dureté Coeur' : 
                               point.location || 'Point de dureté'}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                              {point.value !== undefined ? point.value : '-'} {point.unit || result.hardness_unit || 'HV'}
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                              {point.conformity === true ? (
                                <span style={{ color: '#28a745', fontWeight: 'bold' }}>Conforme</span>
                              ) : point.conformity === false ? (
                                <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Non conforme</span>
                              ) : (
                                <span style={{ color: '#6c757d' }}>Non évalué</span>
                              )}
                            </td>
                          </tr>
                        ));
                      }
                      
                      // Pour les résultats ECD
                      if (result.ecd) {
                        return [
                          result.ecd.tooth_flank && (
                            <tr key={`${index}-flank`} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                              <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>
                                ECD Flanc de dent
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                {result.ecd.tooth_flank.distance !== undefined ? result.ecd.tooth_flank.distance : '-'} {result.ecd.tooth_flank.unit || 'mm'}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                {result.ecd.tooth_flank.conformity === true ? (
                                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>Conforme</span>
                                ) : result.ecd.tooth_flank.conformity === false ? (
                                  <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Non conforme</span>
                                ) : (
                                  <span style={{ color: '#6c757d' }}>Non évalué</span>
                                )}
                              </td>
                            </tr>
                          ),
                          result.ecd.tooth_root && (
                            <tr key={`${index}-root`} style={{ backgroundColor: (index + 1) % 2 === 0 ? 'white' : '#f8f9fa' }}>
                              <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>
                                ECD Racine de dent
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                {result.ecd.tooth_root.distance !== undefined ? result.ecd.tooth_root.distance : '-'} {result.ecd.tooth_root.unit || 'mm'}
                              </td>
                              <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                                {result.ecd.tooth_root.conformity === true ? (
                                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>Conforme</span>
                                ) : result.ecd.tooth_root.conformity === false ? (
                                  <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Non conforme</span>
                                ) : (
                                  <span style={{ color: '#6c757d' }}>Non évalué</span>
                                )}
                              </td>
                            </tr>
                          )
                        ].filter(Boolean); // Filtrer les éléments null
                      }
                      
                      // Si aucun format spécifique n'est reconnu
                      return (
                        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'left' }}>
                            Résultat #{index + 1}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }} colSpan="2">
                            {typeof result === 'object' ? JSON.stringify(result).substring(0, 50) + '...' : result}
                          </td>
                        </tr>
                      );
                    }).flat()} {/* Aplatir le tableau pour les résultats multiples */}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted fst-italic text-center p-4">Aucun résultat disponible</p>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CoverPageSection;