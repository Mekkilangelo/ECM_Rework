#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../server/models');
const { Node } = require('../server/models');
const partService = require('../server/services/partService');

async function importParts() {
  try {
    console.log('🔧 IMPORT DES PIÈCES DANS LA BASE DE DONNÉES');
    console.log('===========================================\n');

    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Lecture du fichier JSON
    const partsFile = path.join(__dirname, 'parts_to_import.json');
    const partsData = JSON.parse(fs.readFileSync(partsFile, 'utf8'));
    
    console.log(`📋 ${partsData.length} pièces à importer\n`);

    let created = 0;
    let errors = 0;

    for (let i = 0; i < partsData.length; i++) {
      const part = partsData[i];
      
      try {
        console.log(`[${i + 1}/${partsData.length}] Création: ${part.designation} (${part.client})`);
        
        // Trouver le client
        const clientNode = await Node.findOne({
          where: { 
            name: part.client,
            type: 'client'
          }
        });
        
        if (!clientNode) {
          console.log(`❌ Client non trouvé: ${part.client}`);
          errors++;
          continue;
        }

        // Trouver la commande du client
        const orderNode = await Node.findOne({
          where: {
            parent_id: clientNode.id,
            type: 'order'
          }
        });

        if (!orderNode) {
          console.log(`❌ Commande non trouvée pour: ${part.client}`);
          errors++;
          continue;
        }

        // Créer la pièce
        const partData = {
          parent_id: orderNode.id,
          designation: part.designation,
          clientDesignation: part.client_designation,
          steel: part.steel,
          specifications: part.specifications,
          dimensions: part.dimensions || {},
          description: `Pièce ${part.designation} - ${part.client}`
        };

        const newPart = await partService.createPart(partData);
        
        // Mettre à jour le statut à 'old'
        await sequelize.query(
          'UPDATE nodes SET data_status = "old" WHERE id = ?',
          {
            replacements: [newPart.id],
            type: sequelize.QueryTypes.UPDATE
          }
        );

        console.log(`✅ Pièce créée (ID: ${newPart.id})`);
        created++;

      } catch (error) {
        console.error(`❌ Erreur pour ${part.designation}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE L\'IMPORT');
    console.log('='.repeat(50));
    console.log(`📈 Total traité: ${partsData.length}`);
    console.log(`✅ Pièces créées: ${created}`);
    console.log(`❌ Erreurs: ${errors}`);
    console.log(`📊 Taux de réussite: ${((created / partsData.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécution
importParts();
