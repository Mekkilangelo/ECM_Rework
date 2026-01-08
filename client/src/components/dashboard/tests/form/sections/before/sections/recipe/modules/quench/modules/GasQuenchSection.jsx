import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Button, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const GasQuenchSection = ({
  formData,
  handleChange,
  handleGasQuenchSpeedAdd,
  handleGasQuenchSpeedRemove,
  handleGasQuenchPressureAdd,
  handleGasQuenchPressureRemove,
  loading,
  viewMode = false,
  readOnlyFieldStyle = {}
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
      <h5 className="mt-4 mb-2">{t('trials.before.recipeData.quenchData.gas.speedParameters')}</h5>
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('trials.before.recipeData.quenchData.common.step')}</th>
            <th>{t('trials.before.recipeData.quenchData.common.duration')} (s)</th>
            <th>{t('trials.before.recipeData.quenchData.gas.speed')} (rpm) </th>
            {!viewMode && <th style={{ width: '80px' }}>{t('common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {formData.quenchData?.gasQuenchSpeed?.sort((a, b) => a.step - b.step).map((step, index) => (
            <tr key={`gas-quench-speed-${index}`}>
              <td className="text-center align-middle">{step.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={step.duration || ''}
                  onChange={(e) => handleGasQuenchSpeedChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.speed || ''}
                  onChange={(e) => handleGasQuenchSpeedChange(index, 'speed', e.target.value)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </td>
              {!viewMode && (
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
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      {!viewMode && (
        <div className="text-end mb-3">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleGasQuenchSpeedAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('trials.before.recipeData.quenchData.common.addStep')}
          </Button>
        </div>
      )}

      <h5 className="mt-4 mb-2">{t('trials.before.recipeData.quenchData.gas.pressureParameters')}</h5>
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('trials.before.recipeData.quenchData.common.step')}</th>
            <th>{t('trials.before.recipeData.quenchData.common.duration')} (s)</th>
            <th>{t('trials.before.recipeData.quenchData.gas.pressure')} (mb)</th>
            {!viewMode && <th style={{ width: '80px' }}>{t('common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {formData.quenchData?.gasQuenchPressure?.sort((a, b) => a.step - b.step).map((step, index) => (
            <tr key={`gas-quench-pressure-${index}`}>
              <td className="text-center align-middle">{step.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={step.duration || ''}
                  onChange={(e) => handleGasQuenchPressureChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.pressure || ''}
                  onChange={(e) => handleGasQuenchPressureChange(index, 'pressure', e.target.value)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </td>
              {!viewMode && (
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
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      {!viewMode && (
        <div className="text-end mb-3">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleGasQuenchPressureAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('trials.before.recipeData.quenchData.common.addStep')}
          </Button>
        </div>
      )}
    </>
  );
};

export default GasQuenchSection;
