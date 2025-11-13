/**
 * Script de nettoyage de la base de données
 * Supprime toutes les données en préservant certaines tables importantes
 */

const { sequelize } = require('../models');
const readline = require('readline');

class DatabaseCleaner {
  constructor() {
    // Tables à préserver (ne pas vider)
    this.preservedTables = [
      'users',           // Utilisateurs
      'enums',           // Énumérations système
      'SequelizeMeta'    // Migrations Sequelize
    ];

    // Tables à vider dans un ordre spécifique (pour respecter les contraintes)
    this.tablesToClean = [
      // Commencer par les tables sans dépendances (feuilles)
      'tests',
      'parts', 
      'orders',
      'clients',
      'files',
      'steels',
      'furnaces',
      'logs',
      
      // Ensuite les tables de relations
      'closure',
      
      // Enfin la table principale
      'nodes'
    ];
  }

  /**
   * Affiche un résumé avant nettoyage
   */
  async showSummary() {
    console.log('\nResume des donnees en base:');
    console.log('Tables a nettoyer:');
    for (const table of this.tablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        console.log(`  - ${table}: ${count} lignes`);
      } catch (error) {
        console.error(`  - ${table}: Erreur`);
      }
    }

    console.log('\nTables preservees:');
    for (const table of this.preservedTables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        console.log(`  - ${table}: ${count} lignes`);
      } catch (error) {
        console.error(`  - ${table}: Erreur`);
      }
    }
  }

  /**
   * Désactive les contraintes de clés étrangères
   */
  async disableForeignKeyChecks() {
    try {
      
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
    } catch (error) {
      console.error('   ❌ Erreur désactivation contraintes :', error.message);
      throw error;
    }
  }

  /**
   * Réactive les contraintes de clés étrangères
   */
  async enableForeignKeyChecks() {
    try {
      
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
    } catch (error) {
      console.error('   ❌ Erreur réactivation contraintes :', error.message);
      throw error;
    }
  }

  /**
   * Vide une table spécifique
   */
  async truncateTable(tableName) {
    try {
      await sequelize.query(`TRUNCATE TABLE ${tableName}`);
      
      return true;
    } catch (error) {
      console.error(`   ❌ Erreur vidage ${tableName}: ${error.message}`);
      return false;
    }
  }

  /**
   * Nettoie toutes les tables (sauf celles préservées)
   */
  async cleanDatabase() {
    
    
    let successCount = 0;
    let errorCount = 0;

    // Démarrer une transaction
    const transaction = await sequelize.transaction();

    try {
      // Désactiver les contraintes
      await this.disableForeignKeyChecks();

      // Vider les tables dans l'ordre
      for (const table of this.tablesToClean) {
        
        const success = await this.truncateTable(table);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Réactiver les contraintes
      await this.enableForeignKeyChecks();

      await transaction.commit();

      
      
      
      

    } catch (error) {
      await transaction.rollback();
      console.error('\n💥 Erreur pendant le nettoyage :', error.message);
      
      // Toujours réactiver les contraintes en cas d'erreur
      try {
        await this.enableForeignKeyChecks();
      } catch (e) {
        console.error('⚠️  Impossible de réactiver les contraintes :', e.message);
      }
      
      throw error;
    }
  }

  /**
   * Remet à zéro les auto-increment
   */
  async resetAutoIncrements() {
    
    
    const tablesWithAutoIncrement = ['nodes', 'users', 'logs'];
    
    for (const table of tablesWithAutoIncrement) {
      if (!this.preservedTables.includes(table) || table === 'nodes') {
        try {
          await sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
          
        } catch (error) {
          
        }
      }
    }
  }

  /**
   * Vérifie l'état après nettoyage
   */
  async verifyCleanup() {
    
    
    let totalRemaining = 0;
    
    for (const table of this.tablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        totalRemaining += count;
        
        if (count === 0) {
          
        } else {
          
        }
      } catch (error) {
        
      }
    }

    
    
    if (totalRemaining === 0) {
      
    } else {
      
    }
  }

  /**
   * Processus complet de nettoyage
   */
  async clean() {
    try {
      
      
      // 1. Afficher le résumé actuel
      await this.showSummary();
      
      // 2. Demander confirmation
      const confirmed = await this.askConfirmation();
      if (!confirmed) {
        
        return;
      }

      // 3. Nettoyer la base
      await this.cleanDatabase();

      // 4. Remettre à zéro les auto-increments
      await this.resetAutoIncrements();

      // 5. Vérifier le résultat
      await this.verifyCleanup();

      

    } catch (error) {
      console.error('\n💥 Erreur fatale pendant le nettoyage :', error);
      throw error;
    }
  }

  /**
   * Demande confirmation à l'utilisateur
   */
  async askConfirmation() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n⚠️  ATTENTION : Cette opération va supprimer TOUTES les données (sauf users et enums).\nÊtes-vous sûr de vouloir continuer ? (tapez "OUI" pour confirmer) : ', (answer) => {
        rl.close();
        resolve(answer.trim().toUpperCase() === 'OUI');
      });
    });
  }
}

/**
 * Mode silencieux pour tests/scripts automatiques
 */
async function cleanSilent() {
  const cleaner = new DatabaseCleaner();
  
  
  await cleaner.showSummary();
  await cleaner.cleanDatabase();
  await cleaner.resetAutoIncrements();
  await cleaner.verifyCleanup();
  
  
}

/**
 * Fonction principale
 */
async function main() {
  const args = process.argv.slice(2);
  const silentMode = args.includes('--silent') || args.includes('-s');

  try {
    if (silentMode) {
      await cleanSilent();
    } else {
      const cleaner = new DatabaseCleaner();
      await cleaner.clean();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Erreur fatale :', error.message);
    process.exit(1);
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main();
}

module.exports = { DatabaseCleaner, cleanSilent };
