// src/components/hooks/useOrderData.js
import { useEffect } from 'react';
import orderService from '../../../../../services/orderService';

const useOrderData = (order, setFormData, setMessage, setFetchingOrder, setParentId) => {
  // Charger les données complètes de la commande si on est en mode édition
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (order && order.id) {
        try {
          setFetchingOrder(true);
          const response = await orderService.getOrder(order.id);
          const orderData = response.data;
          
          console.log("Order data received:", orderData);
          
          // Traitement du champ contacts JSON
          let contacts = [];
          if (orderData.Order?.contacts) {
            try {
              if (typeof orderData.Order.contacts === 'string') {
                contacts = JSON.parse(orderData.Order.contacts);
              } else if (Array.isArray(orderData.Order.contacts)) {
                contacts = orderData.Order.contacts;
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
          
          // Mise à jour du formData
          setFormData({
            order_date: orderData.Order?.order_date || '',
            commercial: orderData.Order?.commercial || '',
            description: orderData.description || '',
            contacts: contacts
          });
          
          // Si la commande a un parent, mettre à jour parentId
          if (orderData.Order?.parent_id) {
            setParentId(orderData.Order.parent_id);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des détails de la commande:', error);
          setMessage({
            type: 'danger',
            text: 'Impossible de charger les données de la commande.'
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
