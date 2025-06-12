/**
 * Script de test pour vérifier la suppression physique des dossiers
 * dans les services partService et testService
 */

const { Node, Part, Test, Closure } = require('./models');
const { sequelize } = require('./models');
const { deletePhysicalDirectory } = require('./utils/fileUtils');

// Test de la fonction deletePhysicalDirectory
async function testDeletePhysicalDirectory() {
  console.log('=== Test de la fonction deletePhysicalDirectory ===');
  
  // Test avec un chemin fictif qui n'existe pas
  const testPath = '/fake/path/that/does/not/exist';
  
  try {
    const result = await deletePhysicalDirectory(testPath);
    console.log(`Résultat pour chemin inexistant: ${result}`);
  } catch (error) {
    console.log(`Erreur attendue pour chemin inexistant: ${error.message}`);
  }
}

// Test d'importation des services
async function testServiceImports() {
  console.log('\n=== Test des imports des services ===');
  
  try {
    const partService = require('./services/partService');
    console.log('✓ partService importé avec succès');
    console.log(`✓ deletePart function exists: ${typeof partService.deletePart === 'function'}`);
    
    const testService = require('./services/testService');
    console.log('✓ testService importé avec succès');
    console.log(`✓ deleteTest function exists: ${typeof testService.deleteTest === 'function'}`);
    
  } catch (error) {
    console.error('✗ Erreur lors de l\'importation des services:', error.message);
  }
}

// Test de vérification de la présence des imports dans les services
async function verifyServiceImports() {
  console.log('\n=== Vérification des imports dans les services ===');
  
  try {
    // Vérifier partService
    const fs = require('fs');
    const partServiceContent = fs.readFileSync('./services/partService.js', 'utf8');
    
    if (partServiceContent.includes('deletePhysicalDirectory')) {
      console.log('✓ deletePhysicalDirectory importé dans partService');
    } else {
      console.log('✗ deletePhysicalDirectory manquant dans partService');
    }
    
    // Vérifier testService
    const testServiceContent = fs.readFileSync('./services/testService.js', 'utf8');
    
    if (testServiceContent.includes('deletePhysicalDirectory')) {
      console.log('✓ deletePhysicalDirectory importé dans testService');
    } else {
      console.log('✗ deletePhysicalDirectory manquant dans testService');
    }
    
  } catch (error) {
    console.error('Erreur lors de la vérification:', error.message);
  }
}

// Fonction principale de test
async function main() {
  console.log('🧪 Test des modifications de suppression physique des dossiers\n');
  
  await testDeletePhysicalDirectory();
  await testServiceImports();
  await verifyServiceImports();
  
  console.log('\n✅ Tests terminés');
}

// Exécuter les tests
main().catch(console.error);
