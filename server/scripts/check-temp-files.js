/**
 * Script de diagnostic pour identifier les fichiers temporaires non associés
 *
 * Les fichiers temporaires ont un temp_id dans leur context mais ne sont pas
 * dans la table closure (pas de lien avec un node parent).
 *
 * Usage: node server/scripts/check-temp-files.js [trialNodeId]
 */

const { sequelize, file, node, closure } = require('../models');
const logger = require('../utils/logger');

async function checkTempFiles(trialNodeId = null) {
  try {
    console.log('\n========================================');
    console.log('🔍 DIAGNOSTIC DES FICHIERS TEMPORAIRES');
    console.log('========================================\n');

    // 1. Trouver tous les fichiers avec temp_id dans le context
    const tempFiles = await file.findAll({
      where: sequelize.where(
        sequelize.fn('JSON_EXTRACT', sequelize.col('context'), '$.temp_id'),
        { [sequelize.Op.ne]: null }
      ),
      order: [['created_at', 'DESC']],
      limit: 100
    });

    console.log(`📊 Total fichiers temporaires trouvés: ${tempFiles.length}\n`);

    if (tempFiles.length === 0) {
      console.log('✅ Aucun fichier temporaire non associé trouvé.\n');
      return;
    }

    // 2. Pour chaque fichier temporaire, vérifier s'il est dans closure
    for (const tempFile of tempFiles) {
      const context = typeof tempFile.context === 'string'
        ? JSON.parse(tempFile.context)
        : tempFile.context;

      // Vérifier si le fichier a un node_id
      const hasNode = tempFile.node_id !== null && tempFile.node_id !== 0;

      // Si le fichier a un node_id, vérifier s'il est dans closure
      let inClosure = false;
      let nodeInfo = null;
      if (hasNode) {
        nodeInfo = await node.findByPk(tempFile.node_id);

        if (nodeInfo) {
          const closureEntry = await closure.findOne({
            where: {
              descendant_id: tempFile.node_id,
              depth: 0
            }
          });
          inClosure = !!closureEntry;
        }
      }

      // Filtrer par trialNodeId si spécifié
      if (trialNodeId && context.entity_id !== parseInt(trialNodeId)) {
        continue;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 Fichier: ${tempFile.original_name}`);
      console.log(`   ID: ${tempFile.id}`);
      console.log(`   Category: ${tempFile.category}`);
      console.log(`   Subcategory: ${tempFile.subcategory}`);
      console.log(`   Créé le: ${tempFile.created_at}`);
      console.log(`   Node ID: ${tempFile.node_id || 'NULL'}`);
      console.log(`   Context:`);
      console.log(`     - temp_id: ${context.temp_id}`);
      console.log(`     - entity_type: ${context.entity_type}`);
      console.log(`     - entity_id: ${context.entity_id}`);
      console.log(`     - sample_number: ${context.sample_number}`);
      console.log(`     - result_index: ${context.result_index}`);

      if (nodeInfo) {
        console.log(`   Node existe: ✅`);
        console.log(`     - type: ${nodeInfo.type}`);
        console.log(`     - name: ${nodeInfo.name}`);
        console.log(`     - path: ${nodeInfo.path}`);
        console.log(`   Dans closure: ${inClosure ? '✅' : '❌ PAS ASSOCIÉ'}`);
      } else if (hasNode) {
        console.log(`   Node existe: ❌ NODE MANQUANT`);
      } else {
        console.log(`   Node existe: ⚠️ Pas de node_id (fichier orphelin)`);
      }

      console.log('');
    }

    // 3. Statistiques finales
    console.log('\n========================================');
    console.log('📊 STATISTIQUES');
    console.log('========================================\n');

    const orphanFiles = tempFiles.filter(f => !f.node_id || f.node_id === 0);
    const filesWithNode = tempFiles.filter(f => f.node_id && f.node_id !== 0);

    console.log(`Fichiers temporaires sans node: ${orphanFiles.length}`);
    console.log(`Fichiers temporaires avec node: ${filesWithNode.length}`);

    if (filesWithNode.length > 0) {
      console.log('\n⚠️  CES FICHIERS DEVRAIENT ÊTRE ASSOCIÉS !');
      console.log('Ils ont un node_id mais ne sont probablement pas dans closure.');
    }

    if (orphanFiles.length > 0) {
      console.log('\n⚠️  CES FICHIERS SONT ORPHELINS !');
      console.log('Ils n\'ont pas de node_id et ne peuvent pas être associés.');
      console.log('Ils seront perdus à jamais une fois le tempId oublié.');
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
    throw error;
  }
}

// Exécution du script
const trialNodeId = process.argv[2] ? parseInt(process.argv[2]) : null;

if (trialNodeId) {
  console.log(`Filtrage par trial node ID: ${trialNodeId}\n`);
}

checkTempFiles(trialNodeId)
  .then(() => {
    console.log('✅ Diagnostic terminé\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
