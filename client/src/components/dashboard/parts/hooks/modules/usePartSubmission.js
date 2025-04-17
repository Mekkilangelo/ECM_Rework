import useApiSubmission from '../../../../../hooks/useApiSubmission';
import partService from '../../../../../services/partService';

/**
 * Hook spécifique pour gérer les soumissions de pièces
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
    clientDesignation: '',
    reference: '',
    quantity: '',
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
    toothHardnessMin: '',
    toothHardnessMax: '',
    toothHardnessUnit: '',
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
      clientDesignation: formData.clientDesignation,
      reference: formData.reference,
      quantity: formData.quantity || null,
      dimensions,
      specifications,
      steel: formData.steel,
      description: formData.description || null
    };
  };
  
  // Wrap le callback d'association de fichiers pour le faire fonctionner avec useApiSubmission
  const wrappedFileAssociationCallback = fileAssociationCallback ? 
    async (nodeId) => {
      if (typeof fileAssociationCallback === 'function') {
        console.log(`Associant les fichiers au nœud ${nodeId}...`);
        return await fileAssociationCallback(nodeId);
      }
      return true;
    } : null;
  
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
    fileAssociationCallback: wrappedFileAssociationCallback,
    parentId
  });
};

export default usePartSubmission;