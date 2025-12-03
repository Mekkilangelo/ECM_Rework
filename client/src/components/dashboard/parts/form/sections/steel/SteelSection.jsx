import React, { useState, useEffect } from 'react';
import { Form, Button, InputGroup, Collapse } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import steelService from '../../../../../../services/steelService';
import { useTranslation } from 'react-i18next';
import './SteelSection.css';

const SteelSection = ({
  formData,
  handleSelectChange,
  getSelectedOption,
  steelOptions,
  loading,
  selectStyles,
  onOpenSteelModal,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();
  const [selectedSteelInfo, setSelectedSteelInfo] = useState(null);
  const [fetchingSteelInfo, setFetchingSteelInfo] = useState(false);
  const [showSteelDetails, setShowSteelDetails] = useState(false);

  // Style compact pour les Select
  const compactSelectStyles = {
    ...selectStyles,
    container: (provided) => ({
      ...provided,
      width: '100%',
    }),
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      height: '38px',
      fontSize: '0.9rem',
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '38px',
      padding: '0 6px',
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '38px',
    }),
  };

  // Styles modifiés pour le mode lecture seule
  const customSelectStyles = viewMode ? {
    ...compactSelectStyles,
    control: (provided) => ({
      ...provided,
      ...readOnlyFieldStyle,
      cursor: 'default'
    }),
    dropdownIndicator: () => ({ display: 'none' }),
    indicatorSeparator: () => ({ display: 'none' })
  } : compactSelectStyles;  // Récupérer les détails de l'acier sélectionné
  useEffect(() => {
    const fetchSteelDetails = async () => {
      if (!formData.steel) {
        setSelectedSteelInfo(null);
        setShowSteelDetails(false);
        return;
      }

      // Trouver le nodeId correspondant à l'acier sélectionné
      const selectedOption = steelOptions.find(option => option.value === formData.steel);
      if (!selectedOption || !selectedOption.nodeId) {
        setSelectedSteelInfo(null);
        return;
      }      try {
        setFetchingSteelInfo(true);
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          
        }
        
        // Utiliser getSteel au lieu de getSteelById
        const response = await steelService.getSteel(selectedOption.nodeId);
        
        if (response) {
          // La structure de la réponse : { success: true, data: { id, name, steel: {...} } }
          let steelData = null;
          
          // Simplification du parsing
          if (response.success && response.data && response.data.steel) {
            // Format API standard avec succès
            steelData = response.data.steel;
          } else if (response.data && response.data.steel) {
            // Format avec data.steel
            steelData = response.data.steel;
          } else if (response.steel) {
            // Format direct avec steel (minuscule)
            steelData = response.steel;
          } else if (response.Steel) {
            // Format direct avec Steel (majuscule) - ancienne structure
            steelData = response.Steel;
          }
          
          if (isDev && steelData) {
            
            
            
            
            
            
          }

          if (steelData) {// Formatter la composition chimique depuis le champ chemistery (JSON)
          let composition = '';
          if (steelData.chemistery && Array.isArray(steelData.chemistery) && steelData.chemistery.length > 0) {
            // Le format est un tableau d'objets avec { element, value, min_value, max_value }
            composition = steelData.chemistery
              .map(chem => {
                // Extraire juste le symbole chimique (avant le " - ")
                const elementSymbol = chem.element ? chem.element.split(' - ')[0] : '';
                
                // Déterminer la valeur à afficher
                if (chem.value !== null && chem.value !== undefined) {
                  // Valeur exacte
                  return `${elementSymbol}: ${chem.value}%`;
                } else if (chem.min_value !== null && chem.max_value !== null) {
                  // Plage de valeurs
                  if (chem.min_value === chem.max_value) {
                    return `${elementSymbol}: ${chem.min_value}%`;
                  } else {
                    return `${elementSymbol}: ${chem.min_value}-${chem.max_value}%`;
                  }
                } else if (chem.min_value !== null) {
                  // Valeur minimum seulement
                  return `${elementSymbol}: >${chem.min_value}%`;
                } else if (chem.max_value !== null) {
                  // Valeur maximum seulement
                  return `${elementSymbol}: <${chem.max_value}%`;
                } else {
                  // Pas de valeur définie
                  return `${elementSymbol}: ?%`;
                }
              })
              .join(', ');
          }            // Formatter les équivalents depuis le champ equivalents (JSON)
            let equivalents = '';
            if (steelData.equivalents && Array.isArray(steelData.equivalents) && steelData.equivalents.length > 0) {
              // Limiter le nombre de requêtes pour éviter les surcharges
              const maxEquivalents = 3; // Réduire à 3 équivalents maximum
              const equivalentsToProcess = steelData.equivalents.slice(0, maxEquivalents);
              
              // Récupérer les grades des aciers équivalents
              const equivalentGrades = [];
              try {
                const promises = equivalentsToProcess.map(async (equiv) => {
                  try {
                    const steelId = equiv.steel_id || equiv.steelId || equiv.id;
                    if (steelId) {
                      const equivResponse = await steelService.getSteel(steelId);
                      let equivData = null;
                      
                      // Utiliser la même logique de parsing simplifiée
                      if (equivResponse && equivResponse.success && equivResponse.data && equivResponse.data.steel) {
                        equivData = equivResponse.data.steel;
                      } else if (equivResponse && equivResponse.data && equivResponse.data.steel) {
                        equivData = equivResponse.data.steel;
                      } else if (equivResponse && equivResponse.steel) {
                        equivData = equivResponse.steel;
                      } else if (equivResponse && equivResponse.Steel) {
                        equivData = equivResponse.Steel;
                      }
                      
                      if (equivData && equivData.grade) {
                        return equivData.grade;
                      }
                    }
                    return null;
                  } catch (error) {
                    console.warn('Erreur lors de la récupération de l\'équivalent:', error);
                    return null;
                  }
                });
                
                const results = await Promise.all(promises);
                equivalentGrades.push(...results.filter(grade => grade !== null));
                
                if (equivalentGrades.length > 0) {
                  equivalents = equivalentGrades.join(', ');
                  if (steelData.equivalents.length > maxEquivalents) {
                    equivalents += ` (+${steelData.equivalents.length - maxEquivalents} autres)`;
                  }
                } else {
                  equivalents = t('parts.steel.noEquivalents');
                }
              } catch (error) {
                console.warn('Erreur lors du traitement des équivalents:', error);
                equivalents = t('parts.steel.noEquivalents');
              }
            } else {
              equivalents = t('parts.steel.noEquivalents');
            }

            // Traiter la famille avec traduction
            let family = steelData.family || '';
            const familyTranslations = {
              'Low_alloyed': 'Faiblement allié',
              'Stainless_steel': 'Acier inoxydable',
              'Tool_steel': 'Acier à outils',
              'Construction_steel': 'Acier de construction',
              'Austenitic': 'Austénitique',
              'Ferritic': 'Ferritique',
              'Martensitic': 'Martensitique',
              'Duplex': 'Duplex',
              'HSS': 'HSS',
              'HCC': 'HCC'
            };
            family = familyTranslations[family] || family.replace(/_/g, ' ');

            // Traiter le standard avec formatage
            let standard = steelData.standard || '';
            const standardFormatted = {
              'GOST_1050': 'GOST 1050',
              'EN_10020': 'EN 10020',
              'ASTM_AISI': 'ASTM/AISI'
            };
            standard = standardFormatted[standard] || standard.replace(/_/g, ' ');

            setSelectedSteelInfo({
              grade: steelData.grade || '',
              family: family || t('parts.steel.notSpecified'),
              standard: standard || t('parts.steel.notSpecified'),
              composition: composition || t('parts.steel.notSpecified'),
              equivalents: equivalents
            });
            
            // Ouvrir automatiquement la section des détails quand un acier est chargé
            setShowSteelDetails(true);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des détails de l\'acier:', error);
        setSelectedSteelInfo(null);
      } finally {
        setFetchingSteelInfo(false);
      }
    };

    fetchSteelDetails();
  }, [formData.steel, steelOptions, t]);

  return (
    <>
      <h6 className="text-muted mb-3">{t('parts.steel.specifications')}</h6>
      <div className="row g-2 mb-3">
        <div className="col-md-6">
          <Form.Group>
            <Form.Label className="small">{t('parts.steel.steelType')}</Form.Label>
            <div className="d-flex">
              <div className="flex-grow-1 me-2">
                <Select
                  name="steel"
                  value={getSelectedOption(steelOptions, formData.steel)}
                  onChange={(option) => handleSelectChange(option, { name: 'steel' })}
                  options={steelOptions}
                  isClearable={!viewMode}
                  styles={customSelectStyles}
                  placeholder={t('parts.steel.selectOrAddSteel')}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isLoading={loading}
                  isDisabled={viewMode}
                />
              </div>
              {!viewMode && (
                <Button
                  variant="outline-primary"
                  onClick={onOpenSteelModal}
                  title={t('parts.steel.addNewSteel')}
                  size="sm"
                  className="align-self-center"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </Button>
              )}
            </div>
          </Form.Group>
        </div>
      </div>      {/* Informations détaillées sur l'acier sélectionné (collapsible) */}
      {formData.steel && (
        <div className="mb-3">
          {/* En-tête avec bouton de toggle */}
          <div 
            className="steel-info-header d-flex align-items-center justify-content-between p-2 bg-light rounded cursor-pointer border"
            onClick={() => setShowSteelDetails(!showSteelDetails)}
            style={{ cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center">
              <i className="fas fa-info-circle me-2 text-primary"></i>
              <span className="fw-bold text-primary">
                {t('parts.steel.detailedInfo')} - {selectedSteelInfo?.grade || t('parts.steel.loading')}
              </span>
            </div>
            <FontAwesomeIcon 
              icon={showSteelDetails ? faChevronUp : faChevronDown} 
              className="text-muted chevron-icon"
            />
          </div>
          
          {/* Contenu collapsible */}
          <Collapse in={showSteelDetails}>
            <div>
              <div className="steel-info-container p-3 bg-white border border-top-0 rounded-bottom">
                {fetchingSteelInfo ? (
                  <div className="text-center py-3">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {t('parts.steel.loadingInfo')}
                  </div>
                ) : selectedSteelInfo ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="info-item">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          <i className="fas fa-layer-group me-1"></i>
                          {t('parts.steel.family')}
                        </Form.Label>
                        <div className="info-value p-2 bg-light rounded border">
                          {selectedSteelInfo.family}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="info-item">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          <i className="fas fa-certificate me-1"></i>
                          {t('parts.steel.standard')}
                        </Form.Label>
                        <div className="info-value p-2 bg-light rounded border">
                          {selectedSteelInfo.standard}
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-item">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          <i className="fas fa-flask me-1"></i>
                          {t('parts.steel.chemicalComposition')}
                        </Form.Label>
                        <div className="info-value p-2 bg-light rounded border">
                          <small className="text-muted">
                            {selectedSteelInfo.composition}
                          </small>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="info-item">
                        <Form.Label className="small fw-bold text-muted mb-1">
                          <i className="fas fa-exchange-alt me-1"></i>
                          {t('parts.steel.equivalents')}
                        </Form.Label>
                        <div className="info-value p-2 bg-light rounded border">
                          <small className="text-muted">
                            {selectedSteelInfo.equivalents}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-muted">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {t('parts.steel.unableToLoad')}
                  </div>
                )}
              </div>
            </div>
          </Collapse>
        </div>
      )}
    </>
  );
};

export default SteelSection;
