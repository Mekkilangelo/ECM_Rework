#!/usr/bin/env node
/**
 * Script d'import des clients depuis le fichier CSV traité
 * Utilise la fonction createClient existante du clientService
 */

const fs = require('fs').promises;
const path = require('path');

// Import des modèles et services
const { sequelize } = require('../server/models');
const clientService = require('../server/services/clientService');

/**
 * Lit le fichier JSON contenant les clients traités
 * @param {string} filePath - Chemin vers le fichier JSON
 * @returns {Array} Liste des clients à importer
 */
async function readClientsData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
  }
}

/**
 * Valide les données d'un client avant import
 * @param {Object} clientData - Données du client
 * @returns {boolean} true si valide, false sinon
 */
function validateClientData(clientData) {
  if (!clientData.name || !clientData.name.trim()) {
    console.log(`❌ Client invalide: nom manquant`);
    return false;
  }
  
  if (!clientData.country) {
    console.log(`❌ Client invalide: pays manquant pour ${clientData.name}`);
    return false;
  }
  
  return true;
}

/**
 * Importe un client unique en utilisant createClient
 * @param {Object} clientData - Données du client
 * @param {number} index - Index du client (pour le suivi)
 * @param {number} total - Nombre total de clients
 * @returns {Object|null} Client créé ou null en cas d'erreur
 */
async function importSingleClient(clientData, index, total) {
  try {
    // Validation des données
    if (!validateClientData(clientData)) {
      return null;
    }
    
    console.log(`[${index + 1}/${total}] Import du client: ${clientData.name} (${clientData.country})`);
    
    // Modification du data_status pour 'old' comme demandé
    // Note: Cette modification sera faite directement dans la transaction
    const clientToCreate = {
      name: clientData.name,
      country: clientData.country,
      city: clientData.city,
      client_group: clientData.client_group,
      address: clientData.address,
      description: clientData.description
    };
    
    // Utiliser la fonction createClient existante
    const newClient = await clientService.createClient(clientToCreate);
    
    // Mettre à jour le data_status à 'old' après création
    await sequelize.query(
      'UPDATE nodes SET data_status = :status WHERE id = :nodeId',
      {
        replacements: { status: 'old', nodeId: newClient.id },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log(`✅ Client créé avec succès: ${clientData.name} (ID: ${newClient.id})`);
    return newClient;
    
  } catch (error) {
    if (error.message && error.message.includes('Un client avec ce nom existe déjà')) {
      console.log(`⚠️  Client déjà existant: ${clientData.name}`);
      return null; // Pas d'erreur, juste déjà existant
    } else {
      console.error(`❌ Erreur lors de la création du client ${clientData.name}:`, error.message);
      return null;
    }
  }
}

/**
 * Importe tous les clients
 * @param {Array} clientsData - Liste des clients à importer
 * @returns {Object} Statistiques d'import
 */
async function importAllClients(clientsData) {
  console.log(`\n🚀 Début de l'import de ${clientsData.length} clients...\n`);
  
  const stats = {
    total: clientsData.length,
    created: 0,
    skipped: 0,
    errors: 0
  };
  
  const createdClients = [];
  
  // Import séquentiel pour éviter les conflits de base de données
  for (let i = 0; i < clientsData.length; i++) {
    const clientData = clientsData[i];
    
    try {
      const result = await importSingleClient(clientData, i, clientsData.length);
      
      if (result) {
        stats.created++;
        createdClients.push(result);
      } else {
        stats.skipped++;
      }
      
      // Petite pause pour éviter de surcharger la base de données
      if (i < clientsData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      stats.errors++;
      console.error(`❌ Erreur fatale pour le client ${clientData.name}:`, error);
    }
  }
  
  return { stats, createdClients };
}

/**
 * Affiche un résumé des opérations
 * @param {Object} stats - Statistiques d'import
 * @param {Array} createdClients - Liste des clients créés
 */
function displaySummary(stats, createdClients) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE L\'IMPORT');
  console.log('='.repeat(60));
  console.log(`📈 Total clients traités: ${stats.total}`);
  console.log(`✅ Clients créés: ${stats.created}`);
  console.log(`⚠️  Clients ignorés (déjà existants): ${stats.skipped}`);
  console.log(`❌ Erreurs: ${stats.errors}`);
  
  if (createdClients.length > 0) {
    console.log('\n🆕 Clients créés:');
    createdClients.forEach(client => {
      const clientInfo = client.Client || {};
      console.log(`  - ${client.name} (${clientInfo.country || 'N/A'}) - ID: ${client.id}`);
    });
  }
  
  // Affichage des statistiques par pays
  if (createdClients.length > 0) {
    const countryStats = {};
    createdClients.forEach(client => {
      const country = client.Client?.country || 'UNKNOWN';
      countryStats[country] = (countryStats[country] || 0) + 1;
    });
    
    console.log('\n🌍 Répartition par pays des clients créés:');
    Object.entries(countryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, count]) => {
        console.log(`  ${country}: ${count} clients`);
      });
  }
}

/**
 * Fonction principale
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 SCRIPT D\'IMPORT DES CLIENTS ECM');
    console.log('================================\n');
    
    // Chemins des fichiers
    const scriptsDir = __dirname;
    const clientsDataFile = path.join(scriptsDir, 'clients_to_import.json');
    
    // Vérifier que le fichier de données existe
    try {
      await fs.access(clientsDataFile);
    } catch {
      throw new Error(`Fichier de données non trouvé: ${clientsDataFile}\nVeuillez d'abord exécuter le script process_clients_csv.py`);
    }
    
    // Tester la connexion à la base de données
    console.log('🔌 Test de la connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie\n');
    
    // Lire les données des clients
    console.log('📖 Lecture des données des clients...');
    const clientsData = await readClientsData(clientsDataFile);
    console.log(`📋 ${clientsData.length} clients à traiter\n`);
    
    // Vérifier s'il y a des clients à importer
    if (clientsData.length === 0) {
      console.log('⚠️  Aucun client à importer');
      return;
    }
    
    // Afficher un aperçu des premiers clients
    console.log('👀 Aperçu des premiers clients:');
    clientsData.slice(0, 5).forEach((client, index) => {
      console.log(`  ${index + 1}. ${client.name} - ${client.country} - ${client.city || 'N/A'}`);
    });
    if (clientsData.length > 5) {
      console.log(`  ... et ${clientsData.length - 5} autres`);
    }
    console.log('');
    
    // Demander confirmation (en mode automatique pour le script)
    console.log('▶️  Démarrage de l\'import...\n');
    
    // Importer tous les clients
    const { stats, createdClients } = await importAllClients(clientsData);
    
    // Afficher le résumé
    displaySummary(stats, createdClients);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n⏱️  Durée totale: ${duration} secondes`);
    console.log(`\n🎉 Import terminé avec succès!`);
    
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

module.exports = { main, importAllClients, importSingleClient };
