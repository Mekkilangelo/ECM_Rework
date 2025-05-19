import React, { useState, useEffect } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import steelService from '../../../../../../services/steelService';
import { useTranslation } from 'react-i18next';

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
  } : compactSelectStyles;

  // Récupérer les détails de l'acier sélectionné
  useEffect(() => {
    const fetchSteelDetails = async () => {
      if (!formData.steel) {
        setSelectedSteelInfo(null);
        return;
      }

      // Trouver le nodeId correspondant à l'acier sélectionné
      const selectedOption = steelOptions.find(option => option.value === formData.steel);
      if (!selectedOption || !selectedOption.nodeId) {
        setSelectedSteelInfo(null);
        return;
      }

      try {
        setFetchingSteelInfo(true);
        const response = await steelService.getSteelById(selectedOption.nodeId);

        if (response && response.data) {
          const steelData = response.data.Steel || response.data;

          // Formatter la composition chimique
          let composition = '';
          if (steelData.elements && Array.isArray(steelData.elements)) {
            composition = steelData.elements
              .map(elem => {
                const element = elem.element.split(' - ')[0]; // Prendre seulement le symbole chimique
                const min = elem.min_value !== null ? elem.min_value : '?';
                const max = elem.max_value !== null ? elem.max_value : '?';

                if (min === max) {
                  return `${element}: ${min}%`;
                } else {
                  return `${element}: ${min}-${max}%`;
                }
              })
              .join(', ');
          }

          // Formatter les équivalents
          let equivalents = '';
          if (steelData.equivalents && Array.isArray(steelData.equivalents) && steelData.equivalents.length > 0) {
            equivalents = steelData.equivalents.join(', ');
          } else {
            equivalents = t('parts.steel.noEquivalents');
          }

          // Traiter la famille
          let family = steelData.family || '';
          // Convertir Stainless_steel en Acier inoxydable, etc.
          family = family
            .replace('Stainless_steel', t('parts.steel.families.stainlessSteel'))
            .replace('Carbon_steel', t('parts.steel.families.carbonSteel'))
            .replace('Tool_steel', t('parts.steel.families.toolSteel'))
            .replace('Alloy_steel', t('parts.steel.families.alloySteel'))
            .replace('_', ' ');

          // Traiter le standard
          let standard = steelData.standard || '';
          standard = standard.replace('_', ' ');

          setSelectedSteelInfo({
            grade: steelData.grade || '',
            family: family,
            standard: standard,
            composition: composition || t('parts.steel.notSpecified'),
            equivalents: equivalents
          });
        }
      } catch (error) {
        console.error(t('parts.steel.fetchError'), error);
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
      </div>

      {/* Informations détaillées sur l'acier sélectionné (en lecture seule) */}
      {formData.steel && (
        <div className="steel-info-container p-3 bg-light rounded mb-3">
          {fetchingSteelInfo ? (
            <div className="text-center py-3">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {t('parts.steel.loadingInfo')}
            </div>
          ) : selectedSteelInfo ? (
            <div className="row g-2">
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold">{t('parts.steel.family')}</Form.Label>
                  <Form.Control
                    plaintext
                    readOnly
                    value={selectedSteelInfo.family || t('parts.steel.notSpecified')}
                    className="py-0"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold">{t('parts.steel.standard')}</Form.Label>
                  <Form.Control
                    plaintext
                    readOnly
                    value={selectedSteelInfo.standard || t('parts.steel.notSpecified')}
                    className="py-0"
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold">{t('parts.steel.chemicalComposition')}</Form.Label>
                  <Form.Control
                    plaintext
                    readOnly
                    value={selectedSteelInfo.composition}
                    className="py-0"
                  />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('parts.steel.equivalents')}</Form.Label>
                  <Form.Control
                    plaintext
                    readOnly
                    value={selectedSteelInfo.equivalents}
                    className="py-0"
                  />
                </Form.Group>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-muted">
              {t('parts.steel.unableToLoad')}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SteelSection;
