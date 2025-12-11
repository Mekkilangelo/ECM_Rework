/**
 * Migration: Ajout des champs wait_gas et wait_flow
 * 
 * Ce script ajoute deux nouveaux champs à la table recipe_chemical_cycle:
 * - wait_gas: le type de gaz utilisé durant la montée en chauffe
 * - wait_flow: le débit du gaz durant la montée en chauffe
 * 
 * Usage: node server/scripts/migrations/run-add-wait-gas-flow.js
 */

const { sequelize } = require('../../models');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Début de la migration: Ajout wait_gas et wait_flow...\n');

    // Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'add-wait-gas-flow.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Exécuter la migration
    await sequelize.query(sql);

    console.log('\n✅ Migration terminée avec succès!');
    console.log('Les colonnes wait_gas et wait_flow ont été ajoutées à recipe_chemical_cycle');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécution
runMigration()
  .then(() => {
    console.log('\n✨ Processus terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
