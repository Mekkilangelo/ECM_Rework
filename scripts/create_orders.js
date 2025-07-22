#!/usr/bin/env node
/**
 * Script pour créer une demande d'essai (order) pour chaque client existant
 * Utilise la fonction createOrder existante du orderService
 */

const fs = require('fs').promises;
const path = require('path');

// Import des modèles et services
const { sequelize } = require('../server/models');
const { Node, Client } = require('../server/models');
const orderService = require('../server/services/orderService');

/**
 * Récupère tous les clients depuis la base de données
 * @returns {Array} Liste des clients
 */
async function getAllClients() {
  try {
    const clients = await Node.findAll({
      where: { type: 'client' },
      include: [{
        model: Client,
        attributes: ['client_code', 'country', 'city']
      }],
      order: [['id', 'ASC']]
    });
    
    return clients;
  } catch (error) {
    throw new Error(`Erreur lors de la récupération des clients: ${error.message}`);
  }
}

/**
 * Crée une demande d'essai pour un client
 * @param {Object} client - Données du client
 * @param {number} index - Index du client (pour le suivi)
 * @param {number} total - Nombre total de clients
 * @returns {Object|null} Order créée ou null en cas d'erreur
 */
async function createOrderForClient(client, index, total) {
  try {
    console.log(`[${index + 1}/${total}] Création d'une demande d'essai pour: ${client.name} (ID: ${client.id})`);
    
    // Données de la demande d'essai
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    const orderData = {
      parent_id: client.id,
      name: null, // Sera généré automatiquement par le service (TRQ_date)
      description: `Demande d'essai automatique pour ${client.name}`,
      order_number: null, // Sera généré automatiquement par le service
      order_date: today,
      commercial: 'Import automatique',
      client_id: client.id,
      contacts: null,
      delivery_date: null,
      urgency: 'normal',
      status: 'new',
      additional_info: `Demande d'essai créée automatiquement le ${today} lors de l'import des données`
    };
    
    // Utiliser la fonction createOrder existante
    const newOrder = await orderService.createOrder(orderData);
    
    // Mettre à jour le data_status à 'old' après création
    await sequelize.query(
      'UPDATE nodes SET data_status = :status WHERE id = :nodeId',
      {
        replacements: { status: 'old', nodeId: newOrder.id },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log(`✅ Demande d'essai créée avec succès: ${newOrder.name} (ID: ${newOrder.id})`);
    return newOrder;
    
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la demande d'essai pour ${client.name}:`, error.message);
    return null;
  }
}

/**
 * Crée les demandes d'essai pour tous les clients
 * @param {Array} clients - Liste des clients
 * @returns {Object} Statistiques de création
 */
async function createOrdersForAllClients(clients) {
  console.log(`\n🚀 Début de la création de ${clients.length} demandes d'essai...\n`);
  
  const stats = {
    total: clients.length,
    created: 0,
    errors: 0
  };
  
  const createdOrders = [];
  
  // Création séquentielle pour éviter les conflits de base de données
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    
    try {
      const result = await createOrderForClient(client, i, clients.length);
      
      if (result) {
        stats.created++;
        createdOrders.push(result);
      } else {
        stats.errors++;
      }
      
      // Petite pause pour éviter de surcharger la base de données
      if (i < clients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      stats.errors++;
      console.error(`❌ Erreur fatale pour le client ${client.name}:`, error);
    }
  }
  
  return { stats, createdOrders };
}

/**
 * Affiche un résumé des opérations
 * @param {Object} stats - Statistiques de création
 * @param {Array} createdOrders - Liste des orders créées
 */
function displaySummary(stats, createdOrders) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA CRÉATION DES DEMANDES D\'ESSAI');
  console.log('='.repeat(60));
  console.log(`📈 Total clients traités: ${stats.total}`);
  console.log(`✅ Demandes d'essai créées: ${stats.created}`);
  console.log(`❌ Erreurs: ${stats.errors}`);
  
  if (createdOrders.length > 0) {
    console.log('\n🆕 Demandes d\'essai créées:');
    createdOrders.forEach(order => {
      console.log(`  - ${order.name} (Client: ${order.parent_id}) - ID: ${order.id}`);
    });
  }
  
  // Affichage des statistiques par date
  if (createdOrders.length > 0) {
    const dateStats = {};
    createdOrders.forEach(order => {
      const orderDate = order.Order?.order_date || 'UNKNOWN';
      dateStats[orderDate] = (dateStats[orderDate] || 0) + 1;
    });
    
    console.log('\n📅 Répartition par date des demandes d\'essai créées:');
    Object.entries(dateStats)
      .sort()
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${count} demandes`);
      });
  }
}

/**
 * Fonction principale
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 SCRIPT DE CRÉATION DES DEMANDES D\'ESSAI ECM');
    console.log('==============================================\n');
    
    // Tester la connexion à la base de données
    console.log('🔌 Test de la connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie\n');
    
    // Récupérer tous les clients
    console.log('👥 Récupération de tous les clients...');
    const clients = await getAllClients();
    console.log(`📋 ${clients.length} clients trouvés\n`);
    
    // Vérifier s'il y a des clients
    if (clients.length === 0) {
      console.log('⚠️  Aucun client trouvé dans la base de données');
      console.log('   Veuillez d\'abord exécuter le script d\'import des clients');
      return;
    }
    
    // Afficher un aperçu des premiers clients
    console.log('👀 Aperçu des clients:');
    clients.slice(0, 5).forEach((client, index) => {
      const clientInfo = client.Client || {};
      console.log(`  ${index + 1}. ${client.name} (${clientInfo.country || 'N/A'}) - ID: ${client.id}`);
    });
    if (clients.length > 5) {
      console.log(`  ... et ${clients.length - 5} autres`);
    }
    console.log('');
    
    // Demander confirmation (en mode automatique pour le script)
    console.log('▶️  Démarrage de la création des demandes d\'essai...\n');
    
    // Créer les demandes d'essai pour tous les clients
    const { stats, createdOrders } = await createOrdersForAllClients(clients);
    
    // Afficher le résumé
    displaySummary(stats, createdOrders);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n⏱️  Durée totale: ${duration} secondes`);
    console.log(`\n🎉 Création des demandes d'essai terminée avec succès!`);
    
  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    try {
      await sequelize.close();
      console.log('\n🔌 Connexion à la base de données fermée');
    } catch (error) {
      console.error('Erreur lors de la fermeture de la connexion:', error.message);
    }
  }
}

// Gestion des signaux pour une fermeture propre
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interruption détectée (Ctrl+C)');
  console.log('🔌 Fermeture de la connexion à la base de données...');
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Erreur lors de la fermeture:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Signal de terminaison reçu');
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Erreur lors de la fermeture:', error.message);
  }
  process.exit(0);
});

// Lancer le script
if (require.main === module) {
  main();
}

module.exports = { main, createOrdersForAllClients, createOrderForClient };
