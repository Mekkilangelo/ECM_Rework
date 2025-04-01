import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const useApiSubmission = (
  formData, 
  parentId, 
  setFormData, 
  validate, 
  part,
  setLoading, 
  setMessage, 
  onPartCreated, 
  onPartUpdated, 
  onClose,
  fileAssociationCallback
) => {
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
      toothHardness: {
        min: formData.toothHardnessMin || null,
        max: formData.toothHardnessMax || null,
        unit: formData.toothHardnessUnit || null
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
      
      let response;
      
      if (part) {
        // Mode édition
        response = await axios.put(`${API_URL}/parts/${part.id}`, partData);

        // Associer les fichiers à la pièce existante si nécessaire
        if (fileAssociationCallback) {
          await fileAssociationCallback(part.id);
        }
        setMessage({
          type: 'success',
          text: 'Pièce mise à jour avec succès!'
        });
        
        if (onPartUpdated) {
          onPartUpdated(response.data);
        }
      } else {
        // Mode création
        response = await axios.post(`${API_URL}/parts`, partData);

        // Associer les fichiers à la nouvelle pièce si nécessaire
        if (fileAssociationCallback) {
          await fileAssociationCallback(response.data.id);
        }
        
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
        
        if (onPartCreated) {
          onPartCreated(response.data);
        }
      }
      
      // Fermer le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'opération sur la pièce:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Une erreur est survenue lors de l\'opération sur la pièce'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return { handleSubmit };
};

export default useApiSubmission;
