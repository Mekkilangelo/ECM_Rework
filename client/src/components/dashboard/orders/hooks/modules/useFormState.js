import useGenericFormState from '../../../../../hooks/useGenericFormState';

/**
 * Hook pour gérer l'état du formulaire Order
 * Utilise le hook générique useGenericFormState avec configuration spécifique
 */
const useFormState = () => {
  return useGenericFormState(
    {
      request_date: new Date().toISOString().split('T')[0],
      description: '',
      commercial: '',
      contacts: [{ name: '', phone: '', email: '' }]
    },
    {
      entityName: 'Order',
      withFetching: true,
      withParentId: true
    }
  );
};

export default useFormState;
