/**
 * Script de workflow complet : nettoyage + import ETL
 * Nettoie la base puis charge les nouvelles données
 */

const { DatabaseCleaner } = require('./clean-database');
const ETLLoader = require('./etl-load-data');
const readline = require('readline');

class FullWorkflow {
  constructor() {
    this.cleaner = new DatabaseCleaner();
    this.etlLoader = new ETLLoader();
  }

  /**
   * Workflow complet avec confirmation
   */
  async runFullWorkflow(csvFilePath) {
    try {
      console.log('🚀 Workflow complet : Nettoyage + Import ETL\n');
      
      // 1. Vérifier que le fichier CSV existe
      const fs = require('fs');
      if (!fs.existsSync(csvFilePath)) {
        throw new Error(`Fichier CSV non trouvé : ${csvFilePath}`);
      }
      
      console.log(`📁 Fichier CSV : ${csvFilePath}`);
      
      // 2. Afficher l'état actuel
      console.log('\n📊 État actuel de la base de données :');
      await this.cleaner.showSummary();
      
      // 3. Demander confirmation pour le workflow complet
      const confirmed = await this.askWorkflowConfirmation();
      if (!confirmed) {
        console.log('❌ Workflow annulé par l\'utilisateur');
        return;
      }

      // 4. Nettoyer la base (mode silencieux)
      console.log('\n🧹 ÉTAPE 1/2 : Nettoyage de la base de données...');
      await this.cleaner.cleanDatabase();
      await this.cleaner.resetAutoIncrements();
      console.log('✅ Nettoyage terminé');

      // 5. Charger les nouvelles données
      console.log('\n📥 ÉTAPE 2/2 : Chargement des nouvelles données...');
      await this.etlLoader.loadData(csvFilePath);
      console.log('✅ Import terminé');

      // 6. Résumé final
      console.log('\n🎉 WORKFLOW TERMINÉ AVEC SUCCÈS !');
      await this.showFinalSummary();

    } catch (error) {
      console.error('\n💥 Erreur pendant le workflow :', error.message);
      throw error;
    }
  }

  /**
   * Workflow silencieux (sans confirmation)
   */
  async runSilentWorkflow(csvFilePath) {
    try {
      console.log('🤖 Workflow silencieux : Nettoyage + Import ETL');
      console.log(`📁 Fichier CSV : ${csvFilePath}\n`);
      
      // Vérifier le fichier
      const fs = require('fs');
      if (!fs.existsSync(csvFilePath)) {
        throw new Error(`Fichier CSV non trouvé : ${csvFilePath}`);
      }

      // Nettoyer
      console.log('🧹 Nettoyage de la base...');
      await this.cleaner.cleanDatabase();
      await this.cleaner.resetAutoIncrements();

      // Charger
      console.log('📥 Chargement des données...');
      await this.etlLoader.loadData(csvFilePath);

      console.log('🎉 Workflow silencieux terminé');
      
    } catch (error) {
      console.error('💥 Erreur workflow silencieux :', error.message);
      throw error;
    }
  }

  /**
   * Demande confirmation pour le workflow complet
   */
  async askWorkflowConfirmation() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n⚠️  ATTENTION : Cette opération va :\n' +
                 '   1. SUPPRIMER toutes les données actuelles (sauf users/enums)\n' +
                 '   2. CHARGER les nouvelles données depuis le CSV\n\n' +
                 'Confirmez-vous ce workflow complet ? (tapez "OUI" pour confirmer) : ', (answer) => {
        rl.close();
        resolve(answer.trim().toUpperCase() === 'OUI');
      });
    });
  }

  /**
   * Affiche un résumé final après le workflow
   */
  async showFinalSummary() {
    console.log('\n📈 Résumé final :');
    console.log('─'.repeat(50));
    
    const { sequelize } = require('../models');
    const tables = ['clients', 'orders', 'parts', 'tests', 'nodes'];
    
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        console.log(`   ${table}: ${count} enregistrements`);
      } catch (error) {
        console.log(`   ${table}: ❌ Erreur`);
      }
    }
    
    console.log('─'.repeat(50));
    console.log('✅ Base de données mise à jour avec succès !');
  }
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔄 Workflow complet : Nettoyage + Import ETL

Usage:
  npm run workflow <fichier.csv>              # Workflow avec confirmation
  npm run workflow:silent <fichier.csv>       # Workflow silencieux
  
Exemples:
  npm run workflow "C:/path/to/data.csv"
  npm run workflow:silent dataset.csv
`);
    return;
  }

  // Gérer les arguments
  const silentMode = args.includes('--silent');
  let csvFilePath;
  
  if (silentMode) {
    // En mode silencieux, le fichier est après --silent
    const silentIndex = args.indexOf('--silent');
    csvFilePath = args[silentIndex + 1] || args[0];
  } else {
    // En mode normal, prendre le premier argument qui n'est pas --silent
    csvFilePath = args.find(arg => arg !== '--silent');
  }
  
  if (!csvFilePath) {
    console.error('❌ Fichier CSV manquant');
    process.exit(1);
  }
  
  const workflow = new FullWorkflow();

  try {
    if (silentMode) {
      await workflow.runSilentWorkflow(csvFilePath);
    } else {
      await workflow.runFullWorkflow(csvFilePath);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Erreur fatale workflow :', error.message);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = FullWorkflow;
