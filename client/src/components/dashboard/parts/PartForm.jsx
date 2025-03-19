import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import axios from 'axios';
import { useNavigation } from '../../../context/NavigationContext';
import enumService from '../../../services/enumService';
import steelService from '../../../services/steelService';

const PartForm = ({ onClose, onPartCreated }) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.orderId;
  
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    // Dimensions
    length: '',
    width: '',
    height: '',
    dimensionsUnit: '',
    diameterIn: '',
    diameterOut: '',
    diameterUnit: '',
    weight: '',
    weightUnit: '',
    // Specifications
    coreHardnessMin: '',
    coreHardnessMax: '',
    coreHardnessUnit: '',
    surfaceHardnessMin: '',
    surfaceHardnessMax: '',
    surfaceHardnessUnit: '',
    ecdDepthMin: '',
    ecdDepthMax: '',
    ecdHardness: '',
    ecdHardnessUnit: '',
    steel: '',
    description: ''
  });
  
  const [designationOptions, setDesignationOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [steelOptions, setSteelOptions] = useState([]);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Fetch options for select fields
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Utiliser les services existants
        const units = await enumService.getUnits();
        const steels = await steelService.getSteelGrades();
        const designations = await enumService.getDesignations();
        
        setUnitOptions(units.map(unit => ({ value: unit.id, label: unit.name })));
        setSteelOptions(steels.map(steel => ({ value: steel.id, label: steel.grade })));
        setDesignationOptions(designations.map(designation => ({ value: designation, label: designation })));
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
      }
    };
    
    fetchOptions();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Réinitialiser les erreurs pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
    
    // Réinitialiser les erreurs pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!parentId) newErrors.parent = 'Commande parente non identifiée';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const formatDataForApi = () => {
    // Structurer les dimensions en JSON
    const dimensions = {
      rectangular: {
        length: formData.length || null,
        width: formData.width || null,
        height: formData.height || null,
        unit: formData.dimensionsUnit || null
      },
      circular: {
        diameterIn: formData.diameterIn || null,
        diameterOut: formData.diameterOut || null,
        unit: formData.diameterUnit || null
      },
      weight: {
        value: formData.weight || null,
        unit: formData.weightUnit || null
      }
    };
    
    // Structurer les spécifications en JSON
    const specifications = {
      coreHardness: {
        min: formData.coreHardnessMin || null,
        max: formData.coreHardnessMax || null,
        unit: formData.coreHardnessUnit || null
      },
      surfaceHardness: {
        min: formData.surfaceHardnessMin || null,
        max: formData.surfaceHardnessMax || null,
        unit: formData.surfaceHardnessUnit || null
      },
      ecd: {
        depthMin: formData.ecdDepthMin || null,
        depthMax: formData.ecdDepthMax || null,
        hardness: formData.ecdHardness || null,
        unit: formData.ecdHardnessUnit || null
      },
      description: formData.description || null
    };
    
    return {
      parent_id: parentId,
      name: formData.name,
      designation: formData.designation,
      dimensions,
      specifications,
      steel: formData.steel
    };
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const partData = formatDataForApi();
      
      // Utiliser axios directement pour la cohérence avec le code existant
      const response = await axios.post('/api/parts', partData);
      
      setMessage({
        type: 'success',
        text: 'Pièce créée avec succès!'
      });
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        designation: '',
        length: '',
        width: '',
        height: '',
        dimensionsUnit: '',
        diameterIn: '',
        diameterOut: '',
        diameterUnit: '',
        weight: '',
        weightUnit: '',
        coreHardnessMin: '',
        coreHardnessMax: '',
        coreHardnessUnit: '',
        surfaceHardnessMin: '',
        surfaceHardnessMax: '',
        surfaceHardnessUnit: '',
        ecdDepthMin: '',
        ecdDepthMax: '',
        ecdHardness: '',
        ecdHardnessUnit: '',
        steel: '',
        description: ''
      });
      
      // Notifier le parent
      if (onPartCreated) {
        onPartCreated(response.data);
      }
      
      // Fermer le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la création de la pièce:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Une erreur est survenue lors de la création de la pièce'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      {errors.parent && (
        <div className="alert alert-danger mb-3">
          {errors.parent}
        </div>
      )}
      
      <Form onSubmit={handleSubmit}>
        {/* Informations générales */}
        <div className="mb-4">
          <h5>Informations générales</h5>
          <hr />
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nom *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Désignation</Form.Label>
                <Select
                  name="designation"
                  options={designationOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'designation' })}
                  isClearable
                  placeholder="Sélectionnez une désignation"
                  className={errors.designation ? 'is-invalid' : ''}
                />
                {errors.designation && (
                  <div className="invalid-feedback d-block">
                    {errors.designation}
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* Dimensions rectangulaires */}
        <div className="mb-4">
          <h5>Dimensions rectangulaires</h5>
          <hr />
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Longueur</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Largeur</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Hauteur</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Unité</Form.Label>
                <Select
                  name="dimensionsUnit"
                  options={unitOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'dimensionsUnit' })}
                  isClearable
                  placeholder="Sélectionnez une unité"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* Dimensions circulaires */}
        <div className="mb-4">
          <h5>Dimensions circulaires</h5>
          <hr />
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Diamètre intérieur</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="diameterIn"
                  value={formData.diameterIn}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Diamètre extérieur</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="diameterOut"
                  value={formData.diameterOut}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Unité</Form.Label>
                <Select
                  name="diameterUnit"
                  options={unitOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'diameterUnit' })}
                  isClearable
                  placeholder="Sélectionnez une unité"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* Masse */}
        <div className="mb-4">
          <h5>Masse</h5>
          <hr />
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Poids</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Unité</Form.Label>
                <Select
                  name="weightUnit"
                  options={unitOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'weightUnit' })}
                  isClearable
                  placeholder="Sélectionnez une unité"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* Dureté du cœur */}
        <div className="mb-4">
          <h5>Dureté du cœur</h5>
          <hr />
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Minimum</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="coreHardnessMin"
                  value={formData.coreHardnessMin}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Maximum</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="coreHardnessMax"
                  value={formData.coreHardnessMax}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Unité</Form.Label>
                <Select
                  name="coreHardnessUnit"
                  options={unitOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'coreHardnessUnit' })}
                  isClearable
                  placeholder="Sélectionnez une unité"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* Dureté de surface */}
        <div className="mb-4">
          <h5>Dureté de surface</h5>
          <hr />
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Minimum</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="surfaceHardnessMin"
                  value={formData.surfaceHardnessMin}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Maximum</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="surfaceHardnessMax"
                  value={formData.surfaceHardnessMax}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Unité</Form.Label>
                <Select
                  name="surfaceHardnessUnit"
                  options={unitOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'surfaceHardnessUnit' })}
                  isClearable
                  placeholder="Sélectionnez une unité"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* ECD */}
        <div className="mb-4">
          <h5>ECD</h5>
          <hr />
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Profondeur min</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="ecdDepthMin"
                  value={formData.ecdDepthMin}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Profondeur max</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="ecdDepthMax"
                  value={formData.ecdDepthMax}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Dureté</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="ecdHardness"
                  value={formData.ecdHardness}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Unité</Form.Label>
                <Select
                  name="ecdHardnessUnit"
                  options={unitOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'ecdHardnessUnit' })}
                  isClearable
                  placeholder="Sélectionnez une unité"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* Acier */}
        <div className="mb-4">
          <h5>Acier</h5>
          <hr />
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Nuance d'acier</Form.Label>
                <Select
                  name="steel"
                  options={steelOptions}
                  onChange={(option) => handleSelectChange(option, { name: 'steel' })}
                  isClearable
                  placeholder="Sélectionnez une nuance d'acier"
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        {/* Description */}
        <div className="mb-4">
          <h5>Description</h5>
          <hr />
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
        
        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PartForm;