import { useEffect } from 'react';
import clientService from '../../../../../services/clientService';

/**
 * Hook pour récupérer et formater les données d'un client
 * @param {Object} client - Le client à récupérer et formater
 * @param {Function} setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {Function} setMessage - Fonction pour définir les messages d'erreur/succès
 * @param {Function} setFetchingClient - Fonction pour indiquer l'état de chargement
 */
const useClientData = (client, setFormData, setMessage, setFetchingClient) => {
  // Charger les données complètes du client si on est en mode édition
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (client && client.id) {
        try {
          setFetchingClient(true);
          // Récupération des données du client avec la méthode refactorisée
          const clientData = await clientService.getClient(client.id);
          
          console.log("Client data received:", clientData);
          
          setFormData({
            name: clientData.name || '',
            client_code: clientData.client?.client_code || '',
            country: clientData.client?.country || '',
            city: clientData.client?.city || '',
            client_group: clientData.client?.client_group || '',
            address: clientData.client?.address || '',
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