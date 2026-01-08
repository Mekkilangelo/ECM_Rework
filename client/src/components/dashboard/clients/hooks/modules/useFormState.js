import useGenericFormState from '../../../../../hooks/useGenericFormState';

/**
 * Hook pour gérer l'état du formulaire Client
 * Utilise le hook générique useGenericFormState avec configuration spécifique
 */
const useFormState = () => {
  return useGenericFormState(
    {
      name: '',
      client_code: '',
      country: '',
      city: '',
      client_group: '',
      address: '',
      description: ''
    },
    {
      entityName: 'Client',
      withFetching: true,
      withParentId: false
    }
  );
};

export default useFormState;