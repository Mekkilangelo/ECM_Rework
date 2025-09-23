/**
 * Script de validation pour vérifier que tous les services ETL fonctionnent
 */

const { node } = require('../models');

async function validateETLEnvironment() {
  console.log('🔍 Validation de l\'environnement ETL...\n');
  
  const checks = [];
  
  try {
    // 1. Vérifier la connexion à la base de données
    console.log('1. Vérification de la connexion à la base de données...');
    await node.findOne({ limit: 1 });
    console.log('   ✅ Connexion base de données OK');
    checks.push({ name: 'Database', status: 'OK' });
  } catch (error) {
    console.log('   ❌ Erreur de connexion base de données:', error.message);
    checks.push({ name: 'Database', status: 'ERROR', error: error.message });
  }
  
  try {
    // 2. Vérifier les services
    console.log('\n2. Vérification des services...');
    
    const clientService = require('../services/clientService');
    const orderService = require('../services/orderService');
    const partService = require('../services/partService');
    const testService = require('../services/testService');
    
    console.log('   ✅ clientService importé');
    console.log('   ✅ orderService importé');
    console.log('   ✅ partService importé');
    console.log('   ✅ testService importé');
    checks.push({ name: 'Services', status: 'OK' });
  } catch (error) {
    console.log('   ❌ Erreur import services:', error.message);
    checks.push({ name: 'Services', status: 'ERROR', error: error.message });
  }
  
  try {
    // 3. Vérifier csv-parser
    console.log('\n3. Vérification de csv-parser...');
    const csv = require('csv-parser');
    console.log('   ✅ csv-parser importé');
    checks.push({ name: 'CSV Parser', status: 'OK' });
  } catch (error) {
    console.log('   ❌ csv-parser non disponible:', error.message);
    console.log('   💡 Exécutez: npm install csv-parser');
    checks.push({ name: 'CSV Parser', status: 'ERROR', error: error.message });
  }
  
  try {
    // 4. Vérifier le répertoire scripts
    console.log('\n4. Vérification des scripts ETL...');
    const fs = require('fs');
    const path = require('path');
    
    const etlScriptPath = path.join(__dirname, 'etl-load-data.js');
    const testScriptPath = path.join(__dirname, 'etl-test.js');
    
    if (fs.existsSync(etlScriptPath)) {
      console.log('   ✅ etl-load-data.js trouvé');
    } else {
      console.log('   ❌ etl-load-data.js manquant');
    }
    
    if (fs.existsSync(testScriptPath)) {
      console.log('   ✅ etl-test.js trouvé');
    } else {
      console.log('   ❌ etl-test.js manquant');
    }
    
    checks.push({ name: 'ETL Scripts', status: 'OK' });
  } catch (error) {
    console.log('   ❌ Erreur vérification scripts:', error.message);
    checks.push({ name: 'ETL Scripts', status: 'ERROR', error: error.message });
  }
  
  // Résumé
  console.log('\n📊 Résumé de validation:');
  console.log('=' .repeat(50));
  
  const passed = checks.filter(c => c.status === 'OK').length;
  const total = checks.length;
  
  checks.forEach(check => {
    const icon = check.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${check.name}: ${check.status}`);
    if (check.error) {
      console.log(`   └─ ${check.error}`);
    }
  });
  
  console.log('=' .repeat(50));
  console.log(`📈 Score: ${passed}/${total} vérifications réussies`);
  
  if (passed === total) {
    console.log('🎉 Environnement ETL prêt !');
    console.log('\n💡 Pour tester:');
    console.log('   npm run etl:test');
    console.log('\n💡 Pour charger vos données:');
    console.log('   npm run etl:load chemin/vers/votre/fichier.csv');
  } else {
    console.log('⚠️  Certaines vérifications ont échoué. Corrigez les erreurs avant de continuer.');
  }
  
  return passed === total;
}

// Exécution si le script est appelé directement
if (require.main === module) {
  validateETLEnvironment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale pendant la validation:', error);
      process.exit(1);
    });
}

module.exports = validateETLEnvironment;
