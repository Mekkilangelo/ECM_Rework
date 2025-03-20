// client/src/components/dashboard/parts/hooks/usePartForm.js
import { useState, useEffect } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import enumService from '../../../../services/enumService';
import steelService from '../../../../services/steelService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const usePartForm = (onClose, onPartCreated) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.orderId;
  
  // État du formulaire
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
  
  // États pour les options des select
  const [designationOptions, setDesignationOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [steelOptions, setSteelOptions] = useState([]);
  
  // États pour la gestion des erreurs et du chargement
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Fonctions utilitaires pour les options de select
  const getLengthUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'length');
  };
  
  const getWeightUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'weight');
  };
  
  const getHardnessUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'hardness');
  };
  
  const getSelectedOption = (options, value) => {
    return options.find(option => option.value === value) || null;
  };
  
  // Style pour les composants Select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#ced4da',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#80bdff'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    })
  };
  
  // Gestionnaires d'événements
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleSelectChange = (selectedOption, { name }) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Validation du formulaire
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!parentId) newErrors.parent = 'Commande parente non identifiée';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Préparation des données pour l'API
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
      }
    };
    
    return {
      parent_id: parentId,
      name: formData.name,
      designation: formData.designation,
      dimensions,
      specifications,
      steel: formData.steel,
      description: formData.description || null
    };
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const partData = formatDataForApi();
      
      const response = await axios.post(`${API_URL}/parts`, partData);
      
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
  
  // Charger les options pour les selects
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Récupérer les désignations de pièces
        try {
          const designationsResponse = await enumService.getDesignations();
          if (designationsResponse.data && designationsResponse.data.values) {
            const designations = designationsResponse.data.values || [];
            setDesignationOptions(designations.map(designation => ({ 
              value: designation, 
              label: designation 
            })));
          } else {
            console.warn('Format de réponse des désignations inattendu:', designationsResponse);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des désignations:', error);
        }
        
        // Récupérer les unités
        try {
          const units = await enumService.getUnits();
          setUnitOptions(units.map(unit => ({ 
            value: unit.id, 
            label: unit.name,
            type: unit.type 
          })));
        } catch (error) {
          console.error('Erreur lors de la récupération des unités:', error);
        }
        
        try {
          const steels = await steelService.getSteelGrades();
          
          // Comme steels est maintenant un tableau de chaînes (ex: ["PO"]),
          // il faut adapter la transformation pour le Select
          setSteelOptions(steels.map(grade => ({ 
            value: grade,  // Utiliser directement la chaîne comme valeur
            label: grade   // Utiliser directement la chaîne comme libellé
          })));
        } catch (error) {
          console.error('Erreur lors de la récupération des grades d\'acier:', error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, []);
  
  return {
    formData,
    errors,
    loading,
    message,
    parentId,
    designationOptions,
    steelOptions,
    handleChange,
    handleSelectChange,
    handleSubmit,
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getHardnessUnitOptions,
    selectStyles
  };
};

export default usePartForm;