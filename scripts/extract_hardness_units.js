#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../server/models');
const { Enum } = require('../server/models');

/**
 * Script pour extraire toutes les unités de dureté du fichier parts_to_import.json
 * et les ajouter à la table units dans la colonne hardness_units
 */

async function extractHardnessUnits() {
  try {
    console.log('🔍 EXTRACTION DES UNITÉS DE DURETÉ');
    console.log('=====================================\n');

    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données établie');

    // Lecture du fichier JSON
    const partsFile = path.join(__dirname, 'parts_to_import.json');
    const partsData = JSON.parse(fs.readFileSync(partsFile, 'utf8'));
    
    console.log(`📋 Analyse de ${partsData.length} pièces pour extraire les unités de dureté\n`);

    // Set pour stocker les unités uniques
    const hardnessUnits = new Set();
    let processedParts = 0;

    // Parcourir toutes les pièces
    for (const part of partsData) {
      processedParts++;
      
      if (part.specifications) {
        // Extraire les unités des hardnessSpecs
        if (part.specifications.hardnessSpecs && Array.isArray(part.specifications.hardnessSpecs)) {
          for (const hardnessSpec of part.specifications.hardnessSpecs) {
            if (hardnessSpec.unit && hardnessSpec.unit.trim()) {
              hardnessUnits.add(hardnessSpec.unit.trim());
            }
          }
        }

        // Extraire les unités des ecdSpecs
        if (part.specifications.ecdSpecs && Array.isArray(part.specifications.ecdSpecs)) {
          for (const ecdSpec of part.specifications.ecdSpecs) {
            if (ecdSpec.hardnessUnit && ecdSpec.hardnessUnit.trim()) {
              hardnessUnits.add(ecdSpec.hardnessUnit.trim());
            }
          }
        }
      }
    }

    console.log(`📊 Pièces analysées: ${processedParts}`);
    console.log(`🔢 Unités de dureté uniques trouvées: ${hardnessUnits.size}\n`);

    // Convertir le Set en Array et trier
    const uniqueUnits = Array.from(hardnessUnits).sort();
    
    console.log('📝 Unités de dureté identifiées:');
    uniqueUnits.forEach((unit, index) => {
      console.log(`  ${index + 1}. ${unit}`);
    });

    if (uniqueUnits.length === 0) {
      console.log('⚠️  Aucune unité de dureté trouvée dans le fichier');
      return;
    }

    console.log('\n🔄 Récupération des unités existantes dans la base...');
    
    // Récupérer les unités existantes dans la base
    let existingUnits = [];
    try {
      const enumValues = await Enum.getEnumValues('units', 'hardness_units');
      existingUnits = enumValues.values || [];
      console.log(`✅ ${existingUnits.length} unités existantes trouvées`);
    } catch (error) {
      console.log('⚠️  Erreur lors de la récupération des unités existantes:', error.message);
      console.log('   Continuation avec une liste vide...');
    }

    // Filtrer les unités qui n'existent pas déjà
    const newUnits = uniqueUnits.filter(unit => !existingUnits.includes(unit));
    
    console.log(`\n📈 Unités déjà existantes: ${existingUnits.length}`);
    console.log(`🆕 Nouvelles unités à ajouter: ${newUnits.length}\n`);

    if (newUnits.length === 0) {
      console.log('✅ Toutes les unités de dureté sont déjà présentes dans la base');
      return;
    }

    console.log('🔄 Ajout des nouvelles unités...');
    
    let added = 0;
    let errors = 0;

    // Ajouter chaque nouvelle unité
    for (const unit of newUnits) {
      try {
        console.log(`[${added + errors + 1}/${newUnits.length}] Ajout de: ${unit}`);
        
        // Utiliser directement les requêtes SQL pour ajouter la nouvelle unité
        const currentEnum = await Enum.getEnumValues('units', 'hardness_units');
        
        if (currentEnum.error) {
          console.log(`❌ Échec pour ${unit}: ${currentEnum.error}`);
          errors++;
          continue;
        }
        
        // Vérifier si la valeur existe déjà
        if (currentEnum.values.includes(unit)) {
          console.log(`⚠️  ${unit} existe déjà, ignoré`);
          continue;
        }
        
        // Ajouter la nouvelle valeur à la liste
        const newValues = [...currentEnum.values, unit];
        
        // Construire la requête SQL pour modifier la colonne ENUM
        const enumDefinition = newValues.map(val => `'${val.replace(/'/g, "''")}'`).join(',');
        const query = `ALTER TABLE units MODIFY COLUMN hardness_units ENUM(${enumDefinition})`;
        
        // Exécuter la requête
        await sequelize.query(query);
        
        console.log(`✅ Unité ajoutée: ${unit}`);
        added++;
      } catch (error) {
        console.error(`❌ Erreur pour ${unit}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DE L\'AJOUT DES UNITÉS');
    console.log('='.repeat(50));
    console.log(`🔢 Unités trouvées: ${uniqueUnits.length}`);
    console.log(`📈 Unités existantes: ${existingUnits.length}`);
    console.log(`🆕 Nouvelles unités: ${newUnits.length}`);
    console.log(`✅ Unités ajoutées: ${added}`);
    console.log(`❌ Erreurs: ${errors}`);
    
    if (added > 0) {
      console.log(`📊 Taux de réussite: ${((added / newUnits.length) * 100).toFixed(1)}%`);
    }

    // Afficher le résumé des unités trouvées avec leurs occurrences
    console.log('\n📋 DÉTAIL DES UNITÉS TROUVÉES:');
    console.log('='.repeat(50));
    
    // Compter les occurrences de chaque unité
    const unitCounts = {};
    
    for (const part of partsData) {
      if (part.specifications) {
        // Compter dans hardnessSpecs
        if (part.specifications.hardnessSpecs && Array.isArray(part.specifications.hardnessSpecs)) {
          for (const hardnessSpec of part.specifications.hardnessSpecs) {
            if (hardnessSpec.unit && hardnessSpec.unit.trim()) {
              const unit = hardnessSpec.unit.trim();
              unitCounts[unit] = (unitCounts[unit] || 0) + 1;
            }
          }
        }

        // Compter dans ecdSpecs
        if (part.specifications.ecdSpecs && Array.isArray(part.specifications.ecdSpecs)) {
          for (const ecdSpec of part.specifications.ecdSpecs) {
            if (ecdSpec.hardnessUnit && ecdSpec.hardnessUnit.trim()) {
              const unit = ecdSpec.hardnessUnit.trim();
              unitCounts[unit] = (unitCounts[unit] || 0) + 1;
            }
          }
        }
      }
    }

    // Trier par nombre d'occurrences (décroissant)
    const sortedUnits = Object.entries(unitCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([unit, count]) => ({ unit, count }));

    sortedUnits.forEach(({ unit, count }) => {
      const status = existingUnits.includes(unit) ? '✅ Existant' : 
                    newUnits.includes(unit) ? '🆕 Ajouté' : '❓ Statut inconnu';
      console.log(`  ${unit}: ${count} occurrences - ${status}`);
    });

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Connexion fermée');
  }
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log(`
🔧 EXTRACTEUR D'UNITÉS DE DURETÉ - ECM

Usage: node extract_hardness_units.js

Ce script analyse le fichier parts_to_import.json et :
1. Extrait toutes les unités de dureté utilisées
2. Identifie les unités déjà présentes dans la base
3. Ajoute les nouvelles unités à la colonne hardness_units de la table units

Les unités sont extraites depuis :
- specifications.hardnessSpecs[].unit
- specifications.ecdSpecs[].hardnessUnit

Pré-requis :
- Le fichier parts_to_import.json doit être présent dans le même dossier
- La connexion à la base de données doit être fonctionnelle
- Le service enumService doit être accessible

`);
}

// Gestion des arguments de ligne de commande
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Gestion des signaux pour une fermeture propre
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interruption détectée (Ctrl+C)');
  console.log('🔌 Fermeture de la connexion à la base de données...');
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Erreur lors de la fermeture:', error.message);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Signal de terminaison reçu');
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Erreur lors de la fermeture:', error.message);
  }
  process.exit(0);
});

// Lancer le script
if (require.main === module) {
  extractHardnessUnits();
}

module.exports = { extractHardnessUnits };
