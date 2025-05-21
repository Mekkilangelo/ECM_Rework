// src/components/hooks/useOrderData.js
import { useEffect } from 'react';
import orderService from '../../../../../services/orderService';
import { analyzeObjectStructure } from '../../../../../utils/debugUtils';

const useOrderData = (order, setFormData, setMessage, setFetchingOrder, setParentId) => {
  // Charger les données complètes de la commande si on est en mode édition
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (order && order.id) {
        try {
          setFetchingOrder(true);
          console.log(`Récupération des détails de la commande avec l'ID ${order.id}...`);
          const response = await orderService.getOrder(order.id);
          
          // Analyser la réponse brute pour comprendre sa structure
          analyzeObjectStructure(response, 'API Response');
          
          // Adapté pour gérer le format de réponse standard de l'API
          // La structure peut être { data: { ... } } ou { success: true, message: "...", data: { ... } }
          let orderData;
          if (response.data.success !== undefined) {
            console.log("Nouveau format d'API détecté avec structure success/message/data");
            orderData = response.data.data; // Nouveau format API avec { success, message, data }
          } else {
            console.log("Ancien format d'API détecté avec structure directe");
            orderData = response.data; // Ancien format direct
          }
          
          // Analyser la structure des données extraites pour le débogage
          analyzeObjectStructure(orderData, 'Order Data');
            // Traitement du champ contacts JSON
          let contacts = [];
          
          // Vérification et extraction des contacts avec gestion des différentes structures possibles
          console.log("Extraction des contacts...");
          
          // Cas 1: Structure orderData.Order?.contacts
          if (orderData.Order?.contacts) {
            console.log("Contacts trouvés dans orderData.Order.contacts");
            try {
              if (typeof orderData.Order.contacts === 'string') {
                contacts = JSON.parse(orderData.Order.contacts);
                console.log("Contacts parsés depuis JSON string:", contacts);
              } else if (Array.isArray(orderData.Order.contacts)) {
                contacts = orderData.Order.contacts;
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
          
          // Construction du nouvel état du formulaire en cherchant dans les différentes structures possibles
          const formDataUpdate = {
            // Essayer d'abord orderData.Order.*, puis orderData.* 
            order_date: orderData.Order?.order_date || orderData.order_date || '',
            commercial: orderData.Order?.commercial || orderData.commercial || '',
            // La description est habituellement au niveau du nœud parent (orderData)
            description: orderData.description || '',
            contacts: contacts
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
            console.error('Données de réponse d\'erreur:', error.response.data);
            console.error('Status HTTP:', error.response.status);
            console.error('Headers:', error.response.headers);
          } else if (error.request) {
            console.error('Requête envoyée mais pas de réponse reçue');
          } else {
            console.error('Erreur de configuration de la requête:', error.message);
          }
          
          setMessage({
            type: 'danger',
            text: `Impossible de charger les données de la commande: ${error.message || "Erreur inconnue"}`
          });
        } finally {
          console.log("Fin du chargement des détails de la commande");
          setFetchingOrder(false);
        }
      }
    };
  
    fetchOrderDetails();
  }, [order, setFormData, setMessage, setFetchingOrder, setParentId]);
};

export default useOrderData;
