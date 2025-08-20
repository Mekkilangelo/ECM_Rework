// src/components/hooks/useOrderData.js
import { useEffect } from 'react';
import orderService from '../../../../../services/orderService';

/**
 * Hook pour récupérer et formater les données d'une commande
 * @param {Object} order - La commande à récupérer et formater
 * @param {Function} setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {Function} setMessage - Fonction pour définir les messages d'erreur/succès
 * @param {Function} setFetchingOrder - Fonction pour indiquer l'état de chargement
 * @param {Function} setParentId - Fonction pour définir l'ID du client parent
 */
const useOrderData = (order, setFormData, setMessage, setFetchingOrder, setParentId) => {
  // Charger les données complètes de la commande si on est en mode édition
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (order && order.id) {
        try {
          setFetchingOrder(true);
          console.log(`Récupération des détails de la commande avec l'ID ${order.id}...`);
          
          // Récupération des données de la commande avec la méthode refactorisée
          const orderData = await orderService.getOrder(order.id);
          
          // Traitement du champ contacts JSON
          let contacts = [];
          
          // Vérification et extraction des contacts avec gestion des différentes structures possibles
          console.log("Extraction des contacts...");
          
          // Cas 1: Structure orderData.order?.contacts
          if (orderData.order?.contacts) {
            console.log("Contacts trouvés dans orderData.order.contacts");
            try {
              if (typeof orderData.order.contacts === 'string') {
                contacts = JSON.parse(orderData.order.contacts);
                console.log("Contacts parsés depuis JSON string:", contacts);
              } else if (Array.isArray(orderData.order.contacts)) {
                contacts = orderData.order.contacts;
                console.log("Contacts extraits directement depuis tableau:", contacts);
              }
            } catch (e) {
              console.error('Erreur lors du parsing des contacts:', e);
              contacts = [];
            }
          } 
          // Cas 2: Structure orderData.contacts (flux direct sans Order)
          else if (orderData.contacts) {
            console.log("Contacts trouvés dans orderData.contacts");
            try {
              if (typeof orderData.contacts === 'string') {
                contacts = JSON.parse(orderData.contacts);
                console.log("Contacts parsés depuis JSON string:", contacts);
              } else if (Array.isArray(orderData.contacts)) {
                contacts = orderData.contacts;
                console.log("Contacts extraits directement depuis tableau:", contacts);
              }
            } catch (e) {
              console.error('Erreur lors du parsing des contacts:', e);
              contacts = [];
            }
          }
          
          // S'assurer qu'il y a au moins un contact vide
          if (!Array.isArray(contacts) || contacts.length === 0) {
            console.log("Aucun contact valide trouvé, ajout d'un contact vide");
            contacts = [{ name: '', phone: '', email: '' }];
          }
            // Construction du nouvel état du formulaire en normalisant la structure
          // Après la refactorisation, nous devons normaliser les données pour la comparaison
          const normalizedData = {
            // Essayer d'abord orderData.order.*, puis orderData.* 
            order_date: orderData.order?.order_date || orderData.order_date || '',
            commercial: orderData.order?.commercial || orderData.commercial || '',
            // La description est habituellement au niveau du nœud parent (orderData)
            description: orderData.description || '',
            contacts: contacts
          };
          
          console.log("Données normalisées pour le formulaire:", normalizedData);
          
          // Créer une copie propre sans les métadonnées du backend
          const formDataUpdate = {
            order_date: normalizedData.order_date,
            commercial: normalizedData.commercial,
            description: normalizedData.description,
            contacts: normalizedData.contacts
          };
          
          console.log("Mise à jour du formulaire avec:", formDataUpdate);
          setFormData(formDataUpdate);
          
          // Si la commande a un parent, mettre à jour parentId
          // Parent ID est généralement dans orderData.parent_id (propriété du nœud)
          if (orderData.parent_id) {
            console.log(`Parent ID trouvé: ${orderData.parent_id}`);
            setParentId(orderData.parent_id);
          } else {
            console.log("Aucun parent ID trouvé dans les données");
          }
        } catch (error) {
          console.error('Erreur lors du chargement des détails de la commande:', error);
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
            text: 'Impossible de charger les données de la commande: ' + 
                 (error.response?.data?.message || error.message || 'Erreur inconnue')
          });
        } finally {
          setFetchingOrder(false);
        }
      }
    };
  
    fetchOrderDetails();
  }, [order, setFormData, setMessage, setFetchingOrder, setParentId]);
};

export default useOrderData;

