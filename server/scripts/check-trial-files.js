/**
 * Script pour vérifier les fichiers d'un trial spécifique
 */

const { sequelize } = require('../models');

const trialId = process.argv[2] || 500;

async function checkTrialFiles() {
  try {
    console.log(`\n🔍 Vérification des fichiers du trial ${trialId}...\n`);

    // Récupérer tous les fichiers du trial avec leurs subcategories
    const [files] = await sequelize.query(`
      SELECT 
        f.node_id,
        n.name,
        f.category,
        f.subcategory,
        f.original_name,
        f.context
      FROM files f
      JOIN nodes n ON f.node_id = n.id
      JOIN closure c ON n.id = c.descendant_id
      WHERE c.ancestor_id = ?
        AND (f.category = 'micrographs' OR f.category = 'control-location')
      ORDER BY f.category, f.subcategory, f.original_name
    `, {
      replacements: [trialId]
    });

    console.log(`📊 Total: ${files.length} fichiers trouvés\n`);

    if (files.length === 0) {
      console.log('❌ Aucun fichier trouvé pour ce trial!\n');
      return;
    }

    // Grouper par catégorie
    const byCategory = {};
    files.forEach(f => {
      if (!byCategory[f.category]) byCategory[f.category] = [];
      byCategory[f.category].push(f);
    });

    Object.entries(byCategory).forEach(([category, categoryFiles]) => {
      console.log(`\n📁 Catégorie: ${category} (${categoryFiles.length} fichiers)`);
      
      // Grouper par subcategory
      const bySubcat = {};
      categoryFiles.forEach(f => {
        const subcat = f.subcategory || 'NULL';
        if (!bySubcat[subcat]) bySubcat[subcat] = [];
        bySubcat[subcat].push(f);
      });

      Object.entries(bySubcat).forEach(([subcat, subcatFiles]) => {
        console.log(`  📂 Subcategory: "${subcat}" (${subcatFiles.length} fichiers)`);
        subcatFiles.forEach(f => {
          const context = typeof f.context === 'string' ? JSON.parse(f.context) : f.context;
          console.log(`     - ${f.original_name}`);
          console.log(`       Context: sample_number=${context?.sample_number}, result_index=${context?.result_index}`);
        });
      });
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sequelize.close();
  }
}

checkTrialFiles();
