// src/components/hooks/useOrderData.js
import { useEffect } from 'react';
import trialRequestService from '../../../../../services/trialRequestService';

/**
 * Hook pour récupérer et formater les données d'une demande d'essai
 * @param {Object} trialRequest - La demande d'essai à récupérer et formater
 * @param {Function} setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {Function} setMessage - Fonction pour définir les messages d'erreur/succès
 * @param {Function} setFetchingOrder - Fonction pour indiquer l'état de chargement
 * @param {Function} setParentId - Fonction pour définir l'ID du client parent
 */
const useOrderData = (trialRequest, setFormData, setMessage, setFetchingOrder, setParentId) => {
  // Charger les données complètes de la demande d'essai si on est en mode édition
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (trialRequest && trialRequest.id) {
        try {
          setFetchingOrder(true);
          
          // Récupération des données de la demande d'essai avec la méthode refactorisée
          const trialRequestData = await trialRequestService.getTrialRequest(trialRequest.id);
          
          // Traitement du champ contacts JSON
          let contacts = [];
          
          // Vérification et extraction des contacts avec gestion des différentes structures possibles
          
          // Cas 1: Structure trialRequestData.trialRequest?.contacts
          if (trialRequestData.trialRequest?.contacts) {
            try {
              if (typeof trialRequestData.trialRequest.contacts === 'string') {
                contacts = JSON.parse(trialRequestData.trialRequest.contacts);
              } else if (Array.isArray(trialRequestData.trialRequest.contacts)) {
                contacts = trialRequestData.trialRequest.contacts;
              }
            } catch (e) {
              console.error('Erreur lors du parsing des contacts:', e);
              contacts = [];
            }
          } 
          // Cas 2: Structure trialRequestData.contacts (flux direct sans TrialRequest)
          else if (trialRequestData.contacts) {
            try {
              if (typeof trialRequestData.contacts === 'string') {
                contacts = JSON.parse(trialRequestData.contacts);
              } else if (Array.isArray(trialRequestData.contacts)) {
                contacts = trialRequestData.contacts;
              }
            } catch (e) {
              console.error('Erreur lors du parsing des contacts:', e);
              contacts = [];
            }
          }
          
          // S'assurer qu'il y a au moins un contact vide
          if (!Array.isArray(contacts) || contacts.length === 0) {
            contacts = [{ name: '', phone: '', email: '' }];
          }
            // Construction du nouvel état du formulaire en normalisant la structure
          // Après la refactorisation, nous devons normaliser les données pour la comparaison
          const normalizedData = {
            // Essayer d'abord trialRequestData.trialRequest.*, puis trialRequestData.* 
            request_date: trialRequestData.trialRequest?.request_date || trialRequestData.request_date || '',
            commercial: trialRequestData.trialRequest?.commercial || trialRequestData.commercial || '',
            // La description est habituellement au niveau du nœud parent (trialRequestData)
            description: trialRequestData.description || '',
            contacts: contacts
          };
          
          
          // Créer une copie propre sans les métadonnées du backend
          const formDataUpdate = {
            request_date: normalizedData.request_date,
            commercial: normalizedData.commercial,
            description: normalizedData.description,
            contacts: normalizedData.contacts
          };
          
          setFormData(formDataUpdate);
          
          // Si la demande d'essai a un parent, mettre à jour parentId
          // Parent ID est généralement dans trialRequestData.parent_id (propriété du nœud)
          if (trialRequestData.parent_id) {
            setParentId(trialRequestData.parent_id);
          } else {
          }
        } catch (error) {
          console.error('Erreur lors du chargement des détails de la demande d\'essai:', error);
          // Analyse détaillée de l'erreur pour aider au débogage
          if (error.response) {
            console.error('Détails de l\'erreur:', {
              status: error.response.status,
              headers: error.response.headers,
              data: error.response.data
            });
          }
          
          setMessage({
            type: 'danger',
            text: 'Impossible de charger les données de la demande d\'essai: ' + 
                 (error.response?.data?.message || error.message || 'Erreur inconnue')
          });
        } finally {
          setFetchingOrder(false);
        }
      }
    };
  
    fetchOrderDetails();
  }, [trialRequest, setFormData, setMessage, setFetchingOrder, setParentId]);
};

export default useOrderData;

