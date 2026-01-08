import useGenericFormState from '../../../../../hooks/useGenericFormState';

/**
 * Hook pour gérer l'état du formulaire Steel
 * Utilise le hook générique useGenericFormState avec configuration spécifique
 */
const useFormState = () => {
  return useGenericFormState(
    {
      grade: '',
      family: '',
      standard: '',
      equivalents: [],
      chemical_elements: []
    },
    {
      entityName: 'Steel',
      withFetching: true,
      withParentId: false
    }
  );
};

export default useFormState;
