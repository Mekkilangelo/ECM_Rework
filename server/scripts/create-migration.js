#!/usr/bin/env node
/**
 * Helper to create a new migration file
 *
 * Usage: node server/scripts/create-migration.js <description>
 * Example: node server/scripts/create-migration.js add-recipe-notes-column
 *
 * Creates: server/migrations/NNN-<description>.js
 */

const fs = require('fs');
const path = require('path');

const description = process.argv.slice(2).join('-');
if (!description) {
  console.error('Usage: node server/scripts/create-migration.js <description>');
  console.error('Example: node server/scripts/create-migration.js add-recipe-notes');
  process.exit(1);
}

const slug = description
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const migrationsDir = path.join(__dirname, '..', 'migrations');

// Find next sequence number
const existing = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.js'))
  .sort();

let nextNum = 1;
if (existing.length > 0) {
  const lastNum = parseInt(existing[existing.length - 1].split('-')[0], 10);
  if (!isNaN(lastNum)) nextNum = lastNum + 1;
}

const prefix = String(nextNum).padStart(3, '0');
const filename = `${prefix}-${slug}.js`;
const filepath = path.join(migrationsDir, filename);

const template = `/**
 * Migration ${prefix} - ${slug}
 */
module.exports = {
  name: '${prefix}-${slug}',

  async up(queryInterface, sequelize, transaction) {
    // Example: add a column
    // await queryInterface.addColumn('table_name', 'column_name', {
    //   type: require('sequelize').DataTypes.STRING,
    //   allowNull: true,
    // }, { transaction });

    // Example: raw SQL
    // await sequelize.query('INSERT IGNORE INTO ...', { transaction });
  }
};
`;

fs.writeFileSync(filepath, template, 'utf8');
console.log(`Created: server/migrations/${filename}`);
