import useGenericFormState from '../../../../../hooks/useGenericFormState';

/**
 * Hook pour gérer l'état du formulaire Part
 * Utilise le hook générique useGenericFormState avec configuration spécifique
 */
const useFormState = () => {
  return useGenericFormState(
    {
      name: '',
      designation: '',
      clientDesignation: '',
      reference: '',
      quantity: '',
      description: '',
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
      toothHardnessMin: '',
      toothHardnessMax: '',
      toothHardnessUnit: '',
      ecdDepthMin: '',
      ecdDepthMax: '',
      ecdHardness: '',
      ecdHardnessUnit: '',
      steel: '',
      steelId: null
    },
    {
      entityName: 'Part',
      withFetching: true,
      withParentId: true
    }
  );
};

export default useFormState;
