/**
 * Script de nettoyage des index en excès
 * Résout l'erreur "Too many keys specified; max 64 keys allowed"
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanupIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'synergia'
  });

  console.log('🔌 Connexion à la base de données établie');

  try {
    // Tables à nettoyer
    const tables = ['nodes', 'clients', 'trials', 'parts', 'trial_requests', 'files', 'closures', 'users', 'recipes', 'recipe_chemical_cycle', 'recipe_gas_quench', 'recipe_oil_quench', 'recipe_preox_cycle', 'furnaces', 'specs_ecd', 'specs_hardness', 'steels'];

    for (const table of tables) {
      console.log(`\n📋 Analyse de la table: ${table}`);

      // Vérifier si la table existe
      const [tableExists] = await connection.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
        [process.env.DB_NAME || 'synergia', table]
      );

      if (tableExists.length === 0) {
        console.log(`   ⚠️ Table ${table} n'existe pas, ignorée`);
        continue;
      }

      // Récupérer tous les index
      const [indexes] = await connection.query(`SHOW INDEX FROM \`${table}\``);

      // Grouper les index par nom
      const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
      console.log(`   📊 ${indexNames.length} index trouvés`);

      // Récupérer les foreign keys
      const [foreignKeys] = await connection.query(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = ?
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `, [process.env.DB_NAME || 'synergia', table]);

      console.log(`   🔗 ${foreignKeys.length} clés étrangères trouvées`);

      // Identifier les foreign keys dupliquées (avec numéro à la fin comme ibfk_135)
      const fkPattern = /^[a-z_]+_ibfk_(\d+)$/;
      const duplicateFKs = foreignKeys.filter(fk => {
        const match = fk.CONSTRAINT_NAME.match(fkPattern);
        return match && parseInt(match[1]) > 10; // Garder seulement les premiers 10
      });

      if (duplicateFKs.length > 0) {
        console.log(`   🗑️ Suppression de ${duplicateFKs.length} clés étrangères dupliquées...`);

        for (const fk of duplicateFKs) {
          try {
            await connection.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            console.log(`      ✅ Supprimé: ${fk.CONSTRAINT_NAME}`);
          } catch (err) {
            console.log(`      ⚠️ Impossible de supprimer ${fk.CONSTRAINT_NAME}: ${err.message}`);
          }
        }
      }

      // Identifier les index dupliqués (même pattern)
      const idxPattern = /^[a-z_]+_(\d+)$/;
      const duplicateIndexes = indexNames.filter(name => {
        if (name === 'PRIMARY') return false;
        const match = name.match(idxPattern);
        return match && parseInt(match[1]) > 10;
      });

      if (duplicateIndexes.length > 0) {
        console.log(`   🗑️ Suppression de ${duplicateIndexes.length} index dupliqués...`);

        for (const idx of duplicateIndexes) {
          try {
            await connection.query(`ALTER TABLE \`${table}\` DROP INDEX \`${idx}\``);
            console.log(`      ✅ Supprimé: ${idx}`);
          } catch (err) {
            console.log(`      ⚠️ Impossible de supprimer ${idx}: ${err.message}`);
          }
        }
      }
    }

    // Nettoyer aussi tous les FK en excès globalement sur nodes
    console.log('\n🔧 Nettoyage agressif des FK sur nodes...');

    const [allFKs] = await connection.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'nodes'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `, [process.env.DB_NAME || 'synergia']);

    // Garder seulement les FK nommées explicitement (idx_*, fk_*, etc.) et quelques ibfk de base
    const fksToKeep = new Set(['idx_parent_id', 'idx_data_status', 'idx_type', 'fk_nodes_parent', 'fk_nodes_data_status']);
    let deletedCount = 0;

    for (const fk of allFKs) {
      const name = fk.CONSTRAINT_NAME;
      // Garder les FK nommées explicitement ou les premiers ibfk
      if (fksToKeep.has(name)) continue;
      if (name.match(/^nodes_ibfk_[1-5]$/)) continue; // Garder ibfk_1 à ibfk_5

      // Si c'est un ibfk avec un numéro élevé, supprimer
      if (name.match(/^nodes_ibfk_\d+$/)) {
        try {
          await connection.query(`ALTER TABLE nodes DROP FOREIGN KEY \`${name}\``);
          deletedCount++;
        } catch (err) {
          // Ignorer les erreurs
        }
      }
    }

    console.log(`   ✅ ${deletedCount} FK en excès supprimées de nodes`);

    // Vérifier le nombre d'index restants
    const [remainingIndexes] = await connection.query(`SHOW INDEX FROM nodes`);
    const uniqueIndexNames = [...new Set(remainingIndexes.map(idx => idx.Key_name))];
    console.log(`\n📊 Nombre d'index restants sur nodes: ${uniqueIndexNames.length}`);

    console.log('\n✅ Nettoyage terminé!');
    console.log('💡 Redémarrez maintenant le serveur avec: npm run dev');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

cleanupIndexes();
