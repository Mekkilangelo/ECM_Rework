import { useEffect } from 'react';
import clientService from '../../../../../services/clientService';

const useClientData = (client, setFormData, setMessage, setFetchingClient) => {
  // Charger les données complètes du client si on est en mode édition
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (client && client.id) {
        try {
          setFetchingClient(true);
          const response = await clientService.getClient(client.id);
          const clientData = response.data;
          
          console.log("Client data received:", clientData);
          
          setFormData({
            name: clientData.name || '',
            client_code: clientData.Client?.client_code || '',
            country: clientData.Client?.country || '',
            city: clientData.Client?.city || '',
            client_group: clientData.Client?.client_group || '',
            address: clientData.Client?.address || '',
            description: clientData.description || ''
          });
        } catch (error) {
          console.error('Erreur lors du chargement des détails du client:', error);
          setMessage({
            type: 'danger',
            text: 'Impossible de charger les données du client.'
          });
        } finally {
          setFetchingClient(false);
        }
      }
    };
  
    fetchClientDetails();
  }, [client, setFormData, setMessage, setFetchingClient]);
};

export default useClientData;