import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const GasQuenchSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  handleGasQuenchSpeedAdd,
  handleGasQuenchSpeedRemove,
  handleGasQuenchPressureAdd,
  handleGasQuenchPressureRemove,
  loading,
  selectStyles
}) => {
  const { t } = useTranslation();

  const handleGasQuenchSpeedChange = (index, field, value) => {
    const updatedGasQuenchSpeed = [...formData.quenchData.gasQuenchSpeed];
    updatedGasQuenchSpeed[index] = { ...updatedGasQuenchSpeed[index], [field]: value };
    handleChange({
      target: {
        name: 'quenchData.gasQuenchSpeed',
        value: updatedGasQuenchSpeed
      }
    });
  };

  const handleGasQuenchPressureChange = (index, field, value) => {
    const updatedGasQuenchPressure = [...formData.quenchData.gasQuenchPressure];
    updatedGasQuenchPressure[index] = { ...updatedGasQuenchPressure[index], [field]: value };
    handleChange({
      target: {
        name: 'quenchData.gasQuenchPressure',
        value: updatedGasQuenchPressure
      }
    });
  };

  return (
    <>
      <h5 className="mt-4 mb-2">{t('tests.before.recipeData.quenchData.gas.speedParameters')}</h5>
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('tests.before.recipeData.quenchData.common.step')}</th>
            <th>{t('tests.before.recipeData.quenchData.common.duration')}</th>
            <th>{t('tests.before.recipeData.quenchData.gas.speed')}</th>
            <th style={{ width: '80px' }}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {formData.quenchData?.gasQuenchSpeed?.map((step, index) => (
            <tr key={`gas-quench-speed-${index}`}>
              <td className="text-center align-middle">{step.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={step.duration || ''}
                  onChange={(e) => handleGasQuenchSpeedChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.speed || ''}
                  onChange={(e) => handleGasQuenchSpeedChange(index, 'speed', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td className="text-center">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleGasQuenchSpeedRemove(index)}
                  disabled={formData.quenchData?.gasQuenchSpeed?.length <= 1 || loading}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="text-end mb-3">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleGasQuenchSpeedAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.before.recipeData.quenchData.common.addStep')}
        </Button>
      </div>

      <h5 className="mt-4 mb-2">{t('tests.before.recipeData.quenchData.gas.pressureParameters')}</h5>
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('tests.before.recipeData.quenchData.common.step')}</th>
            <th>{t('tests.before.recipeData.quenchData.common.duration')}</th>
            <th>{t('tests.before.recipeData.quenchData.gas.pressure')}</th>
            <th style={{ width: '80px' }}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {formData.quenchData?.gasQuenchPressure?.map((step, index) => (
            <tr key={`gas-quench-pressure-${index}`}>
              <td className="text-center align-middle">{step.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={step.duration || ''}
                  onChange={(e) => handleGasQuenchPressureChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.pressure || ''}
                  onChange={(e) => handleGasQuenchPressureChange(index, 'pressure', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td className="text-center">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleGasQuenchPressureRemove(index)}
                  disabled={formData.quenchData?.gasQuenchPressure?.length <= 1 || loading}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="text-end mb-3">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleGasQuenchPressureAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.before.recipeData.quenchData.common.addStep')}
        </Button>
      </div>
    </>
  );
};

export default GasQuenchSection;
