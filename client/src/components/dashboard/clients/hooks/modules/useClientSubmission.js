// client\src\components\dashboard\clients\hooks\modules\useClientSubmission.js
import useApiSubmission from '../../../../../hooks/useApiSubmission';
import clientService from '../../../../../services/clientService';

const useClientSubmission = ({ 
  formData, 
  setFormData, 
  validate, 
  entity, 
  setLoading, 
  setMessage, 
  onCreated,
  onUpdated, 
  onClose
}) => {
  const initialFormState = {
    name: '',
    client_code: '',
    country: '',
    city: '',
    client_group: '',
    address: '',
    description: ''
  };
  
  return useApiSubmission({
    formData,
    setFormData,
    validate,
    entity,
    setLoading,
    setMessage,
    onCreated,
    onUpdated,
    onClose,
    customApiService: {
      create: clientService.createClient,
      update: clientService.updateClient
    },
    entityType: 'Client',
    initialFormState
  });
};

export default useClientSubmission;
