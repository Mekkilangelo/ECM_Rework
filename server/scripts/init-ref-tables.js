/**
 * Script d'initialisation des tables de référence
 * À exécuter avant le script ETL
 */

const { sequelize } = require('../models');

async function initReferenceTables() {
  try {
    console.log('🔧 Initialisation des tables de référence...\n');

    // Vérifier et insérer les valeurs pour ref_node_data_status
    const statusValues = ['new', 'old', 'opened'];
    
    console.log('📊 ref_node_data_status:');
    for (const status of statusValues) {
      const [result] = await sequelize.query(
        'INSERT IGNORE INTO ref_node_data_status (name) VALUES (?)',
        { replacements: [status] }
      );
      console.log(`   ${status}: ${result.affectedRows > 0 ? '✅ créé' : 'ℹ️  existe déjà'}`);
    }

    console.log('\n✅ Initialisation terminée !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initReferenceTables();
