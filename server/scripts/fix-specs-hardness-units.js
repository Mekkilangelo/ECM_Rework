/**
 * Script pour corriger les valeurs invalides de unit dans specs_hardness
 * Identifie et corrige les valeurs qui ne correspondent pas à ref_units.name
 */

const { sequelize } = require('../models');
const logger = require('../utils/logger');

async function fixSpecsHardnessUnits() {
  try {
    console.log('🔍 Diagnostic des valeurs de unit dans specs_hardness...\n');

    // 1. Trouver toutes les valeurs distinctes de unit dans specs_hardness
    const [hardnessUnits] = await sequelize.query(`
      SELECT DISTINCT unit, COUNT(*) as count
      FROM specs_hardness
      WHERE unit IS NOT NULL
      GROUP BY unit
      ORDER BY unit;
    `);

    console.log('📊 Valeurs actuelles dans specs_hardness.unit:');
    hardnessUnits.forEach(row => {
      console.log(`   - "${row.unit}": ${row.count} enregistrements`);
    });
    console.log('');

    // 2. Trouver les valeurs valides dans ref_units
    const [validUnits] = await sequelize.query(`
      SELECT name
      FROM ref_units
      ORDER BY name;
    `);

    console.log('✅ Valeurs valides dans ref_units.name:');
    validUnits.forEach(row => {
      console.log(`   - "${row.name}"`);
    });
    console.log('');

    // 3. Identifier les valeurs invalides
    const validUnitNames = validUnits.map(u => u.name);
    const invalidUnits = hardnessUnits.filter(hu => !validUnitNames.includes(hu.unit));

    if (invalidUnits.length === 0) {
      console.log('✅ Aucune valeur invalide trouvée!\n');
      return;
    }

    console.log('❌ Valeurs invalides trouvées:');
    invalidUnits.forEach(row => {
      console.log(`   - "${row.unit}": ${row.count} enregistrements`);
    });
    console.log('');

    // 4. Proposer des corrections
    console.log('🔧 Corrections suggérées:');
    const corrections = [];
    
    invalidUnits.forEach(invalid => {
      const unit = invalid.unit.toLowerCase();
      let suggestion = null;

      // Mapping des corrections courantes
      if (unit.includes('hv') || unit.includes('vickers')) {
        suggestion = validUnitNames.find(v => v.toLowerCase().includes('hv'));
      } else if (unit.includes('hrc') || unit.includes('rockwell c')) {
        suggestion = validUnitNames.find(v => v.toLowerCase().includes('hrc'));
      } else if (unit.includes('hrb') || unit.includes('rockwell b')) {
        suggestion = validUnitNames.find(v => v.toLowerCase().includes('hrb'));
      } else if (unit.includes('hb') || unit.includes('brinell')) {
        suggestion = validUnitNames.find(v => v.toLowerCase().includes('hb'));
      }

      if (suggestion) {
        console.log(`   "${invalid.unit}" → "${suggestion}"`);
        corrections.push({ from: invalid.unit, to: suggestion, count: invalid.count });
      } else {
        console.log(`   "${invalid.unit}" → NULL (aucune correspondance trouvée)`);
        corrections.push({ from: invalid.unit, to: null, count: invalid.count });
      }
    });
    console.log('');

    // 5. Demander confirmation (ou appliquer automatiquement en mode --auto)
    const autoMode = process.argv.includes('--auto');
    
    if (!autoMode) {
      console.log('⚠️  Pour appliquer ces corrections, relancez avec --auto:');
      console.log('   node scripts/fix-specs-hardness-units.js --auto\n');
      return;
    }

    console.log('🔧 Application des corrections...\n');

    // 6. Appliquer les corrections dans une transaction
    await sequelize.transaction(async (t) => {
      for (const correction of corrections) {
        if (correction.to === null) {
          // Mettre à NULL
          const [result] = await sequelize.query(
            `UPDATE specs_hardness SET unit = NULL WHERE unit = :from`,
            {
              replacements: { from: correction.from },
              transaction: t
            }
          );
          console.log(`   ✅ "${correction.from}" → NULL (${correction.count} enregistrements)`);
        } else {
          // Mettre à jour avec la valeur correcte
          const [result] = await sequelize.query(
            `UPDATE specs_hardness SET unit = :to WHERE unit = :from`,
            {
              replacements: { from: correction.from, to: correction.to },
              transaction: t
            }
          );
          console.log(`   ✅ "${correction.from}" → "${correction.to}" (${correction.count} enregistrements)`);
        }
      }
    });

    console.log('\n✅ Toutes les corrections ont été appliquées avec succès!\n');

    // 7. Vérification finale
    const [remainingInvalid] = await sequelize.query(`
      SELECT DISTINCT sh.unit, COUNT(*) as count
      FROM specs_hardness sh
      LEFT JOIN ref_units ru ON sh.unit = ru.name
      WHERE sh.unit IS NOT NULL AND ru.name IS NULL
      GROUP BY sh.unit;
    `);

    if (remainingInvalid.length > 0) {
      console.log('⚠️  Il reste encore des valeurs invalides:');
      remainingInvalid.forEach(row => {
        console.log(`   - "${row.unit}": ${row.count} enregistrements`);
      });
      console.log('');
    } else {
      console.log('✅ Toutes les valeurs sont maintenant valides!\n');
      console.log('🚀 Vous pouvez maintenant redémarrer le serveur.\n');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Exécution
fixSpecsHardnessUnits()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
