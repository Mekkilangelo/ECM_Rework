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
      // Ensuite specs
      'specs_hardness',
      'specs_ecd',
      
      // Puis les nodes métiers
      'trials',
      'parts', 
      'trial_requests',
      'clients',
      'steels',
      'steel_equivalents',
      'files',
      'furnaces',
      'logs',
      'contacts',
      
      // Ensuite les tables de relations
      'closure',
      
      // Enfin la table principale
      'nodes'
    ];
    
    // Tables de référence à vider (remplies dynamiquement)
    this.referenceTablesToClean = [];
    
    // Tables recipe_* à vider (remplies dynamiquement)
    this.recipeTablesToClean = [];
    
    // Tables results_* à vider (remplies dynamiquement)
    this.resultsTablesToClean = [];
  }

  /**
   * Récupère toutes les tables commençant par ref_
   */
  async getReferenceTables() {
    try {
      const [tables] = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME LIKE 'ref_%'
        ORDER BY TABLE_NAME
      `);
      
      this.referenceTablesToClean = tables.map(t => t.TABLE_NAME);
      return this.referenceTablesToClean;
    } catch (error) {
      console.error('   ❌ Erreur récupération tables ref_ :', error.message);
      return [];
    }
  }

  /**
   * Récupère toutes les tables commençant par recipe_
   */
  async getRecipeTables() {
    try {
      const [tables] = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME LIKE 'recipe_%'
        ORDER BY TABLE_NAME
      `);
      
      this.recipeTablesToClean = tables.map(t => t.TABLE_NAME);
      // Ajouter 'recipes' à la fin si elle existe
      const [recipesTable] = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'recipes'
      `);
      if (recipesTable.length > 0) {
        this.recipeTablesToClean.push('recipes');
      }
      return this.recipeTablesToClean;
    } catch (error) {
      console.error('   ❌ Erreur récupération tables recipe_ :', error.message);
      return [];
    }
  }

  /**
   * Récupère toutes les tables commençant par results_
   */
  async getResultsTables() {
    try {
      const [tables] = await sequelize.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME LIKE 'results_%'
        ORDER BY TABLE_NAME DESC
      `);
      
      this.resultsTablesToClean = tables.map(t => t.TABLE_NAME);
      return this.resultsTablesToClean;
    } catch (error) {
      console.error('   ❌ Erreur récupération tables results_ :', error.message);
      return [];
    }
  }

  /**
   * Affiche un résumé avant nettoyage
   */
  async showSummary() {
    // Récupérer les tables dynamiquement
    await this.getReferenceTables();
    await this.getRecipeTables();
    await this.getResultsTables();
    
    console.log('\nResume des donnees en base:');
    
    console.log('\nTables metier:');
    for (const table of this.tablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        console.log(`  - ${table}: ${count} lignes`);
      } catch (error) {
        console.error(`  - ${table}: Erreur`);
      }
    }
    
    console.log(`\nTables de reference (ref_*): ${this.referenceTablesToClean.length} tables`);
    for (const table of this.referenceTablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        console.log(`  - ${table}: ${count} lignes`);
      } catch (error) {
        console.error(`  - ${table}: Erreur`);
      }
    }

    console.log(`\nTables recipe_* et recipes: ${this.recipeTablesToClean.length} tables`);
    for (const table of this.recipeTablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        console.log(`  - ${table}: ${count} lignes`);
      } catch (error) {
        console.error(`  - ${table}: Erreur`);
      }
    }

    console.log(`\nTables results_*: ${this.resultsTablesToClean.length} tables`);
    for (const table of this.resultsTablesToClean) {
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

      // Vider les tables results_* (enfants de trials)
      console.log('\n📊 Nettoyage des tables results_*...');
      for (const table of this.resultsTablesToClean) {
        const success = await this.truncateTable(table);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Vider les tables recipe_* (enfants de trials via recipes)
      console.log('\n🧪 Nettoyage des tables recipe_* et recipes...');
      for (const table of this.recipeTablesToClean) {
        const success = await this.truncateTable(table);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Vider les tables métier dans l'ordre
      console.log('\n📦 Nettoyage des tables métier...');
      for (const table of this.tablesToClean) {
        
        const success = await this.truncateTable(table);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Vider les tables de référence
      console.log('\n🔖 Nettoyage des tables de référence (ref_*)...');
      // Ordre important: tables avec FK doivent être vidées avant leurs parents
      // ref_units doit être vidée avant ref_unit_types
      const sortedRefTables = [...this.referenceTablesToClean].sort((a, b) => {
        // ref_units avant ref_unit_types
        if (a === 'ref_units' && b === 'ref_unit_types') return -1;
        if (a === 'ref_unit_types' && b === 'ref_units') return 1;
        return a.localeCompare(b);
      });

      for (const table of sortedRefTables) {
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
    
    // Vérifier les tables results_*
    console.log('\n📊 Vérification des tables results_* :');
    for (const table of this.resultsTablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        totalRemaining += count;
        
        if (count === 0) {
          console.log(`   ✅ ${table} : vide`);
        } else {
          console.log(`   ⚠️  ${table} : ${count} lignes restantes`);
        }
      } catch (error) {
        console.log(`   ❌ ${table} : erreur`);
      }
    }

    // Vérifier les tables recipe_*
    console.log('\n📊 Vérification des tables recipe_* :');
    for (const table of this.recipeTablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        totalRemaining += count;
        
        if (count === 0) {
          console.log(`   ✅ ${table} : vide`);
        } else {
          console.log(`   ⚠️  ${table} : ${count} lignes restantes`);
        }
      } catch (error) {
        console.log(`   ❌ ${table} : erreur`);
      }
    }

    // Vérifier les tables métier
    console.log('\n📊 Vérification des tables métier :');
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

    // Vérifier les tables de référence
    console.log('\n📊 Vérification des tables de référence (ref_*) :');
    for (const table of this.referenceTablesToClean) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = results[0].count;
        totalRemaining += count;
        
        if (count === 0) {
          console.log(`   ✅ ${table} : vide`);
        } else {
          console.log(`   ⚠️  ${table} : ${count} lignes restantes`);
        }
      } catch (error) {
        console.log(`   ❌ ${table} : erreur`);
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
