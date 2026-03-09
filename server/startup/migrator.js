/**
 * Migration runner - executes pending migrations at startup
 *
 * How it works:
 *   1. Creates a `_migrations` table if it doesn't exist
 *   2. Acquires an advisory lock to prevent concurrent runs
 *   3. Scans server/migrations/ for JS files (sorted alphabetically)
 *   4. Runs any migration not yet recorded in `_migrations`
 *   5. Records each successful migration within the SAME transaction
 *
 * Migration file format:
 *   module.exports = {
 *     name: '001-short-description',
 *     async up(queryInterface, sequelize, transaction) { ... }
 *   };
 *
 * Naming convention: NNN-description.js (e.g. 001-add-file-categories.js)
 * The numeric prefix ensures execution order.
 *
 * Safety guarantees:
 *   - Each migration + its record in _migrations run in a single transaction
 *   - If a migration fails, the transaction is rolled back: nothing is applied
 *   - Advisory lock prevents two server instances from running migrations simultaneously
 *   - On failure the server refuses to start (fail-fast)
 */

const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const TABLE_NAME = '_migrations';
const LOCK_ID = 73616; // arbitrary fixed number for GET_LOCK()

/**
 * Ensure the migrations tracking table exists
 */
async function ensureMigrationsTable(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
      \`name\` VARCHAR(255) NOT NULL PRIMARY KEY,
      \`executed_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

/**
 * Get list of already-executed migration names
 */
async function getExecutedMigrations(sequelize) {
  const [rows] = await sequelize.query(
    `SELECT name FROM \`${TABLE_NAME}\` ORDER BY name`
  );
  return new Set(rows.map(r => r.name));
}

/**
 * Load migration files from disk, sorted by filename
 */
function loadMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort()
    .map(filename => {
      const mod = require(path.join(MIGRATIONS_DIR, filename));
      return {
        filename,
        name: mod.name || path.basename(filename, '.js'),
        up: mod.up
      };
    });
}

/**
 * Acquire a MySQL advisory lock (blocks if another instance holds it)
 * Returns true if acquired, false on timeout
 */
async function acquireLock(sequelize) {
  const [[row]] = await sequelize.query(
    `SELECT GET_LOCK('synergia_migrations', 30) AS acquired`
  );
  return row.acquired === 1;
}

/**
 * Release the advisory lock
 */
async function releaseLock(sequelize) {
  await sequelize.query(`SELECT RELEASE_LOCK('synergia_migrations')`);
}

/**
 * Run all pending migrations
 * Called after Sequelize sync in the startup sequence
 *
 * @param {import('sequelize').Sequelize} sequelize
 */
async function runMigrations(sequelize) {
  await ensureMigrationsTable(sequelize);

  // Prevent concurrent migration runs (e.g. multiple containers starting)
  const locked = await acquireLock(sequelize);
  if (!locked) {
    throw new Error(
      'Could not acquire migration lock (timeout after 30s). ' +
      'Another instance may be running migrations.'
    );
  }

  try {
    // Re-read executed list after acquiring the lock
    // (another instance may have just finished)
    const executed = await getExecutedMigrations(sequelize);
    const migrations = loadMigrationFiles();
    const pending = migrations.filter(m => !executed.has(m.name));

    if (pending.length === 0) {
      logger.info('Migrations: nothing to run');
      return;
    }

    logger.info(`Migrations: ${pending.length} pending`);

    const queryInterface = sequelize.getQueryInterface();

    for (const migration of pending) {
      const t = await sequelize.transaction();
      try {
        logger.info(`  Running: ${migration.name}...`);

        await migration.up(queryInterface, sequelize, t);

        // Record inside the SAME transaction — atomic with the migration
        await sequelize.query(
          `INSERT INTO \`${TABLE_NAME}\` (name) VALUES (?)`,
          { replacements: [migration.name], transaction: t }
        );

        await t.commit();
        logger.info(`  Done: ${migration.name}`);
      } catch (error) {
        await t.rollback();
        logger.error(`  FAILED: ${migration.name} - ${error.message}`);
        throw new Error(
          `Migration "${migration.name}" failed: ${error.message}. ` +
          'Fix the issue and restart the server. All subsequent migrations are skipped.'
        );
      }
    }

    logger.info(`Migrations: ${pending.length} applied successfully`);
  } finally {
    await releaseLock(sequelize);
  }
}

module.exports = { runMigrations };
