// client\src\components\dashboard\clients\hooks\modules\useClientSubmission.js
import useApiSubmission from '../../../../../hooks/useApiSubmission';
import clientService from '../../../../../services/clientService';

/**
 * Hook spécifique pour gérer les soumissions de clients
 * @param {Object} formData - Données du formulaire de client
 * @param {Function} setFormData - Fonction pour mettre à jour formData
 * @param {Function} validate - Fonction de validation
 * @param {Object} client - Client existant (pour le mode édition)
 * @param {Function} setLoading - Fonction pour définir l'état de chargement
 * @param {Function} setMessage - Fonction pour définir les messages
 * @param {Function} setErrors - Fonction pour définir les erreurs de champs
 * @param {Function} onClientCreated - Callback après création
 * @param {Function} onClientUpdated - Callback après mise à jour
 * @param {Function} onClose - Callback de fermeture
 * @param {Function} fileAssociationCallback - Callback pour associer des fichiers
 */
const useClientSubmission = ({ 
  formData, 
  setFormData, 
  validate, 
  entity, 
  setLoading, 
  setMessage,
  setErrors,
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
    setErrors,
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
