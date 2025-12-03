/**
 * Script de validation pour vérifier que tous les services ETL fonctionnent
 */

const { node } = require('../models');

async function validateETLEnvironment() {
  
  
  const checks = [];
  
  try {
    // 1. Vérifier la connexion à la base de données
    
    await node.findOne({ limit: 1 });
    
    checks.push({ name: 'Database', status: 'OK' });
  } catch (error) {
    
    checks.push({ name: 'Database', status: 'ERROR', error: error.message });
  }
  
  try {
    // 2. Vérifier les services
    
    
    const clientService = require('../services/clientService');
    const trialRequestService = require('../services/trialRequestService');
    const partService = require('../services/partService');
    const trialService = require('../services/trialService');
    
    
    
    
    
    checks.push({ name: 'Services', status: 'OK' });
  } catch (error) {
    
    checks.push({ name: 'Services', status: 'ERROR', error: error.message });
  }
  
  try {
    // 3. Vérifier csv-parser
    
    const csv = require('csv-parser');
    
    checks.push({ name: 'CSV Parser', status: 'OK' });
  } catch (error) {
    
    
    checks.push({ name: 'CSV Parser', status: 'ERROR', error: error.message });
  }
  
  try {
    // 4. Vérifier le répertoire scripts
    
    const fs = require('fs');
    const path = require('path');
    
    const etlScriptPath = path.join(__dirname, 'etl-load-data.js');
    const testScriptPath = path.join(__dirname, 'etl-test.js');
    
    if (fs.existsSync(etlScriptPath)) {
      
    } else {
      
    }
    
    if (fs.existsSync(testScriptPath)) {
      
    } else {
      
    }
    
    checks.push({ name: 'ETL Scripts', status: 'OK' });
  } catch (error) {
    
    checks.push({ name: 'ETL Scripts', status: 'ERROR', error: error.message });
  }
  
  // Résumé
  
  );
  
  const passed = checks.filter(c => c.status === 'OK').length;
  const total = checks.length;
  
  checks.forEach(check => {
    const icon = check.status === 'OK' ? '✅' : '❌';
    
    if (check.error) {
      
    }
  });
  
  );
  
  
  if (passed === total) {
    
    
    
    
    
  } else {
    
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
