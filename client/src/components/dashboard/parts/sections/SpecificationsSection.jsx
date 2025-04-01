import React from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const SpecificationsSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  steelOptions,
  getHardnessUnitOptions,
  loading,
  selectStyles,
  onOpenSteelModal
}) => {
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

  return (
    <>
      {/* Section Duretés */}
      <h6 className="text-muted mb-2">Spécifications de dureté</h6>
      
      {/* Dureté à cœur */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">Dureté à cœur</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Min</InputGroup.Text>
            <Form.Control
              type="number"
              name="coreHardnessMin"
              value={formData.coreHardnessMin}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Max</InputGroup.Text>
            <Form.Control
              type="number"
              name="coreHardnessMax"
              value={formData.coreHardnessMax}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <Select
            name="coreHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.coreHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'coreHardnessUnit' })}
            options={getHardnessUnitOptions()}
            isClearable
            styles={compactSelectStyles}
            placeholder="Unité"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
          />
        </div>
      </div>
      
      {/* Dureté en surface */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">Dureté en surface</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Min</InputGroup.Text>
            <Form.Control
              type="number"
              name="surfaceHardnessMin"
              value={formData.surfaceHardnessMin}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Max</InputGroup.Text>
            <Form.Control
              type="number"
              name="surfaceHardnessMax"
              value={formData.surfaceHardnessMax}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <Select
            name="surfaceHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.surfaceHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'surfaceHardnessUnit' })}
            options={getHardnessUnitOptions()}
            isClearable
            styles={compactSelectStyles}
            placeholder="Unité"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
          />
        </div>
      </div>
      
      {/* Nouveau: Dureté PdD */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">Dureté PdD</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Min</InputGroup.Text>
            <Form.Control
              type="number"
              name="toothHardnessMin"
              value={formData.toothHardnessMin || ''}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Max</InputGroup.Text>
            <Form.Control
              type="number"
              name="toothHardnessMax"
              value={formData.toothHardnessMax || ''}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <Select
            name="toothHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.toothHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'toothHardnessUnit' })}
            options={getHardnessUnitOptions()}
            isClearable
            styles={compactSelectStyles}
            placeholder="Unité"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
          />
        </div>
      </div>
      
      {/* ECD */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">Profondeur ECD</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Min</InputGroup.Text>
            <Form.Control
              type="number"
              name="ecdDepthMin"
              value={formData.ecdDepthMin}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>Max</InputGroup.Text>
            <Form.Control
              type="number"
              name="ecdDepthMax"
              value={formData.ecdDepthMax}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <InputGroup size="sm">
            <InputGroup.Text>Dureté</InputGroup.Text>
            <Form.Control
              type="number"
              name="ecdHardness"
              value={formData.ecdHardness}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
            <Select
              name="ecdHardnessUnit"
              value={getSelectedOption(getHardnessUnitOptions(), formData.ecdHardnessUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'ecdHardnessUnit' })}
              options={getHardnessUnitOptions()}
              isClearable
              styles={compactSelectStyles}
              placeholder="Unité"
              className="react-select-container flex-grow-1"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </InputGroup>
        </div>
      </div>
      
      {/* Acier et Description */}
      <div className="row g-2">
        <div className="col-md-6">
          <Form.Group>
            <Form.Label className="small">Acier</Form.Label>
            <div className="d-flex">
              <div className="flex-grow-1 me-2">
                <Select
                  name="steel"
                  value={getSelectedOption(steelOptions, formData.steel)}
                  onChange={(option) => handleSelectChange(option, { name: 'steel' })}
                  options={steelOptions}
                  isClearable
                  styles={compactSelectStyles}
                  placeholder="Sélectionner un acier"
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isLoading={loading}
                />
              </div>
              <Button 
                variant="outline-primary"
                onClick={onOpenSteelModal}
                title="Ajouter un nouvel acier"
                size="sm"
                className="align-self-center"
              >
                <FontAwesomeIcon icon={faPlus} />
              </Button>
            </div>
          </Form.Group>
        </div>
        <div className="col-md-6">
          <Form.Group>
            <Form.Label className="small">Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              size="sm"
            />
          </Form.Group>
        </div>
      </div>
    </>
  );
};

export default SpecificationsSection;
