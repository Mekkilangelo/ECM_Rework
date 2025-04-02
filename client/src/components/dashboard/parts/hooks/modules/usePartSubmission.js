import useApiSubmission from '../../../../../hooks/useApiSubmission';
import partService from '../../../../../services/partService';

/**
 * Hook spécifique pour gérer les soumissions de pièces
 * @param {Object} formData - Données du formulaire de pièce
 * @param {string} parentId - ID de la commande parente
 * @param {Function} setFormData - Fonction pour mettre à jour formData
 * @param {Function} validate - Fonction de validation
 * @param {Object} part - Pièce existante (pour le mode édition)
 * @param {Function} setLoading - Fonction pour définir l'état de chargement
 * @param {Function} setMessage - Fonction pour définir les messages
 * @param {Function} onPartCreated - Callback après création
 * @param {Function} onPartUpdated - Callback après mise à jour
 * @param {Function} onClose - Callback de fermeture
 * @param {Function} fileAssociationCallback - Callback pour associer des fichiers
 */
const usePartSubmission = (
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
  const initialFormState = {
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
  
  return useApiSubmission({
    formData,
    setFormData,
    validate,
    entity: part,
    setLoading,
    setMessage,
    onCreated: onPartCreated,
    onUpdated: onPartUpdated,
    onClose,
    formatDataForApi,
    customApiService: {
      create: partService.createPart,
      update: partService.updatePart
    },
    entityType: 'Pièce',
    initialFormState,
    fileAssociationCallback,
    parentId
  });
};

export default usePartSubmission;