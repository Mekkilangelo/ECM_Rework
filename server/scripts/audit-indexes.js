/**
 * Script d'audit et nettoyage des index dupliqués
 *
 * Usage:
 *   node scripts/audit-indexes.js           # Diagnostic seul (lecture)
 *   node scripts/audit-indexes.js --clean   # Diagnostic + suppression des doublons
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const DRY_RUN = !process.argv.includes('--clean');

async function auditIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'synergia'
  });

  const dbName = process.env.DB_NAME || 'synergia';

  console.log(DRY_RUN
    ? '=== MODE DIAGNOSTIC (lecture seule) ==='
    : '=== MODE NETTOYAGE (suppression des doublons) ==='
  );
  console.log(`Base: ${dbName}\n`);

  try {
    // 1. Récupérer TOUTES les tables de la base
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [dbName]
    );

    let totalDuplicates = 0;
    let totalDropped = 0;

    for (const { TABLE_NAME: table } of tables) {
      // Récupérer tous les index de la table
      const [indexes] = await connection.query(`SHOW INDEX FROM \`${table}\``);
      if (indexes.length === 0) continue;

      // Grouper les colonnes par nom d'index pour reconstituer les index multi-colonnes
      const indexMap = {};
      for (const row of indexes) {
        const name = row.Key_name;
        if (!indexMap[name]) {
          indexMap[name] = { columns: [], nonUnique: row.Non_unique };
        }
        indexMap[name].columns[row.Seq_in_index - 1] = row.Column_name;
      }

      // Grouper les index par signature de colonnes pour trouver les doublons
      // signature = "col1,col2" triée par position
      const bySignature = {};
      for (const [name, info] of Object.entries(indexMap)) {
        if (name === 'PRIMARY') continue;
        const sig = info.columns.join(',');
        if (!bySignature[sig]) bySignature[sig] = [];
        bySignature[sig].push({ name, ...info });
      }

      // Trouver les groupes avec doublons
      const duplicateGroups = Object.entries(bySignature)
        .filter(([, group]) => group.length > 1);

      if (duplicateGroups.length === 0) continue;

      console.log(`\n${'─'.repeat(60)}`);
      console.log(`TABLE: ${table}`);
      console.log(`${'─'.repeat(60)}`);

      for (const [sig, group] of duplicateGroups) {
        console.log(`\n  Colonnes: (${sig}) - ${group.length} index trouvés:`);

        // Stratégie : garder l'index nommé explicitement (idx_*, fk_*, unique_*)
        // ou le premier ibfk, et supprimer les autres
        const sorted = group.sort((a, b) => {
          // Priorité : noms explicites > ibfk_1 > ibfk_N > auto-générés
          const score = (name) => {
            if (/^(idx_|fk_|unique_)/.test(name)) return 0; // Nommé explicitement = garder
            if (/^[a-z_]+_ibfk_1$/.test(name)) return 1;   // Premier ibfk = garder
            if (/^[a-z_]+_ibfk_\d+$/.test(name)) return 10; // ibfk dupliqué = supprimer
            return 5; // Auto-généré = probablement supprimer
          };
          return score(a.name) - score(b.name);
        });

        const keep = sorted[0];
        const toRemove = sorted.slice(1);
        totalDuplicates += toRemove.length;

        console.log(`    GARDER : ${keep.name}`);
        for (const dup of toRemove) {
          console.log(`    DOUBLON: ${dup.name}`);
          if (!DRY_RUN) {
            try {
              // Vérifier si c'est une FK constraint d'abord
              const [fkCheck] = await connection.query(
                `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
                [dbName, table, dup.name]
              );
              if (fkCheck.length > 0) {
                await connection.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${dup.name}\``);
                // Après avoir droppé la FK, l'index associé peut rester, le supprimer aussi
                try {
                  await connection.query(`ALTER TABLE \`${table}\` DROP INDEX \`${dup.name}\``);
                } catch (_) { /* L'index peut avoir été supprimé avec la FK */ }
                console.log(`             -> FK + index supprimés`);
              } else {
                await connection.query(`ALTER TABLE \`${table}\` DROP INDEX \`${dup.name}\``);
                console.log(`             -> Index supprimé`);
              }
              totalDropped++;
            } catch (err) {
              console.log(`             -> ERREUR: ${err.message}`);
            }
          }
        }
      }
    }

    // 2. Résumé
    console.log(`\n${'='.repeat(60)}`);
    console.log(`RÉSUMÉ`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Index dupliqués trouvés : ${totalDuplicates}`);
    if (DRY_RUN) {
      if (totalDuplicates > 0) {
        console.log(`\nPour supprimer les doublons, relancez avec :`);
        console.log(`  node scripts/audit-indexes.js --clean`);
      } else {
        console.log(`\nAucun doublon detecté, la base est propre.`);
      }
    } else {
      console.log(`Index supprimés         : ${totalDropped}`);
      console.log(`\nRedémarrez le serveur pour que les index nommés soient recréés par Sequelize.`);
    }

  } catch (error) {
    console.error('ERREUR:', error.message);
  } finally {
    await connection.end();
  }
}

auditIndexes();
