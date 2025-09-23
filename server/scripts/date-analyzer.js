/**
 * Script de diagnostic pour analyser les dates dans un fichier CSV
 */

const fs = require('fs');
const csv = require('csv-parser');

async function analyzeDateFormats(csvFilePath) {
  console.log(`🔍 Analyse des formats de dates dans : ${csvFilePath}\n`);
  
  if (!fs.existsSync(csvFilePath)) {
    console.log('❌ Fichier non trouvé');
    return;
  }

  const results = [];
  const dateColumns = ['created_on', 'updated_on', 'date'];
  const dateFormats = new Map();
  const invalidDates = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`📊 ${results.length} lignes analysées\n`);

        // Analyser chaque colonne de date
        dateColumns.forEach(column => {
          if (results.length > 0 && results[0].hasOwnProperty(column)) {
            console.log(`📅 Analyse colonne "${column}" :`);
            
            const uniqueValues = new Set();
            const formats = new Map();
            
            results.forEach((row, index) => {
              const dateValue = row[column];
              if (dateValue && dateValue.trim()) {
                uniqueValues.add(dateValue);
                
                // Tester si la date est valide
                const testDate = new Date(dateValue);
                if (isNaN(testDate.getTime())) {
                  invalidDates.push({
                    line: index + 1,
                    column: column,
                    value: dateValue
                  });
                } else {
                  // Détecter le format
                  let format = 'Unknown';
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    format = 'YYYY-MM-DD';
                  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
                    format = 'DD/MM/YYYY';
                  } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
                    format = 'DD-MM-YYYY';
                  } else if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateValue)) {
                    format = 'YYYY/MM/DD';
                  }
                  
                  formats.set(format, (formats.get(format) || 0) + 1);
                }
              }
            });

            console.log(`   📈 ${uniqueValues.size} valeurs uniques trouvées`);
            console.log(`   📋 Formats détectés :`);
            formats.forEach((count, format) => {
              console.log(`     - ${format}: ${count} occurrences`);
            });
            
            // Montrer quelques exemples
            const examples = Array.from(uniqueValues).slice(0, 5);
            console.log(`   📝 Exemples de valeurs :`);
            examples.forEach(example => {
              const testDate = new Date(example);
              const status = isNaN(testDate.getTime()) ? '❌' : '✅';
              console.log(`     ${status} "${example}"`);
            });
            console.log('');
          }
        });

        // Résumé des dates invalides
        if (invalidDates.length > 0) {
          console.log(`⚠️  ${invalidDates.length} dates invalides trouvées :`);
          invalidDates.slice(0, 10).forEach(item => {
            console.log(`   Ligne ${item.line}, colonne "${item.column}": "${item.value}"`);
          });
          if (invalidDates.length > 10) {
            console.log(`   ... et ${invalidDates.length - 10} autres`);
          }
          console.log('');
        } else {
          console.log('✅ Toutes les dates sont dans un format valide\n');
        }

        // Recommandations
        console.log('💡 Recommandations :');
        if (invalidDates.length > 0) {
          console.log('   - Corrigez les dates invalides dans votre CSV');
          console.log('   - Utilisez le format ISO (YYYY-MM-DD) pour éviter les ambiguïtés');
        } else {
          console.log('   - Vos dates semblent correctes');
        }
        console.log('   - Le script ETL gère automatiquement les formats courants');

        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node date-analyzer.js <chemin-vers-fichier-csv>');
    process.exit(1);
  }

  const csvFilePath = process.argv[2];

  try {
    await analyzeDateFormats(csvFilePath);
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { analyzeDateFormats };
