#!/usr/bin/env node
/**
 * Script pour créer les pièces (parts) depuis le fichier CSV traité
 * Utilise la fonction createPart existante du partService
 */

const fs = require('fs').promises;
const path = require('path');

// Import des modèles et services
const { sequelize } = require('../server/models');
const { Node, Client, Order } = require('../server/models');
const partService = require('../server/services/partService');

/**
 * Lit le fichier JSON contenant les pièces traitées
 * @param {string} filePath - Chemin vers le fichier JSON
 * @returns {Array} Liste des pièces à importer
 */
async function readPartsData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Erreur lors de la lecture du fichier ${filePath}: ${error.message}`);
  }
}

/**
 * Trouve l'ID de la commande (order) associée à un client
 * @param {string} clientName - Nom du client
 * @returns {number|null} ID de la commande ou null si non trouvé
 */
async function findOrderIdByClient(clientName) {
  try {
    // Trouver le client
    const client = await Node.findOne({
      where: { 
        name: clientName,
        type: 'client'
      }
    });
    
    if (!client) {
      console.log(`⚠️  Client non trouvé: ${clientName}`);
      return null;
    }
    
    // Trouver la commande associée à ce client
    const order = await Node.findOne({
      where: {
        parent_id: client.id,
        type: 'order'
      }
    });
    
    if (!order) {
      console.log(`⚠️  Commande non trouvée pour le client: ${clientName}`);
      return null;
    }
    
    return order.id;
  } catch (error) {
    console.error(`Erreur lors de la recherche de commande pour ${clientName}:`, error.message);
    return null;
  }
}

/**
 * Valide les données d'une pièce avant import
 * @param {Object} partData - Données de la pièce
 * @returns {boolean} true si valide, false sinon
 */
function validatePartData(partData) {
  if (!partData.client || !partData.client.trim()) {
    console.log(`❌ Pièce invalide: client manquant`);
    return false;
  }
  
  if (!partData.designation || !partData.designation.trim()) {
    console.log(`❌ Pièce invalide: désignation manquante pour client ${partData.client}`);
    return false;
  }
  
  return true;
}

/**
 * Crée une pièce unique
 * @param {Object} partData - Données de la pièce
 * @param {number} index - Index de la pièce (pour le suivi)
 * @param {number} total - Nombre total de pièces
 * @returns {Object|null} Pièce créée ou null en cas d'erreur
 */
async function createSinglePart(partData, index, total) {
  try {
    // Validation des données
    if (!validatePartData(partData)) {
      return null;
    }
    
    console.log(`[${index + 1}/${total}] Création de la pièce: ${partData.designation} pour ${partData.client}`);
    
    // Trouver l'ID de la commande associée au client
    const orderId = await findOrderIdByClient(partData.client);
    
    if (!orderId) {
      console.log(`❌ Impossible de trouver la commande pour le client: ${partData.client}`);
      return null;
    }
    
    // Préparer les données pour la création de la pièce
    const partToCreate = {
      parent_id: orderId,
      designation: partData.designation,
      clientDesignation: partData.client_designation,
      steel: partData.steel,
      specifications: partData.specifications,
      dimensions: partData.dimensions || {},
      reference: partData.reference,
      quantity: partData.quantity,
      description: `Pièce importée automatiquement - ${partData.designation}${partData.client_designation ? ` (${partData.client_designation})` : ''}`
    };
    
    // Utiliser la fonction createPart existante
    const newPart = await partService.createPart(partToCreate);
    
    // Mettre à jour le data_status à 'old' après création
    await sequelize.query(
      'UPDATE nodes SET data_status = :status WHERE id = :nodeId',
      {
        replacements: { status: 'old', nodeId: newPart.id },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log(`✅ Pièce créée avec succès: ${partData.designation} (ID: ${newPart.id})`);
    return newPart;
    
  } catch (error) {
    console.error(`❌ Erreur lors de la création de la pièce ${partData.designation} pour ${partData.client}:`, error.message);
    return null;
  }
}

/**
 * Crée toutes les pièces
 * @param {Array} partsData - Liste des pièces à créer
 * @returns {Object} Statistiques de création
 */
async function createAllParts(partsData) {
  console.log(`\n🚀 Début de la création de ${partsData.length} pièces...\n`);
  
  const stats = {
    total: partsData.length,
    created: 0,
    errors: 0
  };
  
  const createdParts = [];
  
  // Création séquentielle pour éviter les conflits de base de données
  for (let i = 0; i < partsData.length; i++) {
    const partData = partsData[i];
    
    try {
      const result = await createSinglePart(partData, i, partsData.length);
      
      if (result) {
        stats.created++;
        createdParts.push(result);
      } else {
        stats.errors++;
      }
      
      // Petite pause pour éviter de surcharger la base de données
      if (i < partsData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      stats.errors++;
      console.error(`❌ Erreur fatale pour la pièce ${partData.designation}:`, error);
    }
  }
  
  return { stats, createdParts };
}

/**
 * Affiche un résumé des opérations
 * @param {Object} stats - Statistiques de création
 * @param {Array} createdParts - Liste des pièces créées
 */
function displaySummary(stats, createdParts) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DE LA CRÉATION DES PIÈCES');
  console.log('='.repeat(60));
  console.log(`📈 Total pièces traitées: ${stats.total}`);
  console.log(`✅ Pièces créées: ${stats.created}`);
  console.log(`❌ Erreurs: ${stats.errors}`);
  
  if (createdParts.length > 0) {
    console.log('\n🔧 Échantillon des pièces créées:');
    createdParts.slice(0, 10).forEach(part => {
      console.log(`  - ${part.name} (ID: ${part.id})`);
    });
    
    if (createdParts.length > 10) {
      console.log(`  ... et ${createdParts.length - 10} autres pièces`);
    }
  }
  
  // Affichage des statistiques par désignation
  if (createdParts.length > 0) {
    const designationStats = {};
    createdParts.forEach(part => {
      const designation = part.Part?.designation || 'UNKNOWN';
      designationStats[designation] = (designationStats[designation] || 0) + 1;
    });
    
    console.log('\n🏭 Répartition par désignation des pièces créées:');
    Object.entries(designationStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([designation, count]) => {
        console.log(`  ${designation}: ${count} pièces`);
      });
  }
  
  // Affichage des statistiques par acier
  if (createdParts.length > 0) {
    const steelStats = {};
    createdParts.forEach(part => {
      const steel = part.Part?.steel || 'Non spécifié';
      if (steel !== 'Non spécifié') {
        steelStats[steel] = (steelStats[steel] || 0) + 1;
      }
    });
    
    if (Object.keys(steelStats).length > 0) {
      console.log('\n🔩 Top 10 des aciers utilisés:');
      Object.entries(steelStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([steel, count]) => {
          console.log(`  ${steel}: ${count} pièces`);
        });
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🎯 SCRIPT DE CRÉATION DES PIÈCES ECM');
    console.log('===================================\n');
    
    // Chemins des fichiers
    const scriptsDir = __dirname;
    const partsDataFile = path.join(scriptsDir, 'parts_to_import.json');
    
    // Vérifier que le fichier de données existe
    try {
      await fs.access(partsDataFile);
    } catch {
      throw new Error(`Fichier de données non trouvé: ${partsDataFile}\nVeuillez d'abord exécuter le script process_parts_csv.py`);
    }
    
    // Tester la connexion à la base de données
    console.log('🔌 Test de la connexion à la base de données...');
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie\n');
    
    // Lire les données des pièces
    console.log('📖 Lecture des données des pièces...');
    const partsData = await readPartsData(partsDataFile);
    console.log(`📋 ${partsData.length} pièces à traiter\n`);
    
    // Vérifier s'il y a des pièces à créer
    if (partsData.length === 0) {
      console.log('⚠️  Aucune pièce à créer');
      return;
    }
    
    // Afficher un aperçu des premières pièces
    console.log('👀 Aperçu des pièces:');
    partsData.slice(0, 5).forEach((part, index) => {
      console.log(`  ${index + 1}. ${part.designation} (${part.client}) - Acier: ${part.steel || 'N/A'}`);
    });
    if (partsData.length > 5) {
      console.log(`  ... et ${partsData.length - 5} autres`);
    }
    console.log('');
    
    // Demander confirmation (en mode automatique pour le script)
    console.log('▶️  Démarrage de la création des pièces...\n');
    
    // Créer toutes les pièces
    const { stats, createdParts } = await createAllParts(partsData);
    
    // Afficher le résumé
    displaySummary(stats, createdParts);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n⏱️  Durée totale: ${duration} secondes`);
    console.log(`\n🎉 Création des pièces terminée avec succès!`);
    
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

module.exports = { main, createAllParts, createSinglePart };
