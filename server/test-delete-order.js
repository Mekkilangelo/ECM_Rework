/**
 * Script de test pour vérifier la suppression physique des dossiers lors de la suppression d'une commande
 */

const path = require('path');
const fs = require('fs');
const { deletePhysicalDirectory } = require('./utils/fileUtils');

async function testDeletePhysicalDirectory() {
  console.log('=== Test de suppression de dossier physique ===\n');
  
  // Créer un dossier de test
  const testPath = '/test-client/test-order-2024-01-01';
  const uploadsPath = path.join(__dirname, 'uploads');
  const fullTestPath = path.join(uploadsPath, 'test-client', 'test-order-2024-01-01');
  
  try {
    // Créer la structure de test
    console.log('1. Création de la structure de test...');
    fs.mkdirSync(fullTestPath, { recursive: true });
    
    // Créer quelques fichiers de test
    fs.writeFileSync(path.join(fullTestPath, 'test-file1.txt'), 'Contenu test 1');
    fs.writeFileSync(path.join(fullTestPath, 'test-file2.txt'), 'Contenu test 2');
    
    // Créer un sous-dossier avec fichiers
    const subDir = path.join(fullTestPath, 'documents');
    fs.mkdirSync(subDir);
    fs.writeFileSync(path.join(subDir, 'document1.pdf'), 'PDF simulé');
    
    console.log(`✅ Structure créée dans: ${fullTestPath}`);
    console.log(`   - Fichiers: test-file1.txt, test-file2.txt`);
    console.log(`   - Sous-dossier: documents/ avec document1.pdf`);
    
    // Vérifier que la structure existe
    console.log('\n2. Vérification de l\'existence...');
    console.log(`   Dossier existe: ${fs.existsSync(fullTestPath)}`);
    console.log(`   Contenu: ${fs.readdirSync(fullTestPath)}`);
    
    // Test de suppression
    console.log('\n3. Test de suppression...');
    const result = await deletePhysicalDirectory(testPath, uploadsPath);
    console.log(`   Résultat: ${result}`);
    
    // Vérifier la suppression
    console.log('\n4. Vérification après suppression...');
    console.log(`   Dossier existe encore: ${fs.existsSync(fullTestPath)}`);
    
    if (!fs.existsSync(fullTestPath)) {
      console.log('✅ Test réussi : Le dossier et tout son contenu ont été supprimés');
    } else {
      console.log('❌ Test échoué : Le dossier existe encore');
    }
    
  } catch (error) {
    console.error('❌ Erreur pendant le test:', error);
  } finally {
    // Nettoyage au cas où
    try {
      if (fs.existsSync(fullTestPath)) {
        fs.rmSync(fullTestPath, { recursive: true, force: true });
      }
      // Nettoyer aussi le dossier parent s'il est vide
      const parentDir = path.dirname(fullTestPath);
      if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
        fs.rmdirSync(parentDir);
      }
    } catch (cleanupError) {
      console.warn('Attention: Erreur lors du nettoyage:', cleanupError.message);
    }
  }
}

// Exécuter le test
if (require.main === module) {
  testDeletePhysicalDirectory()
    .then(() => console.log('\n=== Test terminé ==='))
    .catch(error => console.error('Erreur fatale:', error));
}

module.exports = { testDeletePhysicalDirectory };
