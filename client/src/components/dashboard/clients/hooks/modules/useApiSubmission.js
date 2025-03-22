import clientService from '../../../../../services/clientService';

const useApiSubmission = (
  formData, 
  setFormData, 
  validate, 
  client, 
  setLoading, 
  setMessage, 
  onClientCreated,
  onClientUpdated, 
  onClose
) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      let response;
      
      if (client) {
        // Mode édition
        response = await clientService.updateClient(client.id, formData);
        setMessage({
          type: 'success',
          text: 'Client modifié avec succès!'
        });
        
        if (onClientUpdated) {
          onClientUpdated(response.data);
        }
      } else {
        // Mode création
        response = await clientService.createClient(formData);
        setMessage({
          type: 'success',
          text: 'Client créé avec succès!'
        });
        
        setFormData({
          name: '',
          client_code: '',
          country: '',
          city: '',
          client_group: '',
          address: '',
          description: ''
        });
        
        if (onClientCreated) {
          onClientCreated(response.data);
        }
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'opération:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || `Une erreur est survenue lors de ${client ? 'la modification' : 'la création'} du client`
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSubmit
  };
};

export default useApiSubmission;